import { Injectable, Logger } from '@nestjs/common';
import { getRedis } from '../common/redis/redis.client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(tenantId: string, userId: string) {
    const cacheKey = `dashboard:${tenantId}:${userId}`;
    const redis = getRedis();
    
    // Try to get from cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const [
      recentTasks,
      upcomingTasks,
      projectStats,
      taskStats,
      recentActivity,
      notifications,
    ] = await Promise.all([
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

  async getRecentTasks(tenantId: string, userId: string) {
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

  async getUpcomingTasks(tenantId: string, userId: string) {
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

  async getProjectStats(tenantId: string) {
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

  async getTaskStats(tenantId: string, userId: string) {
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

  async getRecentActivity(tenantId: string, userId: string) {
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

  async getNotifications(tenantId: string, userId: string) {
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
}




