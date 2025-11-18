"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_client_1 = require("../common/redis/redis.client");
let HealthController = class HealthController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    ok() {
        return { ok: true, ts: new Date().toISOString() };
    }
    async detailed() {
        const [dbHealth, redisHealth] = await Promise.allSettled([
            this.prisma.healthCheck(),
            this.checkRedis(),
        ]);
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            services: {
                database: dbHealth.status === 'fulfilled' ? dbHealth.value : { status: 'unhealthy' },
                redis: redisHealth.status === 'fulfilled' ? redisHealth.value : { status: 'unhealthy' },
            },
        };
    }
    async checkRedis() {
        try {
            const redis = (0, redis_client_1.getRedis)();
            const start = Date.now();
            await redis.ping();
            const latency = Date.now() - start;
            return { status: 'healthy', latency };
        }
        catch (error) {
            return { status: 'unhealthy' };
        }
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Basic health check' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service is healthy' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "ok", null);
__decorate([
    (0, common_1.Get)('detailed'),
    (0, swagger_1.ApiOperation)({ summary: 'Detailed health check with dependencies' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Detailed health status' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "detailed", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('health'),
    (0, common_1.Controller)('/v1/health'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HealthController);
