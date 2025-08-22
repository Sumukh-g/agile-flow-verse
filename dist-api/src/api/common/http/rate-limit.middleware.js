"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitMiddleware = RateLimitMiddleware;
const redis_client_1 = require("../redis/redis.client");
// Defaults: 120 req/min per-tenant, 60 req/min per-ip
const TENANT_LIMIT = Number(process.env.TENANT_RL_PER_MIN || 120);
const IP_LIMIT = Number(process.env.IP_RL_PER_MIN || 60);
async function RateLimitMiddleware(req, res, next) {
    try {
        const redis = (0, redis_client_1.getRedis)();
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
        const tenantId = req.headers['x-tenant-id'] || 'unknown';
        const nowWindow = Math.floor(Date.now() / 60000); // minute window
        const ipKey = `rl:ip:${ip}:${nowWindow}`;
        const tenantKey = `rl:tenant:${tenantId}:${nowWindow}`;
        const [ipCount, tenantCount] = await Promise.all([
            redis.incr(ipKey),
            redis.incr(tenantKey),
        ]);
        if (ipCount === 1)
            await redis.expire(ipKey, 60);
        if (tenantCount === 1)
            await redis.expire(tenantKey, 60);
        if (ipCount > IP_LIMIT) {
            return res.status(429).json({
                traceId: req.traceId,
                code: 'RateLimited',
                message: 'Too many requests from this IP',
                details: { limit: IP_LIMIT },
            });
        }
        if (tenantCount > TENANT_LIMIT) {
            return res.status(429).json({
                traceId: req.traceId,
                code: 'RateLimited',
                message: 'Too many requests for this tenant',
                details: { limit: TENANT_LIMIT },
            });
        }
        next();
    }
    catch {
        next();
    }
}
