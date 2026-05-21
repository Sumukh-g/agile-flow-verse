import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ProjectPermissionsService } from '../common/project-permissions.service';
import { CacheService } from '../common/cache/cache.service';
import {
  CreateTimeLogDto,
  UpdateTimeLogDto,
  TimeLogQueryDto,
  CreateTimeLogDtoSchema,
  UpdateTimeLogDtoSchema,
  TimeLogQueryDtoSchema,
  PaginatedResponse,
} from '../../shared/types';
import { Prisma } from '@prisma/client';

@Injectable()
export class TimeLogsService {
  private readonly logger = new Logger(TimeLogsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
    private readonly permissions: ProjectPermissionsService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Create a new time log entry
   */
  async create(tenantId: string, userId: string, dto: CreateTimeLogDto) {
    const validated = CreateTimeLogDtoSchema.parse(dto);

    // Verify task exists and user has access
    const task = await this.prisma.tx.task.findFirst({
      where: { id: validated.taskId, tenantId },
      select: { id: true, projectId: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check project permissions if task is in a project
    if (task.projectId) {
      const role = await this.permissions.getUserProjectRole(
        tenantId,
        userId,
        task.projectId,
      );
      if (!role) {
        throw new ForbiddenException('You do not have access to this task');
      }
    }

    // Calculate duration if both startedAt and endedAt are provided
    let duration = validated.duration || 0;
    if (validated.endedAt && validated.startedAt) {
      const start = new Date(validated.startedAt);
      const end = new Date(validated.endedAt);
      duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Convert to hours
      if (duration < 0) {
        throw new BadRequestException('End time must be after start time');
      }
    }

    const timeLog = await this.prisma.tx.timeLog.create({
      data: {
        taskId: validated.taskId,
        userId,
        tenantId,
        startedAt: new Date(validated.startedAt),
        endedAt: validated.endedAt ? new Date(validated.endedAt) : null,
        duration,
        description: validated.description || null,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update task's actualHours
    await this.updateTaskActualHours(validated.taskId, tenantId);

    // Broadcast real-time update
    await this.realtime.broadcastTaskUpdate(
      tenantId,
      task.projectId || null,
      validated.taskId,
      'timeLog.created',
      { timeLog },
    );

    // Invalidate cache
    await this.cache.invalidateTasks(tenantId, task.projectId || undefined);

    this.logger.log(`Time log created: ${timeLog.id} for task ${validated.taskId}`);
    return timeLog;
  }

  /**
   * Start a timer for a task (creates a time log with no end time)
   */
  async startTimer(tenantId: string, userId: string, taskId: string, description?: string) {
    // Check if user already has an active timer
    const activeTimer = await this.prisma.tx.timeLog.findFirst({
      where: {
        userId,
        tenantId,
        endedAt: null,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (activeTimer) {
      throw new BadRequestException(
        `You already have an active timer on task ${activeTimer.taskId}. Please stop it first.`,
      );
    }

    // Verify task exists and user has access
    const task = await this.prisma.tx.task.findFirst({
      where: { id: taskId, tenantId },
      select: { id: true, projectId: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check project permissions if task is in a project
    if (task.projectId) {
      const role = await this.permissions.getUserProjectRole(
        tenantId,
        userId,
        task.projectId,
      );
      if (!role) {
        throw new ForbiddenException('You do not have access to this task');
      }
    }

    const timeLog = await this.prisma.tx.timeLog.create({
      data: {
        taskId,
        userId,
        tenantId,
        startedAt: new Date(),
        endedAt: null,
        duration: 0,
        description: description || null,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Broadcast real-time update
    await this.realtime.broadcastTaskUpdate(
      tenantId,
      task.projectId || null,
      taskId,
      'timeLog.started',
      { timeLog, userId },
    );

    this.logger.log(`Timer started: ${timeLog.id} for task ${taskId} by user ${userId}`);
    return timeLog;
  }

  /**
   * Stop the active timer for a user
   */
  async stopTimer(tenantId: string, userId: string, description?: string) {
    const activeTimer = await this.prisma.tx.timeLog.findFirst({
      where: {
        userId,
        tenantId,
        endedAt: null,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (!activeTimer) {
      throw new NotFoundException('No active timer found');
    }

    const now = new Date();
    const duration = (now.getTime() - activeTimer.startedAt.getTime()) / (1000 * 60 * 60); // Convert to hours

    const updated = await this.prisma.tx.timeLog.update({
      where: { id: activeTimer.id },
      data: {
        endedAt: now,
        duration,
        description: description || activeTimer.description,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update task's actualHours
    await this.updateTaskActualHours(activeTimer.taskId, tenantId);

    // Broadcast real-time update
    await this.realtime.broadcastTaskUpdate(
      tenantId,
      activeTimer.task.projectId || null,
      activeTimer.taskId,
      'timeLog.stopped',
      { timeLog: updated, userId },
    );

    // Invalidate cache
    await this.cache.invalidateTasks(tenantId, activeTimer.task.projectId || undefined);

    this.logger.log(`Timer stopped: ${updated.id} for task ${activeTimer.taskId} by user ${userId}`);
    return updated;
  }

  /**
   * Get active timer for a user
   */
  async getActiveTimer(tenantId: string, userId: string) {
    const activeTimer = await this.prisma.tx.timeLog.findFirst({
      where: {
        userId,
        tenantId,
        endedAt: null,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (!activeTimer) {
      return null;
    }

    // Calculate current duration
    const now = new Date();
    const currentDuration = (now.getTime() - activeTimer.startedAt.getTime()) / (1000 * 60 * 60);

    return {
      ...activeTimer,
      currentDuration,
    };
  }

  /**
   * List time logs with pagination
   */
  async list(tenantId: string, userId: string, query: TimeLogQueryDto): Promise<PaginatedResponse<any>> {
    const validated = TimeLogQueryDtoSchema.parse(query);

    const where: Prisma.TimeLogWhereInput = {
      tenantId,
    };

    if (validated.taskId) {
      // Check access to task
      const task = await this.prisma.tx.task.findFirst({
        where: { id: validated.taskId, tenantId },
        select: { id: true, projectId: true },
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      if (task.projectId) {
        const role = await this.permissions.getUserProjectRole(
          tenantId,
          userId,
          task.projectId,
        );
        if (!role) {
          throw new ForbiddenException('You do not have access to this task');
        }
      }

      where.taskId = validated.taskId;
    }

    if (validated.userId) {
      where.userId = validated.userId;
    }

    if (validated.startDate || validated.endDate) {
      where.startedAt = {};
      if (validated.startDate) {
        where.startedAt.gte = new Date(validated.startDate);
      }
      if (validated.endDate) {
        where.startedAt.lte = new Date(validated.endDate);
      }
    }

    const limit = validated.limit || 25;
    const cursor = validated.cursor;

    const timeLogs = await this.prisma.tx.timeLog.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { startedAt: 'desc' },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const hasMore = timeLogs.length > limit;
    const items = hasMore ? timeLogs.slice(0, limit) : timeLogs;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Update a time log entry
   */
  async update(tenantId: string, userId: string, id: string, dto: UpdateTimeLogDto) {
    const validated = UpdateTimeLogDtoSchema.parse(dto);

    const existing = await this.prisma.tx.timeLog.findFirst({
      where: { id, tenantId },
      include: {
        task: {
          select: {
            id: true,
            projectId: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Time log not found');
    }

    // Only the creator can update their own time log
    if (existing.userId !== userId) {
      throw new ForbiddenException('You can only update your own time logs');
    }

    // Check task access if taskId is being changed
    if (validated.taskId && validated.taskId !== existing.taskId) {
      const task = await this.prisma.tx.task.findFirst({
        where: { id: validated.taskId, tenantId },
        select: { id: true, projectId: true },
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      if (task.projectId) {
        const role = await this.permissions.getUserProjectRole(
          tenantId,
          userId,
          task.projectId,
        );
        if (!role) {
          throw new ForbiddenException('You do not have access to this task');
        }
      }
    }

    // Calculate duration if both dates are provided
    let duration = validated.duration;
    const startedAt = validated.startedAt ? new Date(validated.startedAt) : existing.startedAt;
    const endedAt = validated.endedAt !== undefined ? (validated.endedAt ? new Date(validated.endedAt) : null) : existing.endedAt;

    if (endedAt && startedAt) {
      duration = (endedAt.getTime() - startedAt.getTime()) / (1000 * 60 * 60);
      if (duration < 0) {
        throw new BadRequestException('End time must be after start time');
      }
    }

    const updateData: Prisma.TimeLogUpdateInput = {};
    if (validated.taskId !== undefined) {
      updateData.task = { connect: { id: validated.taskId } };
    }
    if (validated.startedAt !== undefined) updateData.startedAt = new Date(validated.startedAt);
    if (validated.endedAt !== undefined) updateData.endedAt = validated.endedAt ? new Date(validated.endedAt) : null;
    if (duration !== undefined) updateData.duration = duration;
    if (validated.description !== undefined) updateData.description = validated.description;

    const updated = await this.prisma.tx.timeLog.update({
      where: { id },
      data: updateData,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update task's actualHours
    await this.updateTaskActualHours(updated.taskId, tenantId);

    // Broadcast real-time update
    await this.realtime.broadcastTaskUpdate(
      tenantId,
      updated.task.projectId || null,
      updated.taskId,
      'timeLog.updated',
      { timeLog: updated },
    );

    // Invalidate cache
    await this.cache.invalidateTasks(tenantId, updated.task.projectId || undefined);

    return updated;
  }

  /**
   * Delete a time log entry
   */
  async delete(tenantId: string, userId: string, id: string) {
    const existing = await this.prisma.tx.timeLog.findFirst({
      where: { id, tenantId },
      include: {
        task: {
          select: {
            id: true,
            projectId: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Time log not found');
    }

    // Only the creator can delete their own time log
    if (existing.userId !== userId) {
      throw new ForbiddenException('You can only delete your own time logs');
    }

    await this.prisma.tx.timeLog.delete({
      where: { id },
    });

    // Update task's actualHours
    await this.updateTaskActualHours(existing.taskId, tenantId);

    // Broadcast real-time update
    await this.realtime.broadcastTaskUpdate(
      tenantId,
      existing.task.projectId || null,
      existing.taskId,
      'timeLog.deleted',
      { timeLogId: id },
    );

    // Invalidate cache
    await this.cache.invalidateTasks(tenantId, existing.task.projectId || undefined);

    return { ok: true };
  }

  /**
   * Update task's actualHours based on all time logs
   */
  private async updateTaskActualHours(taskId: string, tenantId: string) {
    const totalHours = await this.prisma.tx.timeLog.aggregate({
      where: {
        taskId,
        tenantId,
      },
      _sum: {
        duration: true,
      },
    });

    await this.prisma.tx.task.update({
      where: { id: taskId },
      data: {
        actualHours: totalHours._sum.duration || 0,
      },
    });
  }
}

