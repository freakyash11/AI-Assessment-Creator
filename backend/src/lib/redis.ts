import Redis from 'ioredis';

// ─────────────────────────────────────────────────────────────────────────────
// Singleton
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Exported singleton — use this directly anywhere that needs Redis access.
 * Initialised by calling connectRedis() at startup.
 */
export let redisClient: Redis;

// ─────────────────────────────────────────────────────────────────────────────
// Connection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create and configure the ioredis singleton.
 * Must be called once during server bootstrap (before BullMQ queues are created).
 */
export async function connectRedis(): Promise<Redis> {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error('REDIS_URL is not set in .env');
  }

  const isTls = url.startsWith('rediss://');

  redisClient = new Redis(url, {
    /**
     * BullMQ requires maxRetriesPerRequest = null.
     * Setting it to null makes ioredis retry commands indefinitely
     * instead of failing fast, which is what BullMQ expects.
     */
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    // Enable TLS for Upstash (rediss://) URLs
    ...(isTls ? { tls: {} } : {}),
    // Reconnect with jittered back-off; give up after 5 attempts
    retryStrategy: (times: number) => {
      if (times > 5) return null; // stop retrying
      const delay = Math.min(times * 200, 5_000); // cap at 5 s
      console.warn(`[Redis] Reconnect attempt ${times}, waiting ${delay}ms…`);
      return delay;
    },
  });

  redisClient.on('connect', () => console.log('[Redis] ✅ Connected'));
  redisClient.on('ready', () => console.log('[Redis] ✅ Ready'));
  redisClient.on('error', (err: Error) =>
    console.error('[Redis] ❌ Error:', err.message)
  );
  redisClient.on('close', () => console.warn('[Redis] 🔌 Connection closed'));
  redisClient.on('reconnecting', () =>
    console.warn('[Redis] 🔄 Reconnecting…')
  );

  // Verify connectivity before returning
  await redisClient.ping();
  console.log('[Redis] 🏓 PING OK');

  return redisClient;
}

/**
 * Gracefully quit the Redis connection.
 */
export async function disconnectRedis(): Promise<void> {
  await redisClient?.quit();
  console.log('[Redis] 🔌 Connection closed');
}
