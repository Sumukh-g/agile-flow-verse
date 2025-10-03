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
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TasksService = class TasksService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async ensureProjectAccess(tenantId, userId, projectId) {
        const isMember = await this.prisma.projectMember.findFirst({ where: { tenantId, userId, projectId } });
        if (!isMember) {
            const hasAdmin = await this.prisma.roleAssignment.findFirst({
                where: { tenantId, userId, role: { permissions: { hasSome: ['tenant.admin', 'tenant.owner'] } } },
            });
            if (!hasAdmin)
                throw new common_1.ForbiddenException('Not authorized for this project');
        }
    }
    async ensureNoCycles(taskId, deps, tenantId) {
        // Simple DFS to prevent cycles in TaskDependency graph
        const adj = new Map();
        const edges = await this.prisma.taskDependency.findMany({
            where: { tenantId },
            select: { fromTaskId: true, toTaskId: true },
        });
        for (const e of edges) {
            const list = adj.get(e.fromTaskId) || [];
            list.push(e.toTaskId);
            adj.set(e.fromTaskId, list);
        }
        // Include new edges
        for (const to of deps) {
            const list = adj.get(taskId) || [];
            list.push(to);
            adj.set(taskId, list);
        }
        const visited = new Set();
        const stack = new Set();
        const dfs = (n) => {
            if (stack.has(n))
                return true;
            if (visited.has(n))
                return false;
            visited.add(n);
            stack.add(n);
            for (const m of adj.get(n) || []) {
                if (dfs(m))
                    return true;
            }
            stack.delete(n);
            return false;
        };
        if (dfs(taskId))
            throw new common_1.BadRequestException('Task dependency cycle detected');
    }
    async create(tenantId, userId, dto) {
        await this.ensureProjectAccess(tenantId, userId, dto.projectId);
        const task = await this.prisma.task.create({
            data: {
                title: dto.title,
                description: dto.description,
                status: dto.status || 'todo',
                priority: dto.priority || 'medium',
                dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
                estimatedHours: dto.estimatedHours ?? null,
                actualHours: dto.actualHours ?? 0,
                projectId: dto.projectId,
                tenantId,
            },
        });
        // Assignees
        if (Array.isArray(dto.assigneeIds) && dto.assigneeIds.length > 0) {
            await this.prisma.taskAssignee.createMany({
                data: dto.assigneeIds.map((uid) => ({
                    taskId: task.id,
                    userId: uid,
                    tenantId,
                })),
                skipDuplicates: true,
            });
        }
        // Dependencies
        if (Array.isArray(dto.dependencyIds) && dto.dependencyIds.length > 0) {
            await this.ensureNoCycles(task.id, dto.dependencyIds, tenantId);
            await this.prisma.taskDependency.createMany({
                data: dto.dependencyIds.map((depId) => ({
                    fromTaskId: task.id,
                    toTaskId: depId,
                    tenantId,
                })),
                skipDuplicates: true,
            });
        }
        // Outbox event
        await this.prisma.outbox.create({
            data: {
                tenantId,
                aggregate: 'Task',
                payload: { type: 'task.created', taskId: task.id, projectId: dto.projectId },
            },
        });
        return task;
    }
    async list(tenantId, cursor, limit = 25, sort = { createdAt: 'desc' }) {
        const take = Math.min(Math.max(limit, 1), 100);
        const where = { tenantId };
        const orderBy = sort;
        const items = await this.prisma.task.findMany({
            where,
            take: take + 1,
            ...(cursor ? { cursor: { id: cursor.id }, skip: 1 } : {}),
            orderBy,
            include: {
                project: { select: { id: true, name: true } },
                assignees: { include: { user: { select: { id: true, name: true, email: true } } } },
                dependenciesTo: { include: { from: { select: { id: true, title: true } } } },
            },
        });
        const nextCursor = items.length > take ? { id: items[take - 1].id } : null;
        return {
            items: items.slice(0, take),
            nextCursor: nextCursor ? Buffer.from(JSON.stringify(nextCursor), 'utf8').toString('base64url') : null,
        };
    }
    async get(tenantId, userId, id) {
        const task = await this.prisma.task.findFirst({
            where: { id, tenantId },
            include: {
                project: { select: { id: true, name: true } },
                assignees: { include: { user: { select: { id: true, name: true, email: true } } } },
                dependenciesTo: { include: { from: { select: { id: true, title: true } } } },
            },
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        await this.ensureProjectAccess(tenantId, userId, task.projectId);
        return task;
    }
    async update(tenantId, userId, id, dto) {
        const task = await this.prisma.task.findFirst({ where: { id, tenantId } });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        await this.ensureProjectAccess(tenantId, userId, task.projectId);
        // Update dependencies if provided
        if (Array.isArray(dto.dependencyIds)) {
            await this.ensureNoCycles(id, dto.dependencyIds, tenantId);
            await this.prisma.taskDependency.deleteMany({ where: { fromTaskId: id } });
            if (dto.dependencyIds.length > 0) {
                await this.prisma.taskDependency.createMany({
                    data: dto.dependencyIds.map((depId) => ({
                        fromTaskId: id,
                        toTaskId: depId,
                        tenantId,
                    })),
                    skipDuplicates: true,
                });
            }
        }
        // Update assignees if provided
        if (Array.isArray(dto.assigneeIds)) {
            await this.prisma.taskAssignee.deleteMany({ where: { taskId: id } });
            if (dto.assigneeIds.length > 0) {
                await this.prisma.taskAssignee.createMany({
                    data: dto.assigneeIds.map((uid) => ({
                        taskId: id,
                        userId: uid,
                        tenantId,
                    })),
                    skipDuplicates: true,
                });
            }
        }
        const updateData = { ...dto };
        delete updateData.dependencyIds;
        delete updateData.assigneeIds;
        if (updateData.dueDate)
            updateData.dueDate = new Date(updateData.dueDate);
        const updated = await this.prisma.task.update({ where: { id }, data: updateData });
        // Outbox event
        await this.prisma.outbox.create({
            data: {
                tenantId,
                aggregate: 'Task',
                payload: { type: 'task.updated', taskId: id, projectId: task.projectId },
            },
        });
        return updated;
    }
    async remove(tenantId, userId, id) {
        const task = await this.prisma.task.findFirst({ where: { id, tenantId } });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        await this.ensureProjectAccess(tenantId, userId, task.projectId);
        await this.prisma.task.delete({ where: { id } });
        // Outbox event
        await this.prisma.outbox.create({
            data: {
                tenantId,
                aggregate: 'Task',
                payload: { type: 'task.deleted', taskId: id, projectId: task.projectId },
            },
        });
        return { ok: true };
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TasksService);
