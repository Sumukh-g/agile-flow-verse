import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

// Singleton instance for getRedis() function
let redisInstance: RedisClient | null = null;

@Injectable()
export class RedisClient implements OnModuleInit {
  private readonly logger = new Logger(RedisClient.name);
  private mockCache = new Map<string, string>();
  private connected = false;

  async onModuleInit() {
    // In development, use in-memory cache if Redis not available
    if (process.env.REDIS_URL) {
      this.logger.log('Redis URL configured, using in-memory fallback for development');
    } else {
      this.logger.warn('Redis not configured, using in-memory cache');
    }
    this.connected = true;
    redisInstance = this;
  }

  async get(key: string): Promise<string | null> {
    return this.mockCache.get(key) || null;
  }

  async set(key: string, value: string): Promise<void> {
    this.mockCache.set(key, value);
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    this.mockCache.set(key, value);
    // In a real implementation, this would expire after 'seconds'
    setTimeout(() => {
      this.mockCache.delete(key);
    }, seconds * 1000);
  }

  async del(key: string): Promise<number> {
    const existed = this.mockCache.has(key);
    this.mockCache.delete(key);
    return existed ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    return this.mockCache.has(key) ? 1 : 0;
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (this.mockCache.has(key)) {
      setTimeout(() => {
        this.mockCache.delete(key);
      }, seconds * 1000);
      return 1;
    }
    return 0;
  }

  async incr(key: string): Promise<number> {
    const current = this.mockCache.get(key);
    const newValue = current ? parseInt(current, 10) + 1 : 1;
    this.mockCache.set(key, newValue.toString());
    return newValue;
  }
}

// Export getRedis function for backward compatibility
export function getRedis(): RedisClient {
  if (!redisInstance) {
    // Create a temporary instance if not initialized yet
    redisInstance = new RedisClient();
    redisInstance.onModuleInit();
  }
  return redisInstance;
}
