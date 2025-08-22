import { NextFunction, Request, Response } from 'express';
import { getRedis } from '../redis/redis.client';

// Defaults: 120 req/min per-tenant, 60 req/min per-ip
const TENANT_LIMIT = Number(process.env.TENANT_RL_PER_MIN || 120);
const IP_LIMIT = Number(process.env.IP_RL_PER_MIN || 60);

export async function RateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const redis = getRedis();
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) || 'unknown';

    const nowWindow = Math.floor(Date.now() / 60000); // minute window
    const ipKey = `rl:ip:${ip}:${nowWindow}`;
    const tenantKey = `rl:tenant:${tenantId}:${nowWindow}`;

    const [ipCount, tenantCount] = await Promise.all([
      redis.incr(ipKey),
      redis.incr(tenantKey),
    ]);
    if (ipCount === 1) await redis.expire(ipKey, 60);
    if (tenantCount === 1) await redis.expire(tenantKey, 60);

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