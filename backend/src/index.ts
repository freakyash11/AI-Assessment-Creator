import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';

import { connectMongo, disconnectMongo } from './lib/mongo';
import { connectRedis, disconnectRedis } from './lib/redis';
import { closeQueues } from './lib/queue';
import { initWebSocket, closeWebSocket } from './lib/socket';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';

// Routes
import healthRouter from './routes/health';
import assignmentRouter from './routes/assignment.routes';
import paperRouter from './routes/paper.routes';
import { startAssessmentWorker } from './workers/assessment.worker';

// ─────────────────────────────────────────────────────────────────────────────
// App setup
// ─────────────────────────────────────────────────────────────────────────────

const app = express();
const httpServer = createServer(app);

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan('dev'));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/api/assignments', assignmentRouter);
app.use('/api/papers', paperRouter);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found', code: 404 });
});

// ── Error handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT) || 5000;

// Tracks whether httpServer.listen() has successfully completed.
// Used to guard server.close() in shutdown — calling it on a server
// that never started throws ERR_SERVER_NOT_RUNNING.
let isServerRunning = false;

async function bootstrap(): Promise<void> {
  // 1. Connect to persistence layers
  await connectMongo();
  await connectRedis();

  // 2. Attach WebSocket to the same HTTP server
  initWebSocket(httpServer);

  // 2.5 Start background workers
  startAssessmentWorker();

  // 3. Start listening
  await new Promise<void>((resolve) => {
    httpServer.listen(PORT, () => {
      isServerRunning = true;
      console.log(`\n🚀 VedaAI API  →  http://localhost:${PORT}/api`);
      console.log(`🔌 WebSocket   →  ws://localhost:${PORT}/ws`);
      console.log(`🌍 Environment → ${process.env.NODE_ENV ?? 'development'}\n`);
      resolve();
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Graceful shutdown
// ─────────────────────────────────────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  console.log(`\n[Server] Received ${signal} — shutting down gracefully…`);

  // Only close the HTTP server if it actually started listening.
  // Skipping this guard throws ERR_SERVER_NOT_RUNNING when startup failed.
  if (isServerRunning) {
    await new Promise<void>((resolve) =>
      httpServer.close((err) => {
        if (err) console.warn('[Server] ⚠️  HTTP close warning:', err.message);
        resolve();
      })
    );
  }

  // Close WebSocket independently of HTTP server state
  try { await closeWebSocket(); } catch { /* already closed */ }

  // Close BullMQ queues
  try { await closeQueues(); } catch { /* already closed */ }

  // Quit Redis — may already be disconnected if startup failed
  try { await disconnectRedis(); } catch { /* already closed */ }

  // Close Mongoose — may never have connected if startup failed
  try { await disconnectMongo(); } catch { /* already closed */ }

  console.log('[Server] ✅ Graceful shutdown complete');
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Catch unhandled promise rejections so the process doesn't crash silently
process.on('unhandledRejection', (reason) => {
  console.error('[Server] ❌ Unhandled rejection:', reason);
});

// ─────────────────────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────────────────────

async function startServer(): Promise<void> {
  try {
    await bootstrap();
  } catch (err) {
    console.error('[Server] ❌ Failed to start:', (err as Error).message);
    process.exit(1);
  }
}

startServer();

export default app;
