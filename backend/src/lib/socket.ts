import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { v4 as uuidv4 } from 'uuid';
import type { WsMessage, WsClientMeta } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

let wss: WebSocketServer | null = null;

/**
 * Map of clientId → WebSocket connection.
 * Used for targeted message delivery via sendToClient().
 */
const clients = new Map<string, WebSocket>();

/**
 * Metadata store: clientId → WsClientMeta.
 * Tracks connection time and optional userId.
 */
const clientMeta = new Map<string, WsClientMeta>();

// ─────────────────────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialise the WebSocket server and attach it to an existing HTTP server.
 *
 * @param server  The Node.js HTTP server returned by `createServer(app)`.
 */
export function initWebSocket(server: Server): WebSocketServer {
  // Attach to the existing HTTP server with NO path filter.
  // A path filter (path: '/ws') causes the ws library to reject upgrade
  // requests that arrive on '/' (e.g. plain `wscat -c ws://host:port`)
  // with HTTP 400. Removing it lets the WSS handle all upgrade events
  // on this server; routing by path can be done inside the handler if needed.
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket, req) => {
    // Honour a clientId supplied in the query string, or generate one.
    const params = new URLSearchParams(req.url?.split('?')[1] ?? '');
    const clientId = params.get('clientId') || uuidv4();

    clients.set(clientId, ws);
    clientMeta.set(clientId, { clientId, connectedAt: new Date() });

    const ip = req.socket.remoteAddress ?? 'unknown';
    console.log(`[WS] ✅ Client connected: ${clientId} (${ip})`);

    // Confirm connection and return the assigned clientId
    ws.send(JSON.stringify({ type: 'connected', clientId }));

    // ── Inbound messages ────────────────────────────────────────────────────
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as WsMessage;
        
        if ((msg as any).type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        console.log(`[WS] 📨 Message from ${clientId}:`, msg.type);

        // Allow clients to associate a userId with their connection
        if (msg.type === 'auth' && typeof (msg.payload as Record<string, unknown>).userId === 'string') {
          const meta = clientMeta.get(clientId);
          if (meta) {
            meta.userId = (msg.payload as { userId: string }).userId;
            clientMeta.set(clientId, meta);
          }
        }
      } catch {
        send(ws, { type: 'error', payload: { message: 'Invalid JSON' }, timestamp: new Date().toISOString() });
      }
    });

    // ── Disconnect ──────────────────────────────────────────────────────────
    ws.on('close', () => {
      clients.delete(clientId);
      clientMeta.delete(clientId);
      console.log(`[WS] 🔌 Client disconnected: ${clientId}`);
    });

    ws.on('error', (err) => {
      console.error(`[WS] ❌ Error on ${clientId}:`, err.message);
    });
  });

  wss.on('error', (err) => {
    console.error('[WS] ❌ Server error:', err.message);
  });

  console.log('[WS] 🔌 WebSocket server initialised (attached to HTTP server)');
  return wss;
}

// ─────────────────────────────────────────────────────────────────────────────
// Message delivery
// ─────────────────────────────────────────────────────────────────────────────

/** Internal: send a typed WsMessage to a single ws connection. */
function send(ws: WebSocket, message: WsMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Send a message to a specific connected client by its clientId.
 *
 * @param clientId  UUID assigned on connection.
 * @param payload   Arbitrary payload — will be wrapped in WsMessage.
 * @returns         true if the client was found and message was sent.
 */
export function sendToClient(clientId: string, payload: WsMessage): boolean {
  const ws = clients.get(clientId);
  if (!ws) {
    console.warn(`[WS] ⚠️  sendToClient — unknown clientId: ${clientId}`);
    return false;
  }
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
  return true;
}

/**
 * Broadcast a message to ALL currently connected clients.
 *
 * @param payload  The WsMessage to broadcast.
 */
export function broadcastAll(payload: WsMessage): void {
  if (!wss) return;
  const serialised = JSON.stringify(payload);
  let count = 0;

  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(serialised);
      count++;
    }
  });

  console.log(`[WS] 📡 Broadcast sent to ${count} client(s): ${payload.type}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Accessors
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the underlying WebSocketServer instance. */
export function getWss(): WebSocketServer {
  if (!wss) throw new Error('[WS] Server not initialised — call initWebSocket() first');
  return wss;
}

/** Returns a snapshot of currently connected client IDs. */
export function getConnectedClients(): string[] {
  return [...clients.keys()];
}

/** Returns the raw clients Map (clientId → WebSocket). */
export function getClients(): Map<string, WebSocket> {
  return clients;
}

/** Look up metadata for a given clientId. */
export function getClientMeta(clientId: string): WsClientMeta | undefined {
  return clientMeta.get(clientId);
}

/** Gracefully close the WebSocket server. */
export async function closeWebSocket(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    if (!wss) return resolve();
    wss.close((err) => (err ? reject(err) : resolve()));
  });
  console.log('[WS] 🔌 WebSocket server closed');
}
