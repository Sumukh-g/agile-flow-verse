import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getRedis } from '../common/redis/redis.client';

export interface ReportConfig {
  type: 'burndown' | 'velocity' | 'capacity' | 'time-tracking' | 'custom';
  projectId?: string;
  userId?: string;
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
  includeDetails?: boolean;
}

export interface BurndownData {
  date: string;
  planned: number;
  actual: number;
  remaining: number;
  ideal: number;
}

export interface VelocityData {
  sprint: string;
  completed: number;
  planned: number;
  velocity: number;
}

export interface CapacityData {
  userId: string;
  userName: string;
  assignedHours: number;
  loggedHours: number;
  capacity: number;
  utilization: number;
  availability: number;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateBurndownReport(tenantId: string, config: ReportConfig): Promise<BurndownData[]> {
    const cacheKey = `report:burndown:${tenantId}:${config.projectId}:${config.startDate}:${config.endDate}`;
    const redis = getRedis();
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    if (!config.projectId) {
      throw new Error('Project ID is required for burndown report');
    }

    const project = await this.prisma.tx.project.findFirst({
      where: { id: config.projectId, tenantId },
      include: { tasks: true },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const startDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);
    const totalTasks = project.tasks.length;
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const idealBurnRate = totalTasks / daysDiff;

    const burndownData: BurndownData[] = [];
    const groupBy = config.groupBy || 'day';
    const interval = groupBy === 'day' ? 1 : groupBy === 'week' ? 7 : 30;

    for (let i = 0; i <= daysDiff; i += interval) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      const completedTasks = await this.prisma.tx.task.count({
        where: {
          tenantId,
          projectId: config.projectId,
          status: 'done',
          updatedAt: {
            lte: currentDate,
          },
        },
      });

      const remainingTasks = totalTasks - completedTasks;
      const idealRemaining = Math.max(0, totalTasks - (idealBurnRate * i));

      burndownData.push({
        date: dateStr,
        planned: totalTasks,
        actual: completedTasks,
        remaining: remainingTasks,
        ideal: idealRemaining,
      });
    }

    await redis.setex(cacheKey, 300, JSON.stringify(burndownData));
    return burndownData;
  }

  async generateVelocityReport(tenantId: string, config: ReportConfig): Promise<VelocityData[]> {
    const cacheKey = `report:velocity:${tenantId}:${config.startDate}:${config.endDate}`;
    const redis = getRedis();
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const startDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);
    const groupBy = config.groupBy || 'week';
    
    // Calculate sprint periods
    const sprintLength = 14; // 2 weeks
    const sprints: VelocityData[] = [];
    let currentStart = new Date(startDate);

    while (currentStart < endDate) {
      const sprintEnd = new Date(currentStart);
      sprintEnd.setDate(sprintEnd.getDate() + sprintLength);

      const where: any = {
        tenantId,
        status: 'done',
        updatedAt: {
          gte: currentStart,
          lte: sprintEnd > endDate ? endDate : sprintEnd,
        },
      };

      if (config.projectId) {
        where.projectId = config.projectId;
      }

      const [completed, planned] = await Promise.all([
        this.prisma.tx.task.count({ where }),
        this.prisma.tx.task.count({
          where: {
            ...where,
            status: { not: 'done' },
            createdAt: {
              gte: currentStart,
              lte: sprintEnd > endDate ? endDate : sprintEnd,
            },
          },
        }),
      ]);

      sprints.push({
        sprint: `Sprint ${sprints.length + 1} (${currentStart.toISOString().split('T')[0]})`,
        completed,
        planned: planned + completed,
        velocity: completed,
      });

      currentStart = new Date(sprintEnd);
    }

