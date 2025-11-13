import { Injectable, Logger } from '@nestjs/common';
import { getRedis } from '../common/redis/redis.client';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsQueryDto } from './dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProjectAnalytics(tenantId: string, projectId: string, query: AnalyticsQueryDto) {
    const cacheKey = `analytics:project:${tenantId}:${projectId}:${JSON.stringify(query)}`;
    const redis = getRedis();
    
    // Try to get from cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const analytics = await this.calculateProjectAnalytics(tenantId, projectId, query);
    
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(analytics));

    return analytics;
  }

  async getTaskAnalytics(tenantId: string, query: AnalyticsQueryDto) {
    const cacheKey = `analytics:tasks:${tenantId}:${JSON.stringify(query)}`;
    const redis = getRedis();
    
    // Try to get from cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const analytics = await this.calculateTaskAnalytics(tenantId, query);
    
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(analytics));

    return analytics;
  }

  async getUserAnalytics(tenantId: string, userId: string, query: AnalyticsQueryDto) {
    const cacheKey = `analytics:user:${tenantId}:${userId}:${JSON.stringify(query)}`;
    const redis = getRedis();
    
    // Try to get from cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const analytics = await this.calculateUserAnalytics(tenantId, userId, query);
    
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(analytics));

    return analytics;
  }

  async getTenantAnalytics(tenantId: string, query: AnalyticsQueryDto) {
    const cacheKey = `analytics:tenant:${tenantId}:${JSON.stringify(query)}`;
    const redis = getRedis();
    
    // Try to get from cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const analytics = await this.calculateTenantAnalytics(tenantId, query);
    
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(analytics));

    return analytics;
  }

  private async calculateProjectAnalytics(tenantId: string, projectId: string, query: AnalyticsQueryDto) {
    const where: any = {
      tenantId,
      projectId,
    };

    if (query.startDate && query.endDate) {
      where.createdAt = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    }

    // Project overview
    const project = await this.prisma.tx.project.findFirst({
      where: { id: projectId, tenantId },
      include: {
        tasks: {
          where: query.startDate && query.endDate ? {
            createdAt: {
              gte: new Date(query.startDate),
              lte: new Date(query.endDate),
            },
          } : {},
        },
        members: true,
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Task statistics
    const taskStats = await this.prisma.tx.task.groupBy({
      by: ['status'],
      where: {
        tenantId,
        projectId,
        ...(query.startDate && query.endDate ? {
          createdAt: {
            gte: new Date(query.startDate),
            lte: new Date(query.endDate),
          },
        } : {}),
      },
      _count: {
        id: true,
      },
    });

    // Time tracking
    const timeStats = await this.prisma.tx.timesheet.aggregate({
      where: {
        tenantId,
        task: {
          projectId,
        },
        ...(query.startDate && query.endDate ? {
          date: {
            gte: new Date(query.startDate),
            lte: new Date(query.endDate),
          },
        } : {}),
      },
      _sum: {
        hours: true,
      },
      _avg: {
        hours: true,
      },
    });

    // Progress over time
    const progressData = await this.getProgressOverTime(tenantId, projectId, query);

    return {
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        progress: project.progress,
        budget: project.budget,
        spent: project.spent,
        startDate: project.startDate,
        endDate: project.endDate,
        memberCount: project.members.length,
      },
      tasks: {
        total: project.tasks.length,
        byStatus: taskStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        completed: taskStats.find(s => s.status === 'done')?._count.id || 0,
        inProgress: taskStats.find(s => s.status === 'in-progress')?._count.id || 0,
        todo: taskStats.find(s => s.status === 'todo')?._count.id || 0,
      },
      timeTracking: {
        totalHours: timeStats._sum.hours || 0,
        averageHoursPerEntry: timeStats._avg.hours || 0,
      },
      progressOverTime: progressData,
    };
  }

  private async calculateTaskAnalytics(tenantId: string, query: AnalyticsQueryDto) {
    const where: any = { tenantId };

    if (query.startDate && query.endDate) {
      where.createdAt = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    }

    // Task completion rate
    const taskStats = await this.prisma.tx.task.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
    });

    // Average completion time
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

    const avgCompletionTime = completedTasks.length > 0 
      ? completedTasks.reduce((sum, task) => {
          const completionTime = task.updatedAt.getTime() - task.createdAt.getTime();
          return sum + completionTime;
        }, 0) / completedTasks.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    // Overdue tasks
    const overdueTasks = await this.prisma.tx.task.count({
      where: {
        ...where,
        dueDate: {
          lt: new Date(),
        },
        status: {
          not: 'done',
        },
      },
    });

    // Task velocity (tasks completed per week)
    const velocity = await this.calculateTaskVelocity(tenantId, query);

    return {
      total: taskStats.reduce((sum, stat) => sum + stat._count.id, 0),
      byStatus: taskStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      }, {} as Record<string, number>),
      completionRate: taskStats.length > 0 
        ? (taskStats.find(s => s.status === 'done')?._count.id || 0) / 
          taskStats.reduce((sum, stat) => sum + stat._count.id, 0) * 100
        : 0,
      averageCompletionTimeDays: avgCompletionTime,
      overdueTasks,
      velocity,
    };
  }

  private async calculateUserAnalytics(tenantId: string, userId: string, query: AnalyticsQueryDto) {
    const where: any = { tenantId, userId };

    if (query.startDate && query.endDate) {
      where.createdAt = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    }

    // User's tasks
    const userTasks = await this.prisma.tx.taskAssignee.findMany({
      where: {
        tenantId,
        userId,
        task: query.startDate && query.endDate ? {
          createdAt: {
            gte: new Date(query.startDate),
            lte: new Date(query.endDate),
          },
        } : {},
      },
      include: {
        task: true,
      },
    });

    // Time tracking
    const timeStats = await this.prisma.tx.timesheet.aggregate({
      where: {
        tenantId,
        userId,
        ...(query.startDate && query.endDate ? {
          date: {
            gte: new Date(query.startDate),
            lte: new Date(query.endDate),
          },
        } : {}),
      },
      _sum: {
        hours: true,
      },
      _avg: {
        hours: true,
      },
    });

    // Task completion rate for user
    const completedTasks = userTasks.filter(ut => ut.task.status === 'done').length;
    const completionRate = userTasks.length > 0 ? (completedTasks / userTasks.length) * 100 : 0;

    return {
      assignedTasks: userTasks.length,
      completedTasks,
      completionRate,
      totalHoursLogged: timeStats._sum.hours || 0,
      averageHoursPerDay: timeStats._avg.hours || 0,
      tasksByStatus: userTasks.reduce((acc, ut) => {
        acc[ut.task.status] = (acc[ut.task.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  private async calculateTenantAnalytics(tenantId: string, query: AnalyticsQueryDto) {
    const where: any = { tenantId };

    if (query.startDate && query.endDate) {
      where.createdAt = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    }

    // Tenant overview
    const [projectCount, taskCount, userCount] = await Promise.all([
      this.prisma.tx.project.count({ where: { tenantId } }),
      this.prisma.tx.task.count({ where }),
      this.prisma.tx.user.count({ where: { tenantId } }),
    ]);

    // Active projects
    const activeProjects = await this.prisma.tx.project.count({
      where: {
        tenantId,
        status: 'active',
      },
    });

    // Task completion rate
    const taskStats = await this.prisma.tx.task.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
    });

    const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const completedTasks = taskStats.find(s => s.status === 'done')?._count.id || 0;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      overview: {
        projects: projectCount,
        activeProjects,
        tasks: taskCount,
        users: userCount,
        completionRate,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        byStatus: taskStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.id;
          return acc;
        }, {} as Record<string, number>),
      },
    };
  }

  private async getProgressOverTime(tenantId: string, projectId: string, query: AnalyticsQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : new Date();
    startDate.setDate(startDate.getDate() - 30); // Default to last 30 days
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const timeline: Array<{ date: string; progress: number; tasksCompleted: number }> = [];

    for (let i = 0; i <= daysDiff; i += 7) { // Weekly data points
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);

      const completedTasks = await this.prisma.tx.task.count({
        where: {
          tenantId,
          projectId,
          status: 'done',
          updatedAt: {
            lte: currentDate,
          },
        },
      });

      const totalTasks = await this.prisma.tx.task.count({
        where: {
          tenantId,
          projectId,
        },
      });

      const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      timeline.push({
        date: currentDate.toISOString().split('T')[0],
        progress,
        tasksCompleted: completedTasks,
      });
    }

    // Get milestones (tasks marked as important or blockers)
    const milestones = await this.prisma.tx.task.findMany({
      where: {
        tenantId,
        projectId,
        status: 'done',
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    return {
      timeline,
      milestones: milestones.map((m) => ({
        id: m.id,
        title: m.title,
        date: m.updatedAt.toISOString(),
      })),
    };
  }

  private async calculateTaskVelocity(tenantId: string, query: AnalyticsQueryDto) {
    // Calculate tasks completed per week
    const weeks = query.startDate && query.endDate 
      ? Math.ceil((new Date(query.endDate).getTime() - new Date(query.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000))
      : 4; // Default to 4 weeks

    const completedTasks = await this.prisma.tx.task.count({
      where: {
        tenantId,
        status: 'done',
        ...(query.startDate && query.endDate ? {
          updatedAt: {
            gte: new Date(query.startDate),
            lte: new Date(query.endDate),
          },
        } : {}),
      },
    });

    return {
      tasksPerWeek: weeks > 0 ? completedTasks / weeks : 0,
      totalCompleted: completedTasks,
    };
  }
}




