import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getRedis } from '../common/redis/redis.client';

export interface TrendData {
  date: string;
  value: number;
  label?: string;
}

export interface PerformanceMetrics {
  cycleTime: number; // Average time from start to completion
  leadTime: number; // Average time from creation to completion
  throughput: number; // Tasks completed per period
  workInProgress: number; // Tasks currently in progress
  blockers: number; // Blocked tasks count
}

export interface WorkloadData {
  userId: string;
  userName: string;
  assignedTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  estimatedHours: number;
  loggedHours: number;
  workloadPercentage: number;
}

@Injectable()
export class EnhancedAnalyticsService {
  private readonly logger = new Logger(EnhancedAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get performance metrics for a project or tenant
   */
  async getPerformanceMetrics(tenantId: string, projectId?: string, days = 30): Promise<PerformanceMetrics> {
    const cacheKey = `analytics:performance:${tenantId}:${projectId || 'all'}:${days}`;
    const redis = getRedis();
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
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

    const metrics: PerformanceMetrics = {
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
  async getTrendData(
    tenantId: string,
    metric: 'tasks' | 'projects' | 'completion' | 'velocity',
    projectId?: string,
    days = 30,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ): Promise<TrendData[]> {
    const cacheKey = `analytics:trend:${tenantId}:${metric}:${projectId || 'all'}:${days}:${groupBy}`;
    const redis = getRedis();
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const interval = groupBy === 'day' ? 1 : groupBy === 'week' ? 7 : 30;
    const trendData: TrendData[] = [];

    for (let i = 0; i <= days; i += interval) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + interval);

      const where: any = {
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
  async getWorkloadAnalysis(tenantId: string, projectId?: string): Promise<WorkloadData[]> {
    const cacheKey = `analytics:workload:${tenantId}:${projectId || 'all'}`;
    const redis = getRedis();
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = {
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

    const workloadData: WorkloadData[] = users.map((user) => {
      const assignedTasks = user.taskAssignees.length;
      const completedTasks = user.taskAssignees.filter((ta) => ta.task.status === 'done').length;
      const inProgressTasks = user.taskAssignees.filter((ta) => ta.task.status === 'in-progress').length;
      const now = new Date();
      const overdueTasks = user.taskAssignees.filter(
        (ta) => ta.task.dueDate && ta.task.dueDate < now && ta.task.status !== 'done',
      ).length;

      const estimatedHours = user.taskAssignees.reduce(
        (sum, ta) => sum + (ta.task.estimatedHours || 0),
        0,
      );
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
  async getForecast(tenantId: string, projectId: string, targetDate: string): Promise<{
    predictedCompletion: string;
    confidence: number;
    riskFactors: string[];
  }> {
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

    const riskFactors: string[] = [];
    if (completionRate < 0.3) riskFactors.push('Low completion rate');
    if (daysToComplete > 30) riskFactors.push('Long remaining timeline');
    
    const overdueTasks = project.tasks.filter(
      (t) => t.dueDate && t.dueDate < new Date() && t.status !== 'done',
    ).length;
    if (overdueTasks > 0) riskFactors.push(`${overdueTasks} overdue tasks`);

    const confidence = Math.max(0, Math.min(100, 100 - (riskFactors.length * 20)));

    return {
      predictedCompletion: predictedDate.toISOString(),
      confidence,
      riskFactors,
    };
  }
}

