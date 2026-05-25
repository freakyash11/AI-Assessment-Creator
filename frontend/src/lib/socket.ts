let socket: WebSocket | null = null;

export function connectWs(onMessage: (data: unknown) => void): WebSocket {
  const url =
    (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000') + '/ws';

  socket = new WebSocket(url);

  socket.onopen = () => console.log('[WS] Connected to VedaAI server');
  socket.onclose = () => console.log('[WS] Disconnected');
  socket.onerror = (err) => console.error('[WS] Error:', err);

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data as string) as unknown;
      onMessage(data);
    } catch {
      console.error('[WS] Failed to parse message', event.data);
    }
  };

  return socket;
}

export function sendWsMessage(data: unknown): void {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

export function disconnectWs(): void {
  socket?.close();
  socket = null;
}
