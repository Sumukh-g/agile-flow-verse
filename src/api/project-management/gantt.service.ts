import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getRedis } from '../common/redis/redis.client';
import { ProjectPermissionsService } from '../common/project-permissions.service';

export interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies: string[];
  assignees: string[];
  type: 'task' | 'milestone' | 'project';
  parent?: string;
  critical?: boolean;
}

export interface GanttData {
  tasks: GanttTask[];
  criticalPath: string[];
  timeline: {
    start: Date;
    end: Date;
    milestones: Array<{
      id: string;
      name: string;
      date: Date;
      completed: boolean;
    }>;
  };
}

@Injectable()
export class GanttService {
  private readonly logger = new Logger(GanttService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: ProjectPermissionsService,
  ) {}

  /**
   * Generate Gantt chart data for a project
   */
  async getGanttData(tenantId: string, userId: string, projectId: string): Promise<GanttData> {
    await this.permissions.ensureCanReadProject(tenantId, userId, projectId);

    const cacheKey = `gantt:${tenantId}:${projectId}`;
    const redis = getRedis();

    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const project = await this.prisma.tx.project.findFirst({
      where: { id: projectId, tenantId },
      include: {
        tasks: {
          include: {
            assignees: {
              include: {
                user: {
                  select: { id: true, name: true },
                },
              },
            },
            dependencies: {
              include: {
                dependsOn: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Convert tasks to Gantt format
    const ganttTasks: GanttTask[] = project.tasks.map((task) => ({
      id: task.id,
      name: task.title,
      start: task.startDate || task.createdAt,
      end: task.dueDate || new Date(task.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000), // Default 1 week
      progress: this.calculateProgress(task.status),
      dependencies: task.dependencies.map((dep) => dep.dependsOnId),
      assignees: task.assignees.map((a) => a.userId),
      type: task.priority === 'critical' ? 'milestone' : 'task',
      parent: task.parentId || undefined,
      critical: false, // Will be calculated
    }));

    // Calculate critical path
    const criticalPath = this.calculateCriticalPath(ganttTasks);

    // Mark critical tasks
    ganttTasks.forEach((task) => {
      if (criticalPath.includes(task.id)) {
        task.critical = true;
      }
    });

    // Calculate project timeline
    const timeline = this.calculateTimeline(project, ganttTasks);

    const ganttData: GanttData = {
      tasks: ganttTasks,
      criticalPath,
      timeline,
    };

    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(ganttData));

    return ganttData;
  }

  /**
   * Update task dates and recalculate dependencies
   */
  async updateTaskSchedule(
    tenantId: string,
    userId: string,
    projectId: string,
    taskId: string,
    startDate: Date,
    endDate: Date,
  ) {
    await this.permissions.ensureCanWriteProject(tenantId, userId, projectId);

    // Ensure the task actually belongs to the given project/tenant before mutating.
    const task = await this.prisma.tx.task.findFirst({
      where: { id: taskId, tenantId, projectId },
      select: { id: true },
    });
    if (!task) {
      throw new NotFoundException('Task not found in this project');
    }

    // Update task
    await this.prisma.tx.task.update({
      where: { id: taskId },
      data: {
        startDate,
        dueDate: endDate,
      },
    });

    // Get dependent tasks
    const dependentTasks = await this.prisma.tx.taskDependency.findMany({
      where: {
        tenantId,
        dependsOnId: taskId,
      },
      include: {
        task: true,
      },
    });

    // Update dependent tasks (cascade)
    for (const dep of dependentTasks) {
      const taskDuration = dep.task.dueDate && dep.task.startDate
        ? dep.task.dueDate.getTime() - dep.task.startDate.getTime()
        : 7 * 24 * 60 * 60 * 1000; // Default 1 week

      const newStart = new Date(endDate.getTime() + 24 * 60 * 60 * 1000); // Next day
      const newEnd = new Date(newStart.getTime() + taskDuration);

      await this.prisma.tx.task.update({
        where: { id: dep.taskId, tenantId },
        data: {
          startDate: newStart,
          dueDate: newEnd,
        },
      });
    }

    // Invalidate cache
    const redis = getRedis();
    await redis.del(`gantt:${tenantId}:${projectId}`);

    return { updated: true };
  }

  /**
   * Calculate critical path using forward and backward pass
   */
  private calculateCriticalPath(tasks: GanttTask[]): string[] {
    const taskMap = new Map<string, GanttTask>();
    tasks.forEach((task) => taskMap.set(task.id, task));

    // Create adjacency list
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    tasks.forEach((task) => {
      if (!graph.has(task.id)) {
        graph.set(task.id, []);
      }
      inDegree.set(task.id, task.dependencies.length);

      task.dependencies.forEach((depId) => {
        if (!graph.has(depId)) {
          graph.set(depId, []);
        }
        graph.get(depId)!.push(task.id);
      });
    });

    // Forward pass - calculate earliest start/finish
    const earliestStart = new Map<string, number>();
    const earliestFinish = new Map<string, number>();
    const queue: string[] = [];

    // Find start nodes (no dependencies)
    tasks.forEach((task) => {
      if (task.dependencies.length === 0) {
        queue.push(task.id);
        earliestStart.set(task.id, task.start.getTime());
        earliestFinish.set(task.id, task.end.getTime());
      }
    });

    while (queue.length > 0) {
      const taskId = queue.shift()!;
      const task = taskMap.get(taskId)!;
      const es = earliestStart.get(taskId)!;
      const ef = earliestFinish.get(taskId)!;

      const dependents = graph.get(taskId) || [];
      dependents.forEach((depId) => {
        const depTask = taskMap.get(depId)!;
        const duration = depTask.end.getTime() - depTask.start.getTime();
        
        const currentES = earliestStart.get(depId) || 0;
        const newES = Math.max(currentES, ef);
        
        earliestStart.set(depId, newES);
        earliestFinish.set(depId, newES + duration);

        const currentInDegree = inDegree.get(depId)! - 1;
        inDegree.set(depId, currentInDegree);
        
        if (currentInDegree === 0) {
          queue.push(depId);
        }
      });
    }

    // Find end nodes and max finish time
    const endNodes: string[] = [];
    let maxFinish = 0;
    tasks.forEach((task) => {
      const dependents = graph.get(task.id) || [];
      if (dependents.length === 0) {
        endNodes.push(task.id);
        const ef = earliestFinish.get(task.id) || 0;
        maxFinish = Math.max(maxFinish, ef);
      }
    });

    // Backward pass - calculate latest start/finish
    const latestStart = new Map<string, number>();
    const latestFinish = new Map<string, number>();

    endNodes.forEach((nodeId) => {
      latestFinish.set(nodeId, maxFinish);
      const task = taskMap.get(nodeId)!;
      const duration = task.end.getTime() - task.start.getTime();
      latestStart.set(nodeId, maxFinish - duration);
    });

    // Backward propagation
    const reverseQueue = [...endNodes];
    const visited = new Set<string>();

    while (reverseQueue.length > 0) {
      const taskId = reverseQueue.shift()!;
      if (visited.has(taskId)) continue;
      visited.add(taskId);

      const task = taskMap.get(taskId)!;
      const ls = latestStart.get(taskId)!;

      task.dependencies.forEach((depId) => {
        const depTask = taskMap.get(depId)!;
        const duration = depTask.end.getTime() - depTask.start.getTime();
        
        const currentLF = latestFinish.get(depId) || Infinity;
        const newLF = Math.min(currentLF, ls);
        
        latestFinish.set(depId, newLF);
        latestStart.set(depId, newLF - duration);

        reverseQueue.push(depId);
      });
    }

    // Find critical path (tasks with zero slack)
    const criticalPath: string[] = [];
    tasks.forEach((task) => {
      const es = earliestStart.get(task.id) || 0;
      const ls = latestStart.get(task.id) || 0;
      const slack = ls - es;

      if (Math.abs(slack) < 1000) { // Less than 1 second slack
        criticalPath.push(task.id);
      }
    });

    return criticalPath;
  }

  /**
   * Calculate project timeline with milestones
   */
  private calculateTimeline(project: any, tasks: GanttTask[]) {
    const start = project.startDate || new Date(Math.min(...tasks.map((t) => t.start.getTime())));
    const end = project.endDate || new Date(Math.max(...tasks.map((t) => t.end.getTime())));

    const milestones = tasks
      .filter((t) => t.type === 'milestone')
      .map((t) => ({
        id: t.id,
        name: t.name,
        date: t.end,
        completed: t.progress === 100,
      }));

    return {
      start,
      end,
      milestones,
    };
  }

  /**
   * Calculate progress percentage from status
   */
  private calculateProgress(status: string): number {
    const progressMap: Record<string, number> = {
      'todo': 0,
      'in-progress': 50,
      'review': 80,
      'done': 100,
    };
    return progressMap[status] || 0;
  }

  /**
   * Optimize project schedule
   */
  async optimizeSchedule(tenantId: string, userId: string, projectId: string) {
    await this.permissions.ensureCanReadProject(tenantId, userId, projectId);
    const ganttData = await this.getGanttData(tenantId, userId, projectId);
    
    // Simple optimization: level resources and minimize project duration
    const suggestions = [];

    // Check for resource conflicts
    const resourceConflicts = this.findResourceConflicts(ganttData.tasks);
    if (resourceConflicts.length > 0) {
      suggestions.push({
        type: 'resource_conflict',
        message: 'Resource conflicts detected',
        conflicts: resourceConflicts,
      });
    }

    // Check for long critical path
    if (ganttData.criticalPath.length > ganttData.tasks.length * 0.5) {
      suggestions.push({
        type: 'critical_path',
        message: 'More than 50% of tasks are on critical path',
        recommendation: 'Consider parallelizing tasks or adding resources',
      });
    }

    // Check for idle resources
    const resourceUtilization = this.calculateResourceUtilization(ganttData.tasks);
    const underutilized = resourceUtilization.filter((r) => r.utilization < 50);
    if (underutilized.length > 0) {
      suggestions.push({
        type: 'underutilized_resources',
        message: 'Some resources are underutilized',
        resources: underutilized,
      });
    }

    return {
      currentDuration: ganttData.timeline.end.getTime() - ganttData.timeline.start.getTime(),
      criticalPathLength: ganttData.criticalPath.length,
      suggestions,
    };
  }

  private findResourceConflicts(tasks: GanttTask[]): Array<{ userId: string; tasks: string[] }> {
    const conflicts: Array<{ userId: string; tasks: string[] }> = [];
    const resourceSchedule = new Map<string, Array<{ taskId: string; start: Date; end: Date }>>();

    tasks.forEach((task) => {
      task.assignees.forEach((userId) => {
        if (!resourceSchedule.has(userId)) {
          resourceSchedule.set(userId, []);
        }
        resourceSchedule.get(userId)!.push({
          taskId: task.id,
          start: task.start,
          end: task.end,
        });
      });
    });

    resourceSchedule.forEach((schedule, userId) => {
      const sortedSchedule = schedule.sort((a, b) => a.start.getTime() - b.start.getTime());
      const conflictingTasks: string[] = [];

      for (let i = 0; i < sortedSchedule.length - 1; i++) {
        const current = sortedSchedule[i];
        const next = sortedSchedule[i + 1];

        if (current.end > next.start) {
          conflictingTasks.push(current.taskId, next.taskId);
        }
      }

      if (conflictingTasks.length > 0) {
        conflicts.push({
          userId,
          tasks: [...new Set(conflictingTasks)],
        });
      }
    });

    return conflicts;
  }

  private calculateResourceUtilization(tasks: GanttTask[]): Array<{
    userId: string;
    utilization: number;
    assignedTasks: number;
  }> {
    const resourceStats = new Map<string, { totalTime: number; assignedTasks: number }>();

    const projectStart = Math.min(...tasks.map((t) => t.start.getTime()));
    const projectEnd = Math.max(...tasks.map((t) => t.end.getTime()));
    const projectDuration = projectEnd - projectStart;

    tasks.forEach((task) => {
      const taskDuration = task.end.getTime() - task.start.getTime();
      task.assignees.forEach((userId) => {
        if (!resourceStats.has(userId)) {
          resourceStats.set(userId, { totalTime: 0, assignedTasks: 0 });
        }
        const stats = resourceStats.get(userId)!;
        stats.totalTime += taskDuration;
        stats.assignedTasks += 1;
      });
    });

    return Array.from(resourceStats.entries()).map(([userId, stats]) => ({
      userId,
      utilization: projectDuration > 0 ? (stats.totalTime / projectDuration) * 100 : 0,
      assignedTasks: stats.assignedTasks,
    }));
  }
}

