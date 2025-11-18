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
var CalendarService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const common_1 = require("@nestjs/common");
const redis_client_1 = require("../common/redis/redis.client");
const prisma_service_1 = require("../prisma/prisma.service");
let CalendarService = CalendarService_1 = class CalendarService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        this.logger = new common_1.Logger(CalendarService_1.name);
    }
    async getCalendarEvents(tenantId, userId, startDate, endDate) {
        const cacheKey = `calendar:${tenantId}:${userId}:${startDate}:${endDate}`;
        // Try to get from cache first
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const where = { tenantId };
        if (startDate && endDate) {
            where.dueDate = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }
        // Get tasks as calendar events
        const tasks = await this.prisma.tx.task.findMany({
            where: {
                ...where,
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
            orderBy: { dueDate: 'asc' },
        });
        // Get project deadlines
        const projectDeadlines = await this.prisma.tx.project.findMany({
            where: {
                tenantId,
                endDate: {
                    gte: startDate ? new Date(startDate) : undefined,
                    lte: endDate ? new Date(endDate) : undefined,
                },
            },
            select: {
                id: true,
                name: true,
                endDate: true,
                status: true,
            },
        });
        // Transform tasks to calendar events
        const taskEvents = tasks.map(task => ({
            id: `task-${task.id}`,
            title: task.title,
            description: task.description,
            start: task.dueDate,
            end: task.dueDate,
            type: 'task',
            priority: task.priority,
            status: task.status,
            project: task.project,
            assignees: task.assignees.map(a => a.user),
            color: this.getTaskColor(task.status, task.priority),
            source: 'tasks',
        }));
        // Transform project deadlines to calendar events
        const projectEvents = projectDeadlines.map(project => ({
            id: `project-${project.id}`,
            title: `${project.name} Deadline`,
            description: `Project deadline for ${project.name}`,
            start: project.endDate,
            end: project.endDate,
            type: 'project',
            status: project.status,
            project: { id: project.id, name: project.name },
            color: this.getProjectColor(project.status),
            source: 'projects',
        }));
        const events = [...taskEvents, ...projectEvents];
        // Cache for 5 minutes
        await this.redis.setex(cacheKey, 300, JSON.stringify(events));
        return events;
    }
    async getProjectCalendar(tenantId, projectId, startDate, endDate) {
        const cacheKey = `calendar:project:${tenantId}:${projectId}:${startDate}:${endDate}`;
        // Try to get from cache first
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const where = { tenantId, projectId };
        if (startDate && endDate) {
            where.dueDate = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }
        const tasks = await this.prisma.tx.task.findMany({
            where,
            include: {
                assignees: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
            },
            orderBy: { dueDate: 'asc' },
        });
        const events = tasks.map(task => ({
            id: `task-${task.id}`,
            title: task.title,
            description: task.description,
            start: task.dueDate,
            end: task.dueDate,
            type: 'task',
            priority: task.priority,
            status: task.status,
            assignees: task.assignees.map(a => a.user),
            color: this.getTaskColor(task.status, task.priority),
            source: 'project-tasks',
        }));
        // Cache for 5 minutes
        await this.redis.setex(cacheKey, 300, JSON.stringify(events));
        return events;
    }
    async getPersonalCalendar(tenantId, userId, startDate, endDate) {
        const cacheKey = `calendar:personal:${tenantId}:${userId}:${startDate}:${endDate}`;
        // Try to get from cache first
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const where = { tenantId };
        if (startDate && endDate) {
            where.dueDate = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }
        // Get user's assigned tasks
        const tasks = await this.prisma.tx.task.findMany({
            where: {
                ...where,
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
            orderBy: { dueDate: 'asc' },
        });
        const events = tasks.map(task => ({
            id: `task-${task.id}`,
            title: task.title,
            description: task.description,
            start: task.dueDate,
            end: task.dueDate,
            type: 'task',
            priority: task.priority,
            status: task.status,
            project: task.project,
            assignees: task.assignees.map(a => a.user),
            color: this.getTaskColor(task.status, task.priority),
            source: 'personal',
        }));
        // Cache for 5 minutes
        await this.redis.setex(cacheKey, 300, JSON.stringify(events));
        return events;
    }
    async getAllProjectsCalendar(tenantId, startDate, endDate) {
        const cacheKey = `calendar:all-projects:${tenantId}:${startDate}:${endDate}`;
        // Try to get from cache first
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const where = { tenantId };
        if (startDate && endDate) {
            where.dueDate = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }
        const tasks = await this.prisma.tx.task.findMany({
            where,
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
        });
        const events = tasks.map(task => ({
            id: `task-${task.id}`,
            title: task.title,
            description: task.description,
            start: task.dueDate,
            end: task.dueDate,
            type: 'task',
            priority: task.priority,
            status: task.status,
            project: task.project,
            assignees: task.assignees.map(a => a.user),
            color: this.getTaskColor(task.status, task.priority),
            source: 'all-projects',
        }));
        // Cache for 5 minutes
        await this.redis.setex(cacheKey, 300, JSON.stringify(events));
        return events;
    }
    getTaskColor(status, priority) {
        if (status === 'done')
            return 'bg-green-100 text-green-800';
        if (status === 'in-progress')
            return 'bg-blue-100 text-blue-800';
        if (priority === 'high')
            return 'bg-red-100 text-red-800';
        if (priority === 'medium')
            return 'bg-yellow-100 text-yellow-800';
        return 'bg-gray-100 text-gray-800';
    }
    getProjectColor(status) {
        if (status === 'completed')
            return 'bg-green-100 text-green-800';
        if (status === 'active')
            return 'bg-blue-100 text-blue-800';
        if (status === 'on-hold')
            return 'bg-yellow-100 text-yellow-800';
        return 'bg-gray-100 text-gray-800';
    }
};
exports.CalendarService = CalendarService;
exports.CalendarService = CalendarService = CalendarService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_client_1.RedisClient])
], CalendarService);
