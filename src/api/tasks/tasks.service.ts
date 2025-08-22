import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureProjectAccess(tenantId: string, userId: string, projectId: string) {
    const isMember = await this.prisma.tx.projectMember.findFirst({ where: { tenantId, userId, projectId } });
    if (!isMember) {
      const hasAdmin = await this.prisma.tx.roleAssignment.findFirst({
        where: { tenantId, userId, role: { permissions: { hasSome: ['tenant.admin', 'tenant.owner'] } } },
      });
      if (!hasAdmin) throw new ForbiddenException('Not authorized for this project');
    }
  }

  private async ensureNoCycles(taskId: string, deps: string[], tenantId: string) {
    // Simple DFS to prevent cycles in TaskDependency graph
    const adj = new Map<string, string[]>();
    const edges = await this.prisma.tx.taskDependency.findMany({
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

    const visited = new Set<string>();
    const stack = new Set<string>();
    const dfs = (n: string): boolean => {
      if (stack.has(n)) return true;
      if (visited.has(n)) return false;
      visited.add(n);
      stack.add(n);
      for (const m of adj.get(n) || []) {
        if (dfs(m)) return true;
      }
      stack.delete(n);
      return false;
    };
    if (dfs(taskId)) throw new BadRequestException('Task dependency cycle detected');
  }

  async create(tenantId: string, userId: string, dto: any) {
    await this.ensureProjectAccess(tenantId, userId, dto.projectId);

    const task = await this.prisma.tx.task.create({
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
      await this.prisma.tx.taskAssignee.createMany({
        data: dto.assigneeIds.map((uid: string) => ({
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
      await this.prisma.tx.taskDependency.createMany({
        data: dto.dependencyIds.map((depId: string) => ({
          fromTaskId: task.id,
          toTaskId: depId,
          tenantId,
        })),
        skipDuplicates: true,
      });
    }

    // Outbox event
    await this.prisma.tx.outbox.create({
      data: {
        tenantId,
        aggregate: 'Task',
        payload: { type: 'task.created', taskId: task.id, projectId: dto.projectId },
      },
    });

    return task;
  }

  async list(tenantId: string, projectId?: string, cursor?: any, limit = 25) {
    const take = Math.min(Math.max(limit, 1), 100);
    const where: any = { tenantId, ...(projectId ? { projectId } : {}) };
    const items = await this.prisma.tx.task.findMany({
      where,
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor.id }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    });
    const nextCursor = items.length > take ? { id: items[take - 1].id } : null;
    return {
      items: items.slice(0, take),
      nextCursor: nextCursor ? Buffer.from(JSON.stringify(nextCursor), 'utf8').toString('base64url') : null,
    };
  }

  async update(tenantId: string, userId: string, id: string, dto: any) {
    const existing = await this.prisma.tx.task.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Task not found');

    await this.ensureProjectAccess(tenantId, userId, existing.projectId);

    const updated = await this.prisma.tx.task.update({ where: { id }, data: { ...dto } });

    await this.prisma.tx.outbox.create({
      data: {
        tenantId,
        aggregate: 'Task',
        payload: { type: 'task.updated', taskId: id },
      },
    });

    return updated;
  }
} 