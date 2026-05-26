import Redis, { type RedisOptions } from 'ioredis';

const redisOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: process.env.NODE_ENV === 'production' ? {} : undefined,
};

export const queueRedis = new Redis(process.env.REDIS_URL!, redisOptions);
export const workerRedis = new Redis(process.env.REDIS_URL!, redisOptions);
export const subRedis = new Redis(process.env.REDIS_URL!, redisOptions);
export const cacheRedis = new Redis(process.env.REDIS_URL!, redisOptions);
