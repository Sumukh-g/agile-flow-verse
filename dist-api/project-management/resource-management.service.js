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
var ResourceManagementService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceManagementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_client_1 = require("../common/redis/redis.client");
let ResourceManagementService = ResourceManagementService_1 = class ResourceManagementService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ResourceManagementService_1.name);
    }
    /**
     * Get resource allocations for a date range
     */
    async getResourceAllocations(tenantId, startDate, endDate, projectId) {
        const cacheKey = `resource:allocations:${tenantId}:${projectId || 'all'}:${startDate.toISOString()}:${endDate.toISOString()}`;
        const redis = (0, redis_client_1.getRedis)();
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const where = {
            tenantId,
            task: {
                startDate: {
                    lte: endDate,
                },
                dueDate: {
                    gte: startDate,
                },
            },
        };
        if (projectId) {
            where.task.projectId = projectId;
        }
        // Get all task assignments in the date range
        const assignments = await this.prisma.tx.taskAssignee.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                task: {
                    select: {
                        id: true,
                        title: true,
                        projectId: true,
                        startDate: true,
                        dueDate: true,
                        estimatedHours: true,
                        project: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        // Group by user
        const userAllocations = new Map();
        assignments.forEach((assignment) => {
            if (!userAllocations.has(assignment.userId)) {
                userAllocations.set(assignment.userId, {
                    userId: assignment.userId,
                    userName: assignment.user.name,
                    allocations: [],
                    totalAllocatedHours: 0,
                    capacityHours: this.calculateCapacity(startDate, endDate),
                    utilizationPercentage: 0,
                    availableHours: 0,
                });
            }
            const allocation = userAllocations.get(assignment.userId);
            allocation.allocations.push({
                projectId: assignment.task.projectId,
                projectName: assignment.task.project.name,
                taskId: assignment.task.id,
                taskName: assignment.task.title,
                startDate: assignment.task.startDate || startDate,
                endDate: assignment.task.dueDate || endDate,
                estimatedHours: assignment.task.estimatedHours || 0,
            });
            allocation.totalAllocatedHours += assignment.task.estimatedHours || 0;
        });
        // Calculate utilization and available hours
        const resources = [];
        const overallocated = [];
        const underutilized = [];
        userAllocations.forEach((allocation) => {
            allocation.utilizationPercentage = (allocation.totalAllocatedHours / allocation.capacityHours) * 100;
            allocation.availableHours = Math.max(0, allocation.capacityHours - allocation.totalAllocatedHours);
            resources.push(allocation);
            if (allocation.utilizationPercentage > 100) {
                overallocated.push(allocation.userId);
            }
            else if (allocation.utilizationPercentage < 50) {
                underutilized.push(allocation.userId);
            }
        });
        // Find conflicts (overlapping tasks)
        const conflicts = this.findScheduleConflicts(resources);
        const planningData = {
            resources,
            overallocated,
            underutilized,
            conflicts,
        };
        // Cache for 5 minutes
        await redis.setex(cacheKey, 300, JSON.stringify(planningData));
        return planningData;
    }
    /**
     * Suggest resource allocation for a task
     */
    async suggestResources(tenantId, taskId, requiredSkills) {
        const task = await this.prisma.tx.task.findFirst({
            where: { id: taskId, tenantId },
            include: {
                project: true,
            },
        });
        if (!task) {
            throw new Error('Task not found');
        }
        // Get all users in tenant
        const users = await this.prisma.tx.user.findMany({
            where: { tenantId },
            include: {
                taskAssignees: {
                    where: {
                        task: {
                            startDate: task.startDate ? {
                                lte: task.dueDate || new Date(),
                            } : undefined,
                            dueDate: task.dueDate ? {
                                gte: task.startDate || new Date(),
                            } : undefined,
                        },
                    },
                    include: {
                        task: true,
                    },
                },
            },
        });
        // Score each user
        const suggestions = users.map((user) => {
            let score = 100;
            const reasons = [];
            // Calculate workload during task period
            const concurrentTasks = user.taskAssignees.length;
            if (concurrentTasks === 0) {
                reasons.push('No conflicting tasks');
                score += 20;
            }
            else if (concurrentTasks > 3) {
                reasons.push(`Already assigned to ${concurrentTasks} tasks`);
                score -= 30;
            }
            // Check if user has worked on this project before
            const projectTasks = user.taskAssignees.filter((ta) => ta.task.projectId === task.projectId);
            if (projectTasks.length > 0) {
                reasons.push('Has experience with this project');
                score += 15;
            }
            // Calculate availability percentage
            const totalHours = user.taskAssignees.reduce((sum, ta) => sum + (ta.task.estimatedHours || 0), 0);
            const capacityHours = 40; // Standard week
            const availability = Math.max(0, 100 - (totalHours / capacityHours) * 100);
            if (availability > 80) {
                reasons.push('High availability');
                score += 10;
            }
            else if (availability < 20) {
                reasons.push('Low availability');
                score -= 20;
            }
            return {
                userId: user.id,
                userName: user.name,
                score,
                reason: reasons.join(', '),
                availability,
            };
        });
        // Sort by score and return top suggestions
        return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);
    }
    /**
     * Balance workload across team members
     */
    async balanceWorkload(tenantId, projectId, startDate, endDate) {
        const planningData = await this.getResourceAllocations(tenantId, startDate, endDate, projectId);
        const suggestions = [];
        // Find overallocated users
        const overallocatedResources = planningData.resources.filter((r) => planningData.overallocated.includes(r.userId));
        // Find underutilized users
        const underutilizedResources = planningData.resources.filter((r) => planningData.underutilized.includes(r.userId));
        // Suggest moving tasks from overallocated to underutilized
        for (const overallocated of overallocatedResources) {
            for (const underutilized of underutilizedResources) {
                // Find tasks that could be moved
                const movableTasks = overallocated.allocations
                    .filter((alloc) => {
                    const taskHours = alloc.estimatedHours;
                    return underutilized.availableHours >= taskHours;
                })
                    .sort((a, b) => a.estimatedHours - b.estimatedHours); // Move smallest tasks first
                if (movableTasks.length > 0) {
                    const task = movableTasks[0];
                    suggestions.push({
                        taskId: task.taskId,
                        taskName: task.taskName,
                        currentAssignee: overallocated.userId,
                        suggestedAssignee: underutilized.userId,
                        reason: `${overallocated.userName} is at ${overallocated.utilizationPercentage.toFixed(0)}% capacity, ${underutilized.userName} is at ${underutilized.utilizationPercentage.toFixed(0)}%`,
                    });
                    // Update virtual allocation for next iteration
                    overallocated.totalAllocatedHours -= task.estimatedHours;
                    overallocated.utilizationPercentage = (overallocated.totalAllocatedHours / overallocated.capacityHours) * 100;
                    underutilized.totalAllocatedHours += task.estimatedHours;
                    underutilized.utilizationPercentage = (underutilized.totalAllocatedHours / underutilized.capacityHours) * 100;
                    underutilized.availableHours -= task.estimatedHours;
                }
            }
        }
        // Calculate balance score (0-100, higher is better)
        const utilizationValues = planningData.resources.map((r) => r.utilizationPercentage);
        const avgUtilization = utilizationValues.reduce((sum, u) => sum + u, 0) / utilizationValues.length;
        const variance = utilizationValues.reduce((sum, u) => sum + Math.pow(u - avgUtilization, 2), 0) / utilizationValues.length;
        const stdDev = Math.sqrt(variance);
        const balanceScore = Math.max(0, 100 - stdDev);
        return {
            reallocationSuggestions: suggestions,
            balanceScore,
        };
    }
    /**
     * Get resource availability
     */
    async getResourceAvailability(tenantId, userId, startDate, endDate) {
        const assignments = await this.prisma.tx.taskAssignee.findMany({
            where: {
                tenantId,
                userId,
                task: {
                    startDate: {
                        lte: endDate,
                    },
                    dueDate: {
                        gte: startDate,
                    },
                },
            },
            include: {
                task: {
                    select: {
                        id: true,
                        title: true,
                        startDate: true,
                        dueDate: true,
                        estimatedHours: true,
                    },
                },
            },
        });
        const allocatedHours = assignments.reduce((sum, a) => sum + (a.task.estimatedHours || 0), 0);
        const capacityHours = this.calculateCapacity(startDate, endDate);
        const availableHours = Math.max(0, capacityHours - allocatedHours);
        return {
            available: availableHours > 0,
            allocatedHours,
            capacityHours,
            availableHours,
            tasks: assignments.map((a) => ({
                id: a.task.id,
                title: a.task.title,
                startDate: a.task.startDate || startDate,
                endDate: a.task.dueDate || endDate,
                estimatedHours: a.task.estimatedHours || 0,
            })),
        };
    }
    /**
     * Calculate capacity in hours for a date range
     */
    calculateCapacity(startDate, endDate) {
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const weeks = days / 7;
        const hoursPerWeek = 40; // Standard work week
        return weeks * hoursPerWeek;
    }
    /**
     * Find schedule conflicts (overlapping tasks for same resource)
     */
    findScheduleConflicts(resources) {
        const conflicts = [];
        resources.forEach((resource) => {
            const sortedAllocations = resource.allocations.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
            for (let i = 0; i < sortedAllocations.length - 1; i++) {
                const current = sortedAllocations[i];
                const next = sortedAllocations[i + 1];
                if (current.endDate > next.startDate) {
                    conflicts.push({
                        userId: resource.userId,
                        reason: 'Overlapping tasks',
                        tasks: [current.taskId, next.taskId],
                    });
                }
            }
        });
        return conflicts;
    }
};
exports.ResourceManagementService = ResourceManagementService;
exports.ResourceManagementService = ResourceManagementService = ResourceManagementService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ResourceManagementService);
