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
var EnhancedAnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_client_1 = require("../common/redis/redis.client");
let EnhancedAnalyticsService = EnhancedAnalyticsService_1 = class EnhancedAnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(EnhancedAnalyticsService_1.name);
    }
    /**
     * Get performance metrics for a project or tenant
     */
    async getPerformanceMetrics(tenantId, projectId, days = 30) {
        const cacheKey = `analytics:performance:${tenantId}:${projectId || 'all'}:${days}`;
        const redis = (0, redis_client_1.getRedis)();
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const where = {
            tenantId,
            ...(projectId ? { projectId } : {}),
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        };
        // Get completed tasks for cycle time calculation
        const completedTasks = await this.prisma.tx.task.findMany({
            where: {
                ...where,
                status: 'done',
            },
            select: {
                createdAt: true,
                updatedAt: true,
            },
        });
        // Calculate cycle time (time from in-progress to done)
        const cycleTimes = completedTasks.map((task) => {
            // For simplicity, using createdAt to updatedAt as cycle time
            // In reality, you'd track when status changed to 'in-progress'
            return task.updatedAt.getTime() - task.createdAt.getTime();
        });
        const cycleTime = cycleTimes.length > 0
            ? cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length / (1000 * 60 * 60 * 24) // Convert to days
            : 0;
        // Lead time (creation to completion)
        const leadTime = cycleTime; // Simplified - same as cycle time for now
        // Throughput (tasks completed per week)
        const weeks = days / 7;
        const throughput = completedTasks.length / weeks;
        // Work in progress
        const wip = await this.prisma.tx.task.count({
            where: {
                tenantId,
                ...(projectId ? { projectId } : {}),
                status: 'in-progress',
            },
        });
        // Blockers
        const blockers = await this.prisma.tx.task.count({
            where: {
                tenantId,
                ...(projectId ? { projectId } : {}),
                isBlocked: true,
            },
        });
        const metrics = {
            cycleTime,
            leadTime,
            throughput,
            workInProgress: wip,
            blockers,
        };
        await redis.setex(cacheKey, 300, JSON.stringify(metrics));
        return metrics;
    }
    /**
     * Get trend data over time
     */
    async getTrendData(tenantId, metric, projectId, days = 30, groupBy = 'day') {
        const cacheKey = `analytics:trend:${tenantId}:${metric}:${projectId || 'all'}:${days}:${groupBy}`;
        const redis = (0, redis_client_1.getRedis)();
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const interval = groupBy === 'day' ? 1 : groupBy === 'week' ? 7 : 30;
        const trendData = [];
        for (let i = 0; i <= days; i += interval) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + i);
            const nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() + interval);
            const where = {
                tenantId,
                ...(projectId ? { projectId } : {}),
                createdAt: {
                    gte: currentDate,
                    lt: nextDate,
                },
            };
            let value = 0;
            let label = '';
            switch (metric) {
                case 'tasks':
                    value = await this.prisma.tx.task.count({ where });
                    label = `Tasks created`;
                    break;
                case 'projects':
                    value = await this.prisma.tx.project.count({ where });
                    label = `Projects created`;
                    break;
                case 'completion':
                    const completed = await this.prisma.tx.task.count({
                        where: {
                            ...where,
                            status: 'done',
                        },
                    });
                    const total = await this.prisma.tx.task.count({
                        where: {
                            tenantId,
                            ...(projectId ? { projectId } : {}),
                            createdAt: {
                                lt: nextDate,
                            },
                        },
                    });
                    value = total > 0 ? (completed / total) * 100 : 0;
                    label = `Completion rate`;
                    break;
                case 'velocity':
                    value = await this.prisma.tx.task.count({
                        where: {
                            ...where,
                            status: 'done',
                        },
                    });
                    label = `Tasks completed`;
                    break;
            }
            trendData.push({
                date: currentDate.toISOString().split('T')[0],
                value,
                label,
            });
        }
        await redis.setex(cacheKey, 300, JSON.stringify(trendData));
        return trendData;
    }
    /**
     * Get workload analysis for team members
     */
    async getWorkloadAnalysis(tenantId, projectId) {
        const cacheKey = `analytics:workload:${tenantId}:${projectId || 'all'}`;
        const redis = (0, redis_client_1.getRedis)();
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const where = {
            tenantId,
            ...(projectId ? { projectId } : {}),
        };
        // Get all users with their tasks
        const users = await this.prisma.tx.user.findMany({
            where: { tenantId },
            include: {
                taskAssignees: {
                    where: {
                        task: where,
                    },
                    include: {
                        task: {
                            select: {
                                status: true,
                                dueDate: true,
                                estimatedHours: true,
                                actualHours: true,
                            },
                        },
                    },
                },
                timesheets: {
                    where: {
                        task: where,
                    },
                },
            },
        });
        const workloadData = users.map((user) => {
            const assignedTasks = user.taskAssignees.length;
            const completedTasks = user.taskAssignees.filter((ta) => ta.task.status === 'done').length;
            const inProgressTasks = user.taskAssignees.filter((ta) => ta.task.status === 'in-progress').length;
            const now = new Date();
            const overdueTasks = user.taskAssignees.filter((ta) => ta.task.dueDate && ta.task.dueDate < now && ta.task.status !== 'done').length;
            const estimatedHours = user.taskAssignees.reduce((sum, ta) => sum + (ta.task.estimatedHours || 0), 0);
            const loggedHours = user.timesheets.reduce((sum, ts) => sum + ts.hours, 0);
            // Workload percentage (estimated hours / 40 hours per week)
            const standardWeekHours = 40;
            const workloadPercentage = (estimatedHours / standardWeekHours) * 100;
            return {
                userId: user.id,
                userName: user.name,
                assignedTasks,
                completedTasks,
                inProgressTasks,
                overdueTasks,
                estimatedHours,
                loggedHours,
                workloadPercentage,
            };
        });
        await redis.setex(cacheKey, 300, JSON.stringify(workloadData));
        return workloadData;
    }
    /**
     * Get forecast based on historical data
     */
    async getForecast(tenantId, projectId, targetDate) {
        const project = await this.prisma.tx.project.findFirst({
            where: { id: projectId, tenantId },
            include: { tasks: true },
        });
        if (!project) {
            throw new Error('Project not found');
        }
        const completedTasks = project.tasks.filter((t) => t.status === 'done').length;
        const totalTasks = project.tasks.length;
        const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
        // Simple forecast based on current progress
        const remainingTasks = totalTasks - completedTasks;
        const avgTasksPerDay = completionRate > 0 ? completedTasks / (completionRate * 30) : 0; // Simplified
        const daysToComplete = avgTasksPerDay > 0 ? remainingTasks / avgTasksPerDay : 0;
        const predictedDate = new Date();
        predictedDate.setDate(predictedDate.getDate() + daysToComplete);
        const riskFactors = [];
        if (completionRate < 0.3)
            riskFactors.push('Low completion rate');
        if (daysToComplete > 30)
            riskFactors.push('Long remaining timeline');
        const overdueTasks = project.tasks.filter((t) => t.dueDate && t.dueDate < new Date() && t.status !== 'done').length;
        if (overdueTasks > 0)
            riskFactors.push(`${overdueTasks} overdue tasks`);
        const confidence = Math.max(0, Math.min(100, 100 - (riskFactors.length * 20)));
        return {
            predictedCompletion: predictedDate.toISOString(),
            confidence,
            riskFactors,
        };
    }
};
exports.EnhancedAnalyticsService = EnhancedAnalyticsService;
exports.EnhancedAnalyticsService = EnhancedAnalyticsService = EnhancedAnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EnhancedAnalyticsService);
