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

export interface ProjectSummaryReport {
  summary: {
    openTasks: number;
    doneTasks: number;
    workInProgress: number;
    averageCycleTime: number; // in days
  };
  tasksByStatus: Array<{ status: string; count: number }>;
  createdVsCompleted: Array<{ week: string; created: number; completed: number }>;
  workloadByAssignee: Array<{ userId: string; userName: string; openTasks: number; inProgressTasks: number; totalTasks: number }>;
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

  async generateProjectSummaryReport(tenantId: string, projectId: string): Promise<ProjectSummaryReport> {
    const cacheKey = `report:project-summary:${tenantId}:${projectId}`;
    const redis = getRedis();
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Verify project exists
    const project = await this.prisma.tx.project.findFirst({
      where: { id: projectId, tenantId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Calculate date ranges
    const endDate = new Date();
    const startDate30Days = new Date();
    startDate30Days.setDate(endDate.getDate() - 30);
    
    const startDate8Weeks = new Date();
    startDate8Weeks.setDate(endDate.getDate() - 56); // 8 weeks

    // Get all tasks for the project (optimized with select)
    const whereClause = {
      tenantId,
      projectId,
    };

    // Summary: Open vs Done tasks (using groupBy for efficiency)
    const [taskStatusCounts, wipCount, doneCount] = await Promise.all([
      this.prisma.tx.task.groupBy({
        by: ['status'],
        where: whereClause,
        _count: { id: true },
      }),
      this.prisma.tx.task.count({
        where: { ...whereClause, status: 'in-progress' },
      }),
      this.prisma.tx.task.count({
        where: { ...whereClause, status: 'done' },
      }),
    ]);

    const openTasks = taskStatusCounts
      .filter(t => t.status !== 'done')
      .reduce((sum, t) => sum + t._count.id, 0);

    // Calculate average cycle time (last 30 days)
    const completedTasks30Days = await this.prisma.tx.task.findMany({
      where: {
        ...whereClause,
        status: 'done',
        updatedAt: {
          gte: startDate30Days,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    const cycleTimes = completedTasks30Days.map((task) => {
      return task.updatedAt.getTime() - task.createdAt.getTime();
    });
    const averageCycleTime = cycleTimes.length > 0
      ? cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    // Tasks by status
    const tasksByStatus = taskStatusCounts.map(t => ({
      status: t.status,
      count: t._count.id,
    }));

    // Created vs Completed per week (last 8 weeks)
    const createdVsCompleted: Array<{ week: string; created: number; completed: number }> = [];
    for (let weekOffset = 7; weekOffset >= 0; weekOffset--) {
      const weekStart = new Date(startDate8Weeks);
      weekStart.setDate(weekStart.getDate() + (weekOffset * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const weekLabel = weekStart.toISOString().split('T')[0];

      const [created, completed] = await Promise.all([
        this.prisma.tx.task.count({
          where: {
            ...whereClause,
            createdAt: {
              gte: weekStart,
              lt: weekEnd,
            },
          },
        }),
        this.prisma.tx.task.count({
          where: {
            ...whereClause,
            status: 'done',
            updatedAt: {
              gte: weekStart,
              lt: weekEnd,
            },
          },
        }),
      ]);

      createdVsCompleted.push({
        week: weekLabel,
        created,
        completed,
      });
    }

    // Workload by assignee
    const taskAssignees = await this.prisma.tx.taskAssignee.findMany({
      where: {
        tenantId,
        task: {
          projectId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        task: {
          select: {
            status: true,
          },
        },
      },
    });

    // Group by user
    const workloadMap = new Map<string, { userId: string; userName: string; openTasks: number; inProgressTasks: number; totalTasks: number }>();
    
    taskAssignees.forEach((ta) => {
      const userId = ta.userId;
      if (!workloadMap.has(userId)) {
        workloadMap.set(userId, {
          userId,
          userName: ta.user.name,
          openTasks: 0,
          inProgressTasks: 0,
          totalTasks: 0,
        });
      }
      
      const workload = workloadMap.get(userId)!;
      workload.totalTasks++;
      
      if (ta.task.status === 'in-progress') {
        workload.inProgressTasks++;
      } else if (ta.task.status !== 'done') {
        workload.openTasks++;
      }
    });

    const workloadByAssignee = Array.from(workloadMap.values());

    const report: ProjectSummaryReport = {
      summary: {
        openTasks,
        doneTasks: doneCount,
        workInProgress: wipCount,
        averageCycleTime: Math.round(averageCycleTime * 10) / 10, // Round to 1 decimal
      },
      tasksByStatus,
      createdVsCompleted,
      workloadByAssignee,
    };

    await redis.setex(cacheKey, 300, JSON.stringify(report));
    return report;
  }

  async generateEmailReport(
    tenantId: string,
    projectId: string,
    recipients: string[],
    reportType: 'summary' | 'full',
    format: 'html',
  ): Promise<{ subject: string; body: string; recipients: string[] }> {
    // Get project info
    const project = await this.prisma.tx.project.findFirst({
      where: { id: projectId, tenantId },
      select: { name: true },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Get report data
    const reportData = await this.generateProjectSummaryReport(tenantId, projectId);

    // Generate email subject
    const subject = `Project Report: ${project.name} - ${new Date().toLocaleDateString()}`;

    // Generate HTML email body
    const body = this.generateEmailHTML(project.name, reportData, reportType);

    return {
      subject,
      body,
      recipients,
    };
  }

  private generateEmailHTML(projectName: string, data: ProjectSummaryReport, reportType: 'summary' | 'full'): string {
    const { summary, tasksByStatus, createdVsCompleted, workloadByAssignee } = data;

    // Create status table
    const statusTableRows = tasksByStatus.map(t => 
      `<tr><td>${t.status}</td><td>${t.count}</td></tr>`
    ).join('');

    // Create workload table
    const workloadTableRows = workloadByAssignee.map(w => 
      `<tr><td>${w.userName}</td><td>${w.openTasks}</td><td>${w.inProgressTasks}</td><td>${w.totalTasks}</td></tr>`
    ).join('');

    // Create created vs completed table
    const createdVsCompletedRows = createdVsCompleted.map(w => 
      `<tr><td>${w.week}</td><td>${w.created}</td><td>${w.completed}</td></tr>`
    ).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #2563eb; }
    h2 { color: #1e40af; margin-top: 30px; }
    .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
    .summary-card { background: #f3f4f6; padding: 15px; border-radius: 8px; }
    .summary-card h3 { margin: 0 0 10px 0; font-size: 14px; color: #6b7280; }
    .summary-card .value { font-size: 32px; font-weight: bold; color: #111827; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background-color: #f9fafb; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Project Report: ${projectName}</h1>
    <p>Generated on ${new Date().toLocaleDateString()}</p>

    <h2>Summary</h2>
    <div class="summary-grid">
      <div class="summary-card">
        <h3>Open Tasks</h3>
        <div class="value">${summary.openTasks}</div>
      </div>
      <div class="summary-card">
        <h3>Completed Tasks</h3>
        <div class="value">${summary.doneTasks}</div>
      </div>
      <div class="summary-card">
        <h3>Work in Progress</h3>
        <div class="value">${summary.workInProgress}</div>
      </div>
      <div class="summary-card">
        <h3>Average Cycle Time</h3>
        <div class="value">${summary.averageCycleTime} days</div>
      </div>
    </div>

    <h2>Tasks by Status</h2>
    <table>
      <thead>
        <tr>
          <th>Status</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>
        ${statusTableRows}
      </tbody>
    </table>

    <h2>Created vs Completed (Last 8 Weeks)</h2>
    <table>
      <thead>
        <tr>
          <th>Week</th>
          <th>Created</th>
          <th>Completed</th>
        </tr>
      </thead>
      <tbody>
        ${createdVsCompletedRows}
      </tbody>
    </table>

    <h2>Workload by Assignee</h2>
    <table>
      <thead>
        <tr>
          <th>Assignee</th>
          <th>Open Tasks</th>
          <th>In Progress</th>
          <th>Total Tasks</th>
        </tr>
      </thead>
      <tbody>
        ${workloadTableRows || '<tr><td colspan="4">No assignees found</td></tr>'}
      </tbody>
    </table>
  </div>
</body>
</html>
    `.trim();
  }

  async generateComprehensiveReport(
    tenantId: string,
    projectId: string,
    options: {
      category?: string;
      type?: string;
      dataSource?: string;
      includeTasks?: boolean;
      includeIssues?: boolean;
      includeApprovals?: boolean;
      includeTeam?: boolean;
      includeBudget?: boolean;
      includeTimeTracking?: boolean;
    },
  ): Promise<any> {
    const cacheKey = `report:comprehensive:${tenantId}:${projectId}:${JSON.stringify(options)}`;
    const redis = getRedis();
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Verify project exists
    const project = await this.prisma.tx.project.findFirst({
      where: { id: projectId, tenantId },
      include: {
        members: {
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

    if (!project) {
      throw new Error('Project not found');
    }

    const report: any = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        progress: project.progress,
        startDate: project.startDate,
        endDate: project.endDate,
        budget: project.budget,
        spent: project.spent,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
      generatedAt: new Date().toISOString(),
      options,
      summary: {
        totalTasks: 0,
        completedTasks: 0,
        openTasks: 0,
        totalIssues: 0,
        openIssues: 0,
        totalApprovals: 0,
        pendingApprovals: 0,
        teamSize: project.members.length,
        totalBudget: project.budget || 0,
        spentBudget: project.spent || 0,
        totalHours: 0,
      },
    };

    // Include Tasks
    if (options.includeTasks !== false && (options.dataSource === 'tasks' || options.dataSource === 'overall' || !options.dataSource)) {
      const tasks = await this.prisma.tx.task.findMany({
        where: { tenantId, projectId },
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
        },
        orderBy: { createdAt: 'desc' },
      });

      const taskStats = await this.prisma.tx.task.groupBy({
        by: ['status'],
        where: { tenantId, projectId },
        _count: { id: true },
      });

      const completedCount = tasks.filter(t => t.status === 'done').length;
      const openCount = tasks.filter(t => t.status !== 'done').length;
      
      report.tasks = {
        total: tasks.length,
        byStatus: taskStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        remaining: openCount,
        completed: completedCount,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        todo: tasks.filter(t => t.status === 'todo').length,
        details: tasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
          estimatedHours: t.estimatedHours,
          actualHours: t.actualHours,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          assignees: t.assignees.map(a => ({
            id: a.user.id,
            name: a.user.name,
            email: a.user.email,
          })),
        })),
      };
      
      // Update summary
      report.summary.totalTasks = tasks.length;
      report.summary.completedTasks = completedCount;
      report.summary.openTasks = openCount;
    }

    // Include Issues
    if (options.includeIssues !== false && (options.dataSource === 'tasks' || options.dataSource === 'overall' || !options.dataSource)) {
      const issues = await this.prisma.tx.issue.findMany({
        where: { tenantId, projectId },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reporter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const issueStats = await this.prisma.tx.issue.groupBy({
        by: ['status'],
        where: { tenantId, projectId },
        _count: { id: true },
      });

      const issueTypeStats = await this.prisma.tx.issue.groupBy({
        by: ['type'],
        where: { tenantId, projectId },
        _count: { id: true },
      });

      const issuePriorityStats = await this.prisma.tx.issue.groupBy({
        by: ['priority'],
        where: { tenantId, projectId },
        _count: { id: true },
      });

      const openIssuesCount = issues.filter(i => i.status !== 'DONE' && i.status !== 'WONT_DO').length;
      
      report.issues = {
        total: issues.length,
        byStatus: issueStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        byType: issueTypeStats.reduce((acc, stat) => {
          acc[stat.type] = stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        byPriority: issuePriorityStats.reduce((acc, stat) => {
          acc[stat.priority] = stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        open: openIssuesCount,
        closed: issues.filter(i => i.status === 'DONE' || i.status === 'WONT_DO').length,
        details: issues.map(i => ({
          id: i.id,
          title: i.title,
          description: i.description,
          status: i.status,
          type: i.type,
          priority: i.priority,
          severity: i.severity,
          dueDate: i.dueDate,
          tags: i.tags,
          createdAt: i.createdAt,
          updatedAt: i.updatedAt,
          assignee: i.assignee ? {
            id: i.assignee.id,
            name: i.assignee.name,
            email: i.assignee.email,
          } : null,
          reporter: {
            id: i.reporter.id,
            name: i.reporter.name,
            email: i.reporter.email,
          },
        })),
      };
      
      // Update summary
      report.summary.totalIssues = issues.length;
      report.summary.openIssues = openIssuesCount;
    }

    // Include Approvals (from notes with approval kind)
    if (options.includeApprovals !== false && (options.dataSource === 'overall' || !options.dataSource)) {
      const notes = await this.prisma.tx.note.findMany({
        where: { tenantId, projectId },
        orderBy: { createdAt: 'desc' },
      });

      const approvals = notes
        .map(note => {
          try {
            const content = typeof note.content === 'string' ? JSON.parse(note.content) : note.content;
            if (content?.meta?.kind === 'approval') {
              return {
                id: note.id,
                title: note.title,
                description: content.description || '',
                type: content.meta.type || 'General',
                priority: content.meta.priority || 'Medium',
                status: content.meta.status || 'Pending',
                requester: content.meta.requester || '',
                currentApprover: content.meta.currentApprover || null,
                approvalChain: content.meta.approvalChain || [],
                dueDate: content.meta.dueDate || null,
                documents: content.meta.documents || [],
                comments: content.meta.comments || [],
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
              };
            }
            return null;
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const approvalStats = approvals.reduce((acc, a: any) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const pendingCount = approvals.filter((a: any) => a.status === 'Pending' || a.status === 'pending').length;
      
      report.approvals = {
        total: approvals.length,
        byStatus: approvalStats,
        pending: pendingCount,
        approved: approvals.filter((a: any) => a.status === 'Approved' || a.status === 'approved').length,
        rejected: approvals.filter((a: any) => a.status === 'Rejected' || a.status === 'rejected').length,
        details: approvals,
      };
      
      // Update summary
      report.summary.totalApprovals = approvals.length;
      report.summary.pendingApprovals = pendingCount;
    }

    // Include Team Members
    if (options.includeTeam !== false && (options.dataSource === 'team' || options.dataSource === 'overall' || !options.dataSource)) {
      report.team = {
        totalMembers: project.members.length,
        members: project.members.map(m => ({
          id: m.userId,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
          joinedAt: m.createdAt,
        })),
        byRole: project.members.reduce((acc, m) => {
          acc[m.role] = (acc[m.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };
    }

    // Include Budget & Finance
    if (options.includeBudget !== false && (options.dataSource === 'budget' || options.dataSource === 'overall' || !options.dataSource)) {
      const timesheets = await this.prisma.tx.timesheet.findMany({
        where: {
          tenantId,
          task: {
            projectId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const totalHours = timesheets.reduce((sum, ts) => sum + ts.hours, 0);
      const totalCost = totalHours * 50; // Assuming $50/hour average rate

      report.budget = {
        allocated: project.budget || 0,
        spent: project.spent || 0,
        remaining: (project.budget || 0) - (project.spent || 0),
        utilization: project.budget ? ((project.spent || 0) / project.budget) * 100 : 0,
        timeTracking: {
          totalHours,
          totalCost,
          entries: timesheets.length,
          byUser: timesheets.reduce((acc, ts) => {
            const userId = ts.userId;
            if (!acc[userId]) {
              acc[userId] = {
                userId,
                userName: ts.user.name,
                hours: 0,
                cost: 0,
              };
            }
            acc[userId].hours += ts.hours;
            acc[userId].cost += ts.hours * 50;
            return acc;
          }, {} as Record<string, any>),
        },
      };
    }

    // Include Time Tracking
    if (options.includeTimeTracking !== false && (options.dataSource === 'time' || options.dataSource === 'overall' || !options.dataSource)) {
      const timesheets = await this.prisma.tx.timesheet.findMany({
        where: {
          tenantId,
          task: {
            projectId,
          },
        },
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
              status: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      });

      const timeByUser = timesheets.reduce((acc, ts) => {
        const userId = ts.userId;
        if (!acc[userId]) {
          acc[userId] = {
            userId,
            userName: ts.user.name,
            totalHours: 0,
            entries: [],
          };
        }
        acc[userId].totalHours += ts.hours;
        acc[userId].entries.push({
          date: ts.date,
          hours: ts.hours,
          task: {
            id: ts.task.id,
            title: ts.task.title,
            status: ts.task.status,
          },
        });
        return acc;
      }, {} as Record<string, any>);

      const totalHours = timesheets.reduce((sum, ts) => sum + ts.hours, 0);
      
      report.timeTracking = {
        totalHours,
        totalEntries: timesheets.length,
        byUser: Object.values(timeByUser),
        recentEntries: timesheets.slice(0, 50).map(ts => ({
          date: ts.date,
          hours: ts.hours,
          user: {
            id: ts.user.id,
            name: ts.user.name,
            email: ts.user.email,
          },
          task: {
            id: ts.task.id,
            title: ts.task.title,
            status: ts.task.status,
          },
        })),
      };
      
      // Update summary
      report.summary.totalHours = totalHours;
    }

    // Include Notes (all notes for the project)
    if (options.dataSource === 'overall' || !options.dataSource) {
      const notes = await this.prisma.tx.note.findMany({
        where: { tenantId, projectId },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      });

      const notesByType = notes.reduce((acc, note) => {
        try {
          const content = typeof note.content === 'string' ? JSON.parse(note.content) : note.content;
          const noteType = content?.meta?.kind || 'note';
          if (!acc[noteType]) acc[noteType] = [];
          acc[noteType].push({
            id: note.id,
            title: note.title,
            type: noteType,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
          });
        } catch {
          if (!acc.note) acc.note = [];
          acc.note.push({
            id: note.id,
            title: note.title,
            type: 'note',
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
          });
        }
        return acc;
      }, {} as Record<string, any[]>);

      report.notes = {
        total: notes.length,
        byType: Object.keys(notesByType).reduce((acc, key) => {
          acc[key] = notesByType[key].length;
          return acc;
        }, {} as Record<string, number>),
        details: notes.slice(0, 50).map(note => ({
          id: note.id,
          title: note.title,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        })),
      };
    }

    // Include Attachments
    if (options.dataSource === 'overall' || !options.dataSource) {
      const attachments = await this.prisma.tx.attachment.findMany({
        where: { tenantId, projectId },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const totalSize = attachments.reduce((sum, att) => sum + att.sizeBytes, 0);
      const byType = attachments.reduce((acc, att) => {
        const type = att.mimeType.split('/')[0] || 'other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      report.attachments = {
        total: attachments.length,
        totalSizeBytes: totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        byType,
        details: attachments.map(att => ({
          id: att.id,
          filename: att.filename,
          mimeType: att.mimeType,
          sizeBytes: att.sizeBytes,
          uploadedBy: {
            id: att.uploader.id,
            name: att.uploader.name,
            email: att.uploader.email,
          },
          createdAt: att.createdAt,
        })),
      };
    }

    // Include Board/List Summary (tasks organized by status)
    if (options.includeTasks !== false && (options.dataSource === 'tasks' || options.dataSource === 'overall' || !options.dataSource)) {
      const taskStatusCounts = await this.prisma.tx.task.groupBy({
        by: ['status'],
        where: { tenantId, projectId },
        _count: { id: true },
      });

      report.board = {
        columns: taskStatusCounts.map(stat => ({
          status: stat.status,
          count: stat._count.id,
        })),
        totalTasks: taskStatusCounts.reduce((sum, stat) => sum + stat._count.id, 0),
      };
    }

    // Include Calendar Summary (tasks with due dates)
    if (options.includeTasks !== false && (options.dataSource === 'tasks' || options.dataSource === 'overall' || !options.dataSource)) {
      const tasksWithDueDates = await this.prisma.tx.task.findMany({
        where: {
          tenantId,
          projectId,
          dueDate: { not: null },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          status: true,
        },
        orderBy: { dueDate: 'asc' },
        take: 50,
      });

      const upcomingTasks = tasksWithDueDates.filter(t => {
        const dueDate = new Date(t.dueDate!);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate >= today;
      });

      const overdueTasks = tasksWithDueDates.filter(t => {
        const dueDate = new Date(t.dueDate!);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate < today && t.status !== 'done';
      });

      report.calendar = {
        totalTasksWithDueDates: tasksWithDueDates.length,
        upcoming: upcomingTasks.length,
        overdue: overdueTasks.length,
        upcomingTasks: upcomingTasks.slice(0, 20).map(t => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
          status: t.status,
        })),
        overdueTasks: overdueTasks.slice(0, 20).map(t => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
          status: t.status,
        })),
      };
    }

    // Include Timeline Summary (tasks with dates)
    if (options.includeTasks !== false && (options.dataSource === 'tasks' || options.dataSource === 'overall' || !options.dataSource)) {
      const tasksWithDates = await this.prisma.tx.task.findMany({
        where: { tenantId, projectId },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          dueDate: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      report.timeline = {
        totalTasks: tasksWithDates.length,
        byMonth: tasksWithDates.reduce((acc, task) => {
          const month = new Date(task.createdAt).toISOString().slice(0, 7); // YYYY-MM
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recentTasks: tasksWithDates.slice(0, 20).map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          dueDate: t.dueDate,
        })),
      };
    }

    await redis.setex(cacheKey, 300, JSON.stringify(report));
    return report;
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

