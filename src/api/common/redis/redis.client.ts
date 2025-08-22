import Redis from 'ioredis';

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    client = new Redis(url, { lazyConnect: true });
    client.on('error', (e) => console.error('Redis error', e));
  }
  return client;
} 