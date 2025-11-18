"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const redis_client_1 = require("../redis/redis.client");
const WINDOW_SECONDS = 120;
let IdempotencyInterceptor = class IdempotencyInterceptor {
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();
        const keyHeader = req.headers['idempotency-key'] || '';
        const method = req.method.toUpperCase();
        // Only apply to mutating requests if key provided
        if (!keyHeader || !['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            return next.handle();
        }
        const tenantId = req.headers['x-tenant-id'] || 'unknown';
        const redisKey = `idem:${tenantId}:${keyHeader}`;
        return (0, rxjs_1.from)(this.handleIdempotency(redisKey, next, res));
    }
    async handleIdempotency(redisKey, next, res) {
        const redis = (0, redis_client_1.getRedis)();
        const cached = await redis.get(redisKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            res.status(parsed.status || 200);
            return parsed.body;
        }
        const result = await new Promise((resolve, reject) => {
            next
                .handle()
                .pipe((0, operators_1.map)((body) => {
                resolve(body);
                return body;
            }))
                .subscribe({ error: reject });
        });
        const status = res.statusCode || 200;
        await redis.setex(redisKey, WINDOW_SECONDS, JSON.stringify({ status, body: result }));
        return result;
    }
};
exports.IdempotencyInterceptor = IdempotencyInterceptor;
exports.IdempotencyInterceptor = IdempotencyInterceptor = __decorate([
    (0, common_1.Injectable)()
], IdempotencyInterceptor);
