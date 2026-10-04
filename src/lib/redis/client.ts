import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

export const redis =
  globalForRedis.redis ||
  (globalForRedis.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 100, 3000),
    lazyConnect: true,
  }));

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export async function connectRedis() {
  if (!redis.status || redis.status === 'wait') {
    await redis.connect();
  }
  return redis;
}