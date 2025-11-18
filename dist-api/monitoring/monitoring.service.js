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
var MonitoringService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringService = void 0;
const common_1 = require("@nestjs/common");
const redis_client_1 = require("../common/redis/redis.client");
const prisma_service_1 = require("../prisma/prisma.service");
let MonitoringService = MonitoringService_1 = class MonitoringService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(MonitoringService_1.name);
        this.startTime = Date.now();
    }
    async getHealth() {
        const [databaseHealth, redisHealth] = await Promise.allSettled([
            this.checkDatabase(),
            this.checkRedis(),
        ]);
        const services = {
            database: databaseHealth.status === 'fulfilled'
                ? databaseHealth.value
                : { status: 'unhealthy', error: databaseHealth.reason?.message },
            redis: redisHealth.status === 'fulfilled'
                ? redisHealth.value
                : { status: 'unhealthy', error: redisHealth.reason?.message },
        };
        const overallStatus = this.determineOverallStatus(services);
        return {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            services,
            metrics: {
                uptime: Date.now() - this.startTime,
                memory: process.memoryUsage(),
            },
        };
    }
    async checkDatabase() {
        try {
            const start = Date.now();
            await this.prisma.$queryRaw `SELECT 1`;
            const latency = Date.now() - start;
            return {
                status: 'healthy',
                latency,
            };
        }
        catch (error) {
            this.logger.error('Database health check failed:', error);
            return {
                status: 'unhealthy',
                error: error.message,
            };
        }
    }
    async checkRedis() {
        try {
            const redis = (0, redis_client_1.getRedis)();
            const start = Date.now();
            await redis.ping();
            const latency = Date.now() - start;
            return {
                status: 'healthy',
                latency,
            };
        }
        catch (error) {
            this.logger.error('Redis health check failed:', error);
            return {
                status: 'unhealthy',
                error: error.message,
            };
        }
    }
    determineOverallStatus(services) {
        const unhealthyCount = Object.values(services).filter((s) => s.status === 'unhealthy').length;
        const totalServices = Object.keys(services).length;
        if (unhealthyCount === 0) {
            return 'healthy';
        }
        else if (unhealthyCount < totalServices) {
            return 'degraded';
        }
        else {
            return 'unhealthy';
        }
    }
    async getMetrics() {
        return {
            uptime: Date.now() - this.startTime,
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            version: process.version,
            platform: process.platform,
        };
    }
    async getSystemMetrics() {
        return this.getMetrics();
    }
    async getTenantMetrics(tenantId) {
        // Get tenant-specific metrics
        try {
            const [projectCount, taskCount, userCount] = await Promise.all([
                this.prisma.project.count({ where: { tenantId } }),
                this.prisma.task.count({ where: { tenantId } }),
                this.prisma.user.count({ where: { tenantId } }),
            ]);
            return {
                tenantId,
                projects: projectCount,
                tasks: taskCount,
                users: userCount,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error(`Failed to get tenant metrics for ${tenantId}:`, error);
            throw error;
        }
    }
    async getPerformanceMetrics() {
        const memUsage = process.memoryUsage();
        return {
            memory: {
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                external: memUsage.external,
                rss: memUsage.rss,
            },
            cpu: process.cpuUsage(),
            uptime: Date.now() - this.startTime,
            eventLoopDelay: 0, // Would need perf_hooks for this
        };
    }
    async getErrorMetrics() {
        // In a real implementation, this would query error logs/metrics
        return {
            totalErrors: 0,
            errorsByType: {},
            recentErrors: [],
        };
    }
    async getHealthStatus() {
        return this.getHealth();
    }
    async getAuditLogs(tenantId, limit = 100) {
        try {
            return await this.prisma.auditLog.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
                take: Math.min(limit, 1000),
            });
        }
        catch (error) {
            this.logger.error(`Failed to get audit logs for ${tenantId}:`, error);
            throw error;
        }
    }
};
exports.MonitoringService = MonitoringService;
exports.MonitoringService = MonitoringService = MonitoringService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MonitoringService);