    await redis.setex(cacheKey, 300, JSON.stringify(sprints));
    return sprints;
  }

  async generateCapacityReport(tenantId: string, config: ReportConfig): Promise<CapacityData[]> {
    const cacheKey = `report:capacity:${tenantId}:${config.startDate}:${config.endDate}`;
    const redis = getRedis();
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const startDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const standardCapacity = daysDiff * 8; // 8 hours per day

    // Get all users with tasks
    const users = await this.prisma.tx.user.findMany({
      where: { tenantId },
      include: {
        taskAssignees: {
          where: {
            task: {
              ...(config.projectId ? { projectId: config.projectId } : {}),
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
          include: {
            task: {
              select: {
                estimatedHours: true,
                actualHours: true,
              },
            },
          },
        },
        timesheets: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    });

    const capacityData: CapacityData[] = users.map((user) => {
      const assignedHours = user.taskAssignees.reduce(
        (sum, ta) => sum + (ta.task.estimatedHours || 0),
        0,
      );
      const loggedHours = user.timesheets.reduce((sum, ts) => sum + ts.hours, 0);
      const utilization = standardCapacity > 0 ? (loggedHours / standardCapacity) * 100 : 0;
      const availability = Math.max(0, standardCapacity - assignedHours);

      return {
        userId: user.id,
        userName: user.name,
        assignedHours,
        loggedHours,
        capacity: standardCapacity,
        utilization,
        availability,
      };
    });

    await redis.setex(cacheKey, 300, JSON.stringify(capacityData));
    return capacityData;
  }

  async generateTimeTrackingReport(tenantId: string, config: ReportConfig) {
    const cacheKey = `report:time:${tenantId}:${config.startDate}:${config.endDate}`;
    const redis = getRedis();
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const startDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);

    const where: any = {
      tenantId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (config.projectId) {
      where.task = { projectId: config.projectId };
    }

    if (config.userId) {
      where.userId = config.userId;
    }

    const timesheets = await this.prisma.tx.timesheet.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        task: {
          select: {
            id: true,
            title: true,
            project: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Group by date
    const groupedByDate = timesheets.reduce((acc, ts) => {
      const dateStr = ts.date.toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(ts);
      return acc;
    }, {} as Record<string, typeof timesheets>);

    // Group by user
    const groupedByUser = timesheets.reduce((acc, ts) => {
      if (!acc[ts.userId]) {
        acc[ts.userId] = {
          user: ts.user,
          entries: [],
          totalHours: 0,
        };
      }
      acc[ts.userId].entries.push(ts);
      acc[ts.userId].totalHours += ts.hours;
      return acc;
    }, {} as Record<string, any>);

    // Group by project
    const groupedByProject = timesheets.reduce((acc, ts) => {
      const projectId = ts.task.project.id;
      if (!acc[projectId]) {
        acc[projectId] = {
          project: ts.task.project,
          entries: [],
          totalHours: 0,
        };
      }
      acc[projectId].entries.push(ts);
      acc[projectId].totalHours += ts.hours;
      return acc;
    }, {} as Record<string, any>);

    const report = {
      summary: {
        totalHours: timesheets.reduce((sum, ts) => sum + ts.hours, 0),
        totalEntries: timesheets.length,
        dateRange: {
          start: config.startDate,
          end: config.endDate,
        },
      },
      byDate: groupedByDate,
      byUser: Object.values(groupedByUser),
      byProject: Object.values(groupedByProject),
      details: config.includeDetails ? timesheets : undefined,
    };

    await redis.setex(cacheKey, 300, JSON.stringify(report));
    return report;
  }

  async exportReport(tenantId: string, reportType: string, format: 'csv' | 'json' | 'pdf', data: any): Promise<Buffer | string> {
    switch (format) {
      case 'csv':
        return this.exportToCSV(data);
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'pdf':
        // PDF export would require a library like pdfkit or puppeteer
        throw new Error('PDF export not yet implemented');
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private exportToCSV(data: any): string {
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map((item) =>
        Object.values(item)
          .map((val) => (typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val))
          .join(','),
      );
      
      return [headers, ...rows].join('\n');
    }
    
    return JSON.stringify(data);
  }
}

