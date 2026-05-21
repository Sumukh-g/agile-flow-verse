import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

// Singleton instance for getRedis() function
let redisInstance: RedisClient | null = null;

@Injectable()
export class RedisClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisClient.name);
  private client: Redis | null = null;
  private mockCache = new Map<string, string>();
  private useMock = false;
  private hasLoggedRedisError = false;

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    try {
      this.client = new Redis(redisUrl, {
        retryStrategy: (times) => {
          // We intentionally disable retries because this service has a
          // memory-cache fallback; retry storms can flood logs and hide signals.
          return null;
        },
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableOfflineQueue: false,
      });

      this.client.on('error', (error: Error) => {
        // ioredis emits "error" events even when commands handle exceptions.
        // Keep logging bounded and avoid unhandled event noise.
        if (!this.hasLoggedRedisError) {
          this.logger.warn(`Redis client error, using in-memory cache fallback: ${error.message}`);
          this.hasLoggedRedisError = true;
        }
      });

      await this.client.connect();
      const pong = await this.client.ping();
      
      if (pong === 'PONG') {
        this.logger.log('Redis connected successfully');
        this.useMock = false;
      } else {
        throw new Error('Redis ping failed');
      }
    } catch (error) {
      this.logger.warn(`Redis connection failed, using in-memory cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.useMock = true;
      if (this.client) {
        try {
          this.client.disconnect(false);
        } catch {
          // Ignore quit errors
        }
        this.client = null;
      }
    }
    
    redisInstance = this;
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis disconnected');
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.useMock || !this.client) {
      return this.mockCache.get(key) || null;
    }
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.warn(`Redis get failed for key ${key}, falling back to mock: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return this.mockCache.get(key) || null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    if (this.useMock || !this.client) {
      this.mockCache.set(key, value);
      return;
    }
    try {
      await this.client.set(key, value);
    } catch (error) {
      this.logger.warn(`Redis set failed for key ${key}, falling back to mock: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.mockCache.set(key, value);
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    if (this.useMock || !this.client) {
      this.mockCache.set(key, value);
      setTimeout(() => {
        this.mockCache.delete(key);
      }, seconds * 1000);
      return;
    }
    try {
      await this.client.setex(key, seconds, value);
    } catch (error) {
      this.logger.warn(`Redis setex failed for key ${key}, falling back to mock: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.mockCache.set(key, value);
      setTimeout(() => {
        this.mockCache.delete(key);
      }, seconds * 1000);
    }
  }

  async del(key: string): Promise<number> {
    if (this.useMock || !this.client) {
      const existed = this.mockCache.has(key);
      this.mockCache.delete(key);
      return existed ? 1 : 0;
    }
    try {
      return await this.client.del(key);
    } catch (error) {
      this.logger.warn(`Redis del failed for key ${key}, falling back to mock: ${error instanceof Error ? error.message : 'Unknown error'}`);
      const existed = this.mockCache.has(key);
      this.mockCache.delete(key);
      return existed ? 1 : 0;
    }
  }

  async delPattern(pattern: string): Promise<number> {
    if (this.useMock || !this.client) {
      let count = 0;
      for (const key of this.mockCache.keys()) {
        if (this.matchPattern(key, pattern)) {
          this.mockCache.delete(key);
          count++;
        }
      }
      return count;
    }
    try {
      const stream = this.client.scanStream({
        match: pattern,
        count: 100,
      });
      
      let deleted = 0;
      const pipeline = this.client.pipeline();
      
      stream.on('data', (keys: string[]) => {
        keys.forEach((key) => {
          pipeline.del(key);
          deleted++;
        });
      });
      
      return new Promise((resolve, reject) => {
        stream.on('end', async () => {
          if (deleted > 0) {
            await pipeline.exec();
          }
          resolve(deleted);
        });
        stream.on('error', reject);
      });
    } catch (error) {
      this.logger.warn(`Redis delPattern failed for pattern ${pattern}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return 0;
    }
  }

  private matchPattern(key: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(key);
  }

  async exists(key: string): Promise<number> {
    if (this.useMock || !this.client) {
      return this.mockCache.has(key) ? 1 : 0;
    }
    try {
      return await this.client.exists(key);
    } catch (error) {
      this.logger.warn(`Redis exists failed for key ${key}, falling back to mock: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return this.mockCache.has(key) ? 1 : 0;
    }
  }

  async ping(): Promise<string> {
    if (this.useMock || !this.client) {
      return 'PONG';
    }
    try {
      return await this.client.ping();
    } catch (error) {
      return 'PONG'; // Fallback
    }
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (this.useMock || !this.client) {
      if (this.mockCache.has(key)) {
        setTimeout(() => {
          this.mockCache.delete(key);
        }, seconds * 1000);
        return 1;
      }
      return 0;
    }
    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      this.logger.warn(`Redis expire failed for key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return 0;
    }
  }

  async incr(key: string): Promise<number> {
    if (this.useMock || !this.client) {
      const current = this.mockCache.get(key);
      const newValue = current ? parseInt(current, 10) + 1 : 1;
      this.mockCache.set(key, newValue.toString());
      return newValue;
    }
    try {
      return await this.client.incr(key);
    } catch (error) {
      this.logger.warn(`Redis incr failed for key ${key}, falling back to mock: ${error instanceof Error ? error.message : 'Unknown error'}`);
      const current = this.mockCache.get(key);
      const newValue = current ? parseInt(current, 10) + 1 : 1;
      this.mockCache.set(key, newValue.toString());
      return newValue;
    }
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
