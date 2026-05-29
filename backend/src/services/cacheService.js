import { redis } from '../config/redis.js';

export const cacheService = {
  async get(key) {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  },

  async set(key, value, ttlSeconds = 300) {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  },

  async del(key) {
    await redis.del(key);
  },
};
