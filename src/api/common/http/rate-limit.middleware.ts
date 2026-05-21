import { NextFunction, Request, Response } from 'express';
import { getRedis } from '../redis/redis.client';

// Rate limiting configuration based on environment
const RATE_LIMIT_WINDOW = process.env.NODE_ENV === 'production' 
  ? 15 * 60 * 1000  // 15 minutes in production
  : 60 * 1000;       // 1 minute in development

const MAX_REQUESTS_PER_TENANT = process.env.NODE_ENV === 'production'
  ? 100  // 100 requests per 15 minutes in production
  : 1000; // 1000 requests per minute in development

const MAX_REQUESTS_PER_IP = process.env.NODE_ENV === 'production'
  ? 50  // 50 requests per 15 minutes in production
  : 500; // 500 requests per minute in development

// Allow environment variable overrides
const TENANT_LIMIT = Number(process.env.TENANT_RL_PER_WINDOW) || MAX_REQUESTS_PER_TENANT;
const IP_LIMIT = Number(process.env.IP_RL_PER_WINDOW) || MAX_REQUESTS_PER_IP;
const WINDOW_MS = Number(process.env.RL_WINDOW_MS) || RATE_LIMIT_WINDOW;

export async function RateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const redis = getRedis();
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
    const tenantId = (req as any).user?.tenantId || 'unknown';

    const nowWindow = Math.floor(Date.now() / WINDOW_MS);
    const ipKey = `rl:ip:${ip}:${nowWindow}`;
    const tenantKey = `rl:tenant:${tenantId}:${nowWindow}`;

    const [ipCount, tenantCount] = await Promise.all([
      redis.incr(ipKey),
      redis.incr(tenantKey),
    ]);
    
    const ttlSeconds = Math.ceil(WINDOW_MS / 1000);
    if (ipCount === 1) await redis.expire(ipKey, ttlSeconds);
    if (tenantCount === 1) await redis.expire(tenantKey, ttlSeconds);

    if (ipCount > IP_LIMIT) {
      return res.status(429).json({
        traceId: (req as any).traceId,
        code: 'RateLimited',
        message: 'Too many requests from this IP',
        details: { limit: IP_LIMIT },
      });
    }
    if (tenantCount > TENANT_LIMIT) {
      return res.status(429).json({
        traceId: (req as any).traceId,
        code: 'RateLimited',
        message: 'Too many requests for this tenant',
        details: { limit: TENANT_LIMIT },
      });
    }

    next();
  } catch {
    next();
  }
} 