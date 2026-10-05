import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

export function isRedisConfigured(): boolean {
  return !!process.env.REDIS_URL;
}

export const redis =
  globalForRedis.redis ||
  (globalForRedis.redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: 2,
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 100, 1000)),
    lazyConnect: true,
    connectTimeout: 3000,
    enableOfflineQueue: false,
  }));

// Prevent unhandled error crashes when Redis is unreachable
redis.on('error', (err) => {
  if (process.env.NODE_ENV !== 'production') {
    // Only warn in dev if Redis was explicitly requested
    if (process.env.REDIS_URL) {
      console.warn('⚠️ [Redis]:', err.message);
    }
  }
});

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export async function connectRedis(): Promise<Redis | null> {
  if (!isRedisConfigured()) {
    return null;
  }
  try {
    if (!redis.status || redis.status === 'wait') {
      await redis.connect();
    }
    return redis;
  } catch (err: any) {
    console.warn('⚠️ [Redis] Connection failed, falling back to in-memory:', err?.message || err);
    return null;
  }
}