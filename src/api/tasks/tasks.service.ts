import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ProjectPermissionsService } from '../common/project-permissions.service';
import { CacheService } from '../common/cache/cache.service';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskQueryDto,
  CreateTaskDtoSchema,
  UpdateTaskDtoSchema,
  TaskQueryDtoSchema,
  PaginatedResponse,
  Task,
} from '../../shared/types';
import { Prisma } from '@prisma/client';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
    private readonly permissions: ProjectPermissionsService,
    private readonly cache: CacheService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Notify a set of users about a task event. Best-effort: failures are logged
   * but never block the task operation that triggered them. The actor
   * (`actorId`) is excluded so users aren't notified about their own actions.
   */
  private async notifyUsers(
    tenantId: string,
    actorId: string,
    recipientIds: string[],
    type: NotificationType,
    taskId: string,
    taskTitle: string,
  ): Promise<void> {
    const uniqueRecipients = Array.from(new Set(recipientIds)).filter(
      (uid) => uid && uid !== actorId,
    );

    await Promise.all(
      uniqueRecipients.map(async (uid) => {
        try {
          await this.notifications.sendTaskNotification(tenantId, uid, type, taskId, taskTitle);
        } catch (error) {
          this.logger.warn(
            `Failed to send ${type} notification to user ${uid} for task ${taskId}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          );
        }
      }),
    );
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

  async create(tenantId: string, userId: string, dto: CreateTaskDto): Promise<Task> {
    // Validate DTO with Zod
    const validated = CreateTaskDtoSchema.parse(dto);

    // Project ID is now optional - allow personal tasks
    if (validated.projectId) {
      // Only check permissions if project is specified
      await this.permissions.ensureCanWriteProject(tenantId, userId, validated.projectId);
    }

    // If parentId is provided, ensure parent exists and user has access
    if (validated.parentId) {
      const parent = await this.prisma.tx.task.findFirst({
        where: { id: validated.parentId, tenantId },
      });
      if (!parent) {
        throw new NotFoundException('Parent task not found');
      }
      // Ensure parent and subtask are in same project (if project is specified)
      if (validated.projectId && parent.projectId !== validated.projectId) {
        throw new BadRequestException('Subtask must be in the same project as parent');
      }
    }

    const task = await this.prisma.tx.task.create({
      data: {
        title: validated.title,
        description: validated.description,
        status: validated.status,
        priority: validated.priority,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        estimatedHours: validated.estimatedHours ?? null,
        actualHours: validated.actualHours ?? 0,
        projectId: validated.projectId || null, // Allow null for personal tasks
        parentId: validated.parentId || null, // For subtasks
        customFields: validated.customFields || null,
        tenantId,
      },
    });

    // Assignees
    if (validated.assigneeIds && validated.assigneeIds.length > 0) {
      await this.prisma.tx.taskAssignee.createMany({
        data: validated.assigneeIds.map((uid) => ({
          taskId: task.id,
          userId: uid,
          tenantId,
        })),
        skipDuplicates: true,
      });

      // Notify newly assigned users (best-effort, excludes the creator).
      await this.notifyUsers(
        tenantId,
        userId,
        validated.assigneeIds,
        NotificationType.TASK_ASSIGNED,
        task.id,
        task.title,
      );
    }

    // Dependencies
    if (validated.dependencyIds && validated.dependencyIds.length > 0) {
      await this.ensureNoCycles(task.id, validated.dependencyIds, tenantId);
      await this.prisma.tx.taskDependency.createMany({
        data: validated.dependencyIds.map((depId) => ({
          fromTaskId: task.id,
          toTaskId: depId,
          tenantId,
        })),
        skipDuplicates: true,
      });
    }

    // Outbox event (optional - gracefully handle if table doesn't exist)
    try {
      await this.prisma.tx.outbox.create({
        data: {
          tenantId,
          aggregate: 'Task',
          payload: { type: 'task.created', taskId: task.id, projectId: validated.projectId },
        },
      });
    } catch (error: unknown) {
      // Silently skip if outbox table doesn't exist yet
      const prismaError = error as { code?: string; message?: string };
      if (prismaError?.code !== 'P2021' && !prismaError?.message?.includes('does not exist')) {
        throw error;
      }
    }

    // Broadcast real-time update (projectId can be null for personal tasks)
    await this.realtime.broadcastTaskUpdate(tenantId, validated.projectId || null, task.id, 'task.created', task);

    // Sync to calendar if due date is set
    if (task.dueDate) {
      await this.syncTaskToCalendar(tenantId, userId, task);
    }

    // Invalidate cache
    await this.cache.invalidateTasks(tenantId, validated.projectId || undefined);
    await this.cache.invalidateDashboard(tenantId, userId);

    return task;
  }

  async list(
    tenantId: string,
    userId: string,
    query: TaskQueryDto,
  ): Promise<PaginatedResponse<Task>> {
    // Validate query
    const validated = TaskQueryDtoSchema.parse(query);
    
    const take = Math.min(Math.max(validated.limit || 25, 1), 100);
    const where: Prisma.TaskWhereInput = { tenantId };
    
    // Handle project filtering
    if (validated.projectId === 'personal') {
      // Filter for personal tasks (no project)
      where.projectId = null;
    } else if (validated.projectId) {
      // Filter by specific project - check access
      await this.permissions.ensureCanReadProject(tenantId, userId, validated.projectId);
      where.projectId = validated.projectId;
    } else {
      // Show all tasks user has access to (personal + accessible projects)
      const accessibleProjects = await this.getAccessibleProjectIds(tenantId, userId);
      where.OR = [
        { projectId: null }, // Personal tasks
        { projectId: { in: accessibleProjects } }, // Project tasks
      ];
    }

    // Apply filters
    if (validated.status) where.status = validated.status;
    if (validated.priority) where.priority = validated.priority;
    if (validated.assigneeId) {
      where.assignees = { some: { userId: validated.assigneeId } };
    }
    if (validated.search) {
      where.OR = [
        { title: { contains: validated.search, mode: 'insensitive' } },
        { description: { contains: validated.search, mode: 'insensitive' } },
      ];
    }
    if (validated.tags && validated.tags.length > 0) {
      where.tags = { hasSome: validated.tags };
    }

    // Decode cursor
    const decodedCursor = validated.cursor
      ? JSON.parse(Buffer.from(validated.cursor, 'base64url').toString('utf8'))
      : null;
    
    const items = await this.prisma.tx.task.findMany({
      where,
      take: take + 1,
      ...(decodedCursor ? { cursor: { id: decodedCursor.id }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
    
    const nextCursor = items.length > take ? { id: items[take - 1].id } : null;
    return {
      items: items.slice(0, take),
      nextCursor: nextCursor ? Buffer.from(JSON.stringify(nextCursor), 'utf8').toString('base64url') : null,
      hasMore: nextCursor !== null,
    };
  }

  /**
   * Get accessible project IDs for a user
   * Optimized: Single query using OR condition instead of two separate queries
   */
  private async getAccessibleProjectIds(tenantId: string, userId: string): Promise<string[]> {
    // Single query to get all accessible projects (created by user OR user is member)
    const [createdProjects, memberProjects] = await Promise.all([
      this.prisma.tx.project.findMany({
        where: { tenantId, createdBy: userId, deletedAt: null },
        select: { id: true },
      }),
      this.prisma.tx.projectMember.findMany({
        where: { tenantId, userId },
        select: { projectId: true },
      }),
    ]);

    // Combine and deduplicate
    const projectIds = new Set<string>();
    createdProjects.forEach((p) => projectIds.add(p.id));
    memberProjects.forEach((m) => projectIds.add(m.projectId));

    return Array.from(projectIds);
  }

  async update(tenantId: string, userId: string, id: string, dto: UpdateTaskDto): Promise<Task> {
    // Validate DTO
    const validated = UpdateTaskDtoSchema.parse(dto);

    const existing = await this.prisma.tx.task.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Task not found');

    // Check write permissions (viewers cannot update tasks)
    // Personal tasks (no projectId) are always editable by the creator
    if (existing.projectId) {
      await this.permissions.ensureCanWriteProject(tenantId, userId, existing.projectId);
    }
    // For personal tasks, we'll allow updates (could add creator check later)

    // Prepare update data - handle dueDate conversion
    const updateData: Prisma.TaskUpdateInput = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.priority !== undefined) updateData.priority = validated.priority;
    if (validated.dueDate !== undefined) {
      updateData.dueDate = validated.dueDate ? new Date(validated.dueDate) : null;
    }
    if (validated.estimatedHours !== undefined) updateData.estimatedHours = validated.estimatedHours;
    if (validated.actualHours !== undefined) updateData.actualHours = validated.actualHours;
    if (validated.isBlocked !== undefined) updateData.isBlocked = validated.isBlocked;
    if (validated.blockReason !== undefined) updateData.blockReason = validated.blockReason;
    if (validated.tags !== undefined) updateData.tags = validated.tags;

    const updated = await this.prisma.tx.task.update({ where: { id }, data: updateData });

    // Outbox event (optional - gracefully handle if table doesn't exist)
    try {
      await this.prisma.tx.outbox.create({
        data: {
          tenantId,
          aggregate: 'Task',
          payload: { type: 'task.updated', taskId: id },
        },
      });
    } catch (error: unknown) {
      // Silently skip if outbox table doesn't exist yet
      const prismaError = error as { code?: string; message?: string };
      if (prismaError?.code !== 'P2021' && !prismaError?.message?.includes('does not exist')) {
        throw error;
      }
    }

    // Broadcast real-time update (projectId can be null for personal tasks)
    await this.realtime.broadcastTaskUpdate(tenantId, existing.projectId || null, id, 'task.updated', updated);

    // Notify assignees when a task is completed (best-effort).
    if (validated.status === 'done' && existing.status !== 'done') {
      const assignees = await this.prisma.tx.taskAssignee.findMany({
        where: { taskId: id, tenantId },
        select: { userId: true },
      });
      await this.notifyUsers(
        tenantId,
        userId,
        assignees.map((a) => a.userId),
        NotificationType.TASK_COMPLETED,
        id,
        updated.title,
      );
    }

    // Sync to calendar - update or create/delete based on due date
    await this.syncTaskToCalendar(tenantId, userId, updated, existing.dueDate);

    return updated;
  }

  async get(tenantId: string, userId: string, id: string): Promise<Task> {
    const task = await this.prisma.tx.task.findFirst({ 
      where: { id, tenantId },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    if (!task) throw new NotFoundException('Task not found');
    
    // Check read permissions (viewers can read)
    // Personal tasks (no projectId) are always readable by the user
    if (task.projectId) {
      await this.permissions.ensureCanReadProject(tenantId, userId, task.projectId);
    }
    
    return task;
  }

  async delete(tenantId: string, userId: string, id: string): Promise<{ ok: boolean }> {
    const existing = await this.prisma.tx.task.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Task not found');

    // Check write permissions (viewers cannot delete tasks)
    // Personal tasks (no projectId) are always deletable by the user
    if (existing.projectId) {
      await this.permissions.ensureCanWriteProject(tenantId, userId, existing.projectId);
    }

    await this.prisma.tx.task.delete({ where: { id } });

    // Outbox event (optional - gracefully handle if table doesn't exist)
    try {
      await this.prisma.tx.outbox.create({
        data: {
          tenantId,
          aggregate: 'Task',
          payload: { type: 'task.deleted', taskId: id },
        },
      });
    } catch (error: unknown) {
      // Silently skip if outbox table doesn't exist yet
      const prismaError = error as { code?: string; message?: string };
      if (prismaError?.code !== 'P2021' && !prismaError?.message?.includes('does not exist')) {
        throw error;
      }
    }

    // Broadcast real-time update (projectId can be null for personal tasks)
    await this.realtime.broadcastTaskUpdate(tenantId, existing.projectId || null, id, 'task.deleted', { id });

    // Remove calendar event if it exists
    await this.removeTaskCalendarEvent(tenantId, id);

    // Invalidate cache
    await this.cache.invalidateTasks(tenantId, existing.projectId || undefined);
    await this.cache.invalidateDashboard(tenantId, userId);

    return { ok: true };
  }

  /**
   * Sync task due date to calendar event
   */
  private async syncTaskToCalendar(
    tenantId: string,
    userId: string,
    task: Task,
    oldDueDate?: Date | null,
  ): Promise<void> {
    try {
      // Check if calendar_events table exists (graceful degradation)
      // Find existing calendar event for this task
      const existingEvent = await this.prisma.tx.calendarEvent.findFirst({
        where: {
          tenantId,
          sourceType: 'TASK',
          sourceId: task.id,
        },
      }).catch(() => null);

      if (task.dueDate) {
        const dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
        const endDate = new Date(dueDate);
        endDate.setHours(endDate.getHours() + 1); // Default 1 hour duration

        if (existingEvent) {
          // Update existing event
          await this.prisma.tx.calendarEvent.update({
            where: { id: existingEvent.id },
            data: {
              title: task.title,
              description: task.description || null,
              startAt: dueDate,
              endAt: endDate,
              allDay: false,
            },
          }).catch((err) => {
            this.logger.warn(`Failed to update calendar event: ${err.message}`);
          });
        } else {
          // Create new event
          await this.prisma.tx.calendarEvent.create({
            data: {
              tenantId,
              projectId: task.projectId,
              title: task.title,
              description: task.description || null,
              startAt: dueDate,
              endAt: endDate,
              allDay: false,
              type: 'TASK_DEADLINE',
              sourceType: 'TASK',
              sourceId: task.id,
              createdById: userId,
            },
          }).catch((err) => {
            this.logger.warn(`Failed to create calendar event: ${err.message}`);
          });
        }
      } else if (existingEvent && oldDueDate) {
        // Due date was removed, delete the calendar event
        await this.prisma.tx.calendarEvent.delete({
          where: { id: existingEvent.id },
        }).catch((err) => {
          this.logger.warn(`Failed to delete calendar event: ${err.message}`);
        });
      }
    } catch (error: unknown) {
      // Log but don't fail task operation if calendar sync fails
      // This could happen if the calendar_events table doesn't exist yet
      const prismaError = error as { code?: string; message?: string };
      if (prismaError?.code !== 'P2021' && !prismaError?.message?.includes('does not exist')) {
        this.logger.warn(`Failed to sync task ${task.id} to calendar: ${prismaError?.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Get all subtasks for a task
   */
  async getSubtasks(tenantId: string, userId: string, taskId: string) {
    // Verify task exists and user has access
    const task = await this.get(tenantId, userId, taskId);

    const subtasks = await this.prisma.tx.task.findMany({
      where: {
        tenantId,
        parentId: taskId,
        deletedAt: null,
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        dependenciesFrom: {
          include: {
            toTask: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return subtasks;
  }

  /**
   * Calculate progress for a task based on subtasks
   * Returns percentage (0-100) based on completed subtasks
   */
  async calculateProgress(tenantId: string, userId: string, taskId: string): Promise<number> {
    // Verify task exists and user has access
    await this.get(tenantId, userId, taskId);

    const subtasks = await this.prisma.tx.task.findMany({
      where: {
        tenantId,
        parentId: taskId,
        deletedAt: null,
      },
      select: {
        status: true,
      },
    });

    if (subtasks.length === 0) {
      return 0; // No subtasks, progress is 0
    }

    const completedCount = subtasks.filter(
      (st) => st.status === 'done' || st.status === 'cancelled',
    ).length;

    return Math.round((completedCount / subtasks.length) * 100);
  }

  /**
   * Check if a task is blocked by incomplete dependencies
   */
  async checkDependencyBlocking(tenantId: string, userId: string, taskId: string): Promise<{
    isBlocked: boolean;
    blockingDependencies: Array<{ id: string; title: string; status: string }>;
  }> {
    // Verify task exists and user has access
    await this.get(tenantId, userId, taskId);

    const dependencies = await this.prisma.tx.taskDependency.findMany({
      where: {
        tenantId,
        fromTaskId: taskId,
      },
      include: {
        toTask: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    const blockingDependencies = dependencies
      .filter((dep) => {
        const status = dep.toTask.status;
        return status !== 'done' && status !== 'cancelled';
      })
      .map((dep) => ({
        id: dep.toTask.id,
        title: dep.toTask.title,
        status: dep.toTask.status,
      }));

    return {
      isBlocked: blockingDependencies.length > 0,
      blockingDependencies,
    };
  }

  /**
   * Get all dependencies for a task (both directions)
   */
  async getDependencies(tenantId: string, userId: string, taskId: string) {
    // Verify task exists and user has access
    await this.get(tenantId, userId, taskId);

    // Get tasks that block this task (this task depends on them)
    const blockedBy = await this.prisma.tx.taskDependency.findMany({
      where: {
        tenantId,
        toTaskId: taskId,
      },
      include: {
        from: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        to: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    // Get tasks that this task blocks
    const blocks = await this.prisma.tx.taskDependency.findMany({
      where: {
        tenantId,
        fromTaskId: taskId,
      },
      include: {
        from: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        to: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return {
      blockedBy,
      blocks,
    };
  }

  /**
   * Add a dependency between two tasks with cycle detection
   */
  async addDependency(tenantId: string, userId: string, fromTaskId: string, toTaskId: string) {
    // Verify both tasks exist and user has access
    await this.get(tenantId, userId, fromTaskId);
    await this.get(tenantId, userId, toTaskId);

    // Check if dependency already exists
    const existing = await this.prisma.tx.taskDependency.findFirst({
      where: {
        tenantId,
        fromTaskId,
        toTaskId,
      },
    });

    if (existing) {
      throw new BadRequestException('Dependency already exists');
    }

    // Check for circular dependency
    const hasCircular = await this.wouldCreateCycle(tenantId, fromTaskId, toTaskId);
    if (hasCircular) {
      throw new BadRequestException('Cannot create dependency: would create a circular dependency');
    }

    const dependency = await this.prisma.tx.taskDependency.create({
      data: {
        tenantId,
        fromTaskId,
        toTaskId,
      },
      include: {
        from: {
          select: {
            id: true,
            title: true,
            status: true,
            projectId: true,
          },
        },
        to: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    // Invalidate cache
    await this.cache.invalidateTasks(tenantId);

    this.logger.log(`Dependency created: ${fromTaskId} -> ${toTaskId}`);
    return dependency;
  }

  /**
   * Remove a dependency
   */
  async removeDependency(tenantId: string, userId: string, dependencyId: string) {
    const dependency = await this.prisma.tx.taskDependency.findFirst({
      where: {
        id: dependencyId,
        tenantId,
      },
      include: {
        from: {
          select: {
            id: true,
            projectId: true,
          },
        },
      },
    });

    if (!dependency) {
      throw new NotFoundException('Dependency not found');
    }

    // Verify user has access to the task
    await this.get(tenantId, userId, dependency.fromTaskId);

    await this.prisma.tx.taskDependency.delete({
      where: { id: dependencyId },
    });

    // Invalidate cache
    await this.cache.invalidateTasks(tenantId);

    this.logger.log(`Dependency removed: ${dependencyId}`);
    return { ok: true };
  }

  /**
   * Check if adding a dependency would create a cycle
   * Uses depth-first search to detect cycles
   */
  private async wouldCreateCycle(tenantId: string, fromTaskId: string, toTaskId: string): Promise<boolean> {
    // If we're creating fromTask -> toTask, check if toTask already has a path to fromTask
    const visited = new Set<string>();
    const stack: string[] = [toTaskId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      
      if (current === fromTaskId) {
        return true; // Found a cycle
      }

      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      // Get all tasks that depend on the current task
      const dependencies = await this.prisma.tx.taskDependency.findMany({
        where: {
          tenantId,
          toTaskId: current,
        },
        select: {
          fromTaskId: true,
        },
      });

      for (const dep of dependencies) {
        if (!visited.has(dep.fromTaskId)) {
          stack.push(dep.fromTaskId);
        }
      }
    }

    return false;
  }

  /**
   * Remove calendar event for a deleted task
   */
  private async removeTaskCalendarEvent(tenantId: string, taskId: string): Promise<void> {
    try {
      const event = await this.prisma.tx.calendarEvent.findFirst({
        where: {
          tenantId,
          sourceType: 'TASK',
          sourceId: taskId,
        },
      }).catch(() => null);

      if (event) {
        await this.prisma.tx.calendarEvent.delete({
          where: { id: event.id },
        }).catch((err) => {
          this.logger.warn(`Failed to remove calendar event: ${err.message}`);
        });
      }
    } catch (error: unknown) {
      // Silently handle if table doesn't exist
      const prismaError = error as { code?: string; message?: string };
      if (prismaError?.code !== 'P2021' && !prismaError?.message?.includes('does not exist')) {
        this.logger.warn(`Failed to remove calendar event for task ${taskId}: ${prismaError?.message || 'Unknown error'}`);
      }
    }
  }
} 