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
var DashboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const redis_client_1 = require("../common/redis/redis.client");
const prisma_service_1 = require("../prisma/prisma.service");
let DashboardService = DashboardService_1 = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(DashboardService_1.name);
    }
    async getDashboardData(tenantId, userId) {
        const cacheKey = `dashboard:${tenantId}:${userId}`;
        const redis = (0, redis_client_1.getRedis)();
        // Try to get from cache first
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const [recentTasks, upcomingTasks, projectStats, taskStats, recentActivity, notifications,] = await Promise.all([
            this.getRecentTasks(tenantId, userId),
            this.getUpcomingTasks(tenantId, userId),
            this.getProjectStats(tenantId),
            this.getTaskStats(tenantId, userId),
            this.getRecentActivity(tenantId, userId),
            this.getNotifications(tenantId, userId),
        ]);
        const dashboardData = {
            recentTasks,
            upcomingTasks,
            projectStats,
            taskStats,
            recentActivity,
            notifications,
            timestamp: new Date().toISOString(),
        };
        // Cache for 5 minutes
        await redis.setex(cacheKey, 300, JSON.stringify(dashboardData));
        return dashboardData;
    }
    async getRecentTasks(tenantId, userId) {
        return this.prisma.tx.task.findMany({
            where: {
                tenantId,
                assignees: {
                    some: { userId },
                },
            },
            include: {
                project: {
                    select: { id: true, name: true },
                },
                assignees: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
            take: 10,
        });
    }
    async getUpcomingTasks(tenantId, userId) {
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        return this.prisma.tx.task.findMany({
            where: {
                tenantId,
                assignees: {
                    some: { userId },
                },
                dueDate: {
                    gte: today,
                    lte: nextWeek,
                },
                status: {
                    not: 'done',
                },
            },
            include: {
                project: {
                    select: { id: true, name: true },
                },
                assignees: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
            },
            orderBy: { dueDate: 'asc' },
            take: 10,
        });
    }
    async getProjectStats(tenantId) {
        const [total, active, completed, onHold] = await Promise.all([
            this.prisma.tx.project.count({ where: { tenantId } }),
            this.prisma.tx.project.count({ where: { tenantId, status: 'active' } }),
            this.prisma.tx.project.count({ where: { tenantId, status: 'completed' } }),
            this.prisma.tx.project.count({ where: { tenantId, status: 'on-hold' } }),
        ]);
        return {
            total,
            active,
            completed,
            onHold,
        };
    }
    async getTaskStats(tenantId, userId) {
        const [total, todo, inProgress, done, overdue] = await Promise.all([
            this.prisma.tx.task.count({
                where: {
                    tenantId,
                    assignees: {
                        some: { userId },
                    },
                },
            }),
            this.prisma.tx.task.count({
                where: {
                    tenantId,
                    assignees: {
                        some: { userId },
                    },
                    status: 'todo',
                },
            }),
            this.prisma.tx.task.count({
                where: {
                    tenantId,
                    assignees: {
                        some: { userId },
                    },
                    status: 'in-progress',
                },
            }),
            this.prisma.tx.task.count({
                where: {
                    tenantId,
                    assignees: {
                        some: { userId },
                    },
                    status: 'done',
                },
            }),
            this.prisma.tx.task.count({
                where: {
                    tenantId,
                    assignees: {
                        some: { userId },
                    },
                    dueDate: {
                        lt: new Date(),
                    },
                    status: {
                        not: 'done',
                    },
                },
            }),
        ]);
        return {
            total,
            todo,
            inProgress,
            done,
            overdue,
        };
    }
    async getRecentActivity(tenantId, userId) {
        return this.prisma.tx.auditLog.findMany({
            where: { tenantId },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }
    async getNotifications(tenantId, userId) {
        return this.prisma.tx.notification.findMany({
            where: {
                tenantId,
                userId,
                read: false,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = DashboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
