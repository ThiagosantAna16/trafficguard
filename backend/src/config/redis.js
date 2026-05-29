import Redis from 'ioredis';

let redis;

if (process.env.UPSTASH_REDIS_URL) {
  redis = new Redis(process.env.UPSTASH_REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  });
  redis.on('error', (err) => console.error('[Redis] Erro:', err.message));
  redis.on('connect', () => console.log('[Redis] Conectado ao Upstash'));
} else {
  // In-memory fallback for local development without Redis
  console.warn('[Redis] UPSTASH_REDIS_URL não definido — usando cache em memória');
  const store = new Map();
  const expiry = new Map();
  redis = {
    async get(key) {
      if (expiry.has(key) && Date.now() > expiry.get(key)) { store.delete(key); expiry.delete(key); return null; }
      return store.get(key) ?? null;
    },
    async set(key, value) { store.set(key, value); return 'OK'; },
    async setex(key, ttl, value) { store.set(key, value); expiry.set(key, Date.now() + ttl * 1000); return 'OK'; },
    async del(key) { store.delete(key); expiry.delete(key); return 1; },
    async incr(key) { const v = parseInt(store.get(key) || '0', 10) + 1; store.set(key, String(v)); return v; },
    async expire(key, ttl) { expiry.set(key, Date.now() + ttl * 1000); return 1; },
    on() {},
  };
}

export { redis };
