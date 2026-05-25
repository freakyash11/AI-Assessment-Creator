import mongoose from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5_000; // 5 s between attempts

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// Connection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Connect to MongoDB with retry logic.
 * Retries up to MAX_RETRIES times with a fixed delay between attempts.
 * Throws after all retries are exhausted.
 */
export async function connectMongo(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  // Register lifecycle event listeners once
  mongoose.connection.on('connected', () =>
    console.log('[MongoDB] ✅ Connected to database')
  );
  mongoose.connection.on('error', (err: Error) =>
    console.error('[MongoDB] ❌ Connection error:', err.message)
  );
  mongoose.connection.on('disconnected', () =>
    console.warn('[MongoDB] ⚠️  Disconnected — attempting reconnect…')
  );

  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      console.log(`[MongoDB] Connecting… (attempt ${attempt}/${MAX_RETRIES})`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5_000,
        socketTimeoutMS: 45_000,
      });
      return; // success
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[MongoDB] ❌ Attempt ${attempt} failed: ${message}`);

      if (attempt >= MAX_RETRIES) {
        throw new Error(
          `[MongoDB] Failed to connect after ${MAX_RETRIES} attempts: ${message}`
        );
      }

      console.log(`[MongoDB] Retrying in ${RETRY_INTERVAL_MS / 1000}s…`);
      await sleep(RETRY_INTERVAL_MS);
    }
  }
}

/**
 * Gracefully close the Mongoose connection.
 */
export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
  console.log('[MongoDB] 🔌 Connection closed');
}
