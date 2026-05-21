import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ProjectPermissionsService } from '../common/project-permissions.service';
import { getRedis } from '../common/redis/redis.client';

/**
 * Gantt Service
 * Handles all Gantt chart operations (tasks, dependencies, scheduling)
 * Separate from Kanban board to avoid data conflicts
 */
export interface GanttTaskDto {
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
  tasks: GanttTaskDto[];
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
    private readonly realtime: RealtimeService,
    private readonly permissions: ProjectPermissionsService,
  ) {}

  /**
   * Get all Gantt tasks for a project
   */
  async getGanttData(tenantId: string, userId: string, projectId: string): Promise<GanttData> {
    // Verify project access
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
        ganttTasks: {
          include: {
            dependenciesFrom: {
              include: {
                to: true,
              },
            },
            dependenciesTo: {
              include: {
                from: true,
              },
            },
            parent: true,
            children: true,
          },
          orderBy: { startDate: 'asc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Convert GanttTask models to DTO format
    const ganttTasks: GanttTaskDto[] = project.ganttTasks.map((task) => ({
      id: task.id,
      name: task.name,
      start: task.startDate,
      end: task.endDate,
      progress: task.progress,
      dependencies: task.dependenciesFrom.map((dep) => dep.toTaskId),
      assignees: task.assignees,
      type: task.type as 'task' | 'milestone' | 'project',
      parent: task.parentId || undefined,
      critical: task.critical,
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
   * Create a new Gantt task
   */
  async createTask(tenantId: string, userId: string, projectId: string, dto: any) {
    await this.permissions.ensureCanReadProject(tenantId, userId, projectId);

    // Validate required fields
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Task name is required');
    }

    // Verify parent exists if provided
    if (dto.parentId) {
      const parent = await this.prisma.tx.ganttTask.findFirst({
        where: { id: dto.parentId, projectId, tenantId },
      });

      if (!parent) {
        throw new NotFoundException('Parent task not found');
      }
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDate = dto.endDate ? new Date(dto.endDate) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const task = await this.prisma.tx.ganttTask.create({
      data: {
        projectId,
        tenantId,
        name: dto.name,
        description: dto.description,
        startDate,
        endDate,
        progress: dto.progress || 0,
        type: dto.type || 'task',
        priority: dto.priority || 'medium',
        status: dto.status || 'not-started',
        assignees: dto.assignees || [],
        parentId: dto.parentId,
        critical: dto.critical || false,
        duration: dto.duration || Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        notes: dto.notes,
        groupId: dto.groupId,
      },
    });

    // Create dependencies if provided
    if (dto.dependencies && dto.dependencies.length > 0) {
      await Promise.all(
        dto.dependencies.map((depTaskId: string) =>
          this.createDependency(tenantId, userId, projectId, depTaskId, task.id, dto.dependencyType || 'finish-to-start'),
        ),
      );
    }

    // Invalidate cache
    const redis = getRedis();
    await redis.del(`gantt:${tenantId}:${projectId}`);

    await this.realtime.broadcastProjectUpdate(tenantId, projectId, 'gantt.task.created', task);
    return task;
  }

  /**
   * Update a Gantt task
   */
  async updateTask(tenantId: string, userId: string, projectId: string, taskId: string, dto: any) {
    await this.permissions.ensureCanReadProject(tenantId, userId, projectId);

    const task = await this.prisma.tx.ganttTask.findFirst({
      where: { id: taskId, projectId, tenantId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.startDate !== undefined) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) updateData.endDate = new Date(dto.endDate);
    if (dto.progress !== undefined) updateData.progress = dto.progress;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.assignees !== undefined) updateData.assignees = dto.assignees;
    if (dto.parentId !== undefined) updateData.parentId = dto.parentId;
    if (dto.critical !== undefined) updateData.critical = dto.critical;
    if (dto.duration !== undefined) updateData.duration = dto.duration;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.groupId !== undefined) updateData.groupId = dto.groupId;

    // Recalculate duration if dates changed
    if (dto.startDate || dto.endDate) {
      const start = updateData.startDate || task.startDate;
      const end = updateData.endDate || task.endDate;
      updateData.duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }

    const updated = await this.prisma.tx.ganttTask.update({
      where: { id: taskId },
      data: updateData,
    });

    // Update dependencies if provided
    if (dto.dependencies !== undefined) {
      // Delete existing dependencies
      await this.prisma.tx.ganttDependency.deleteMany({
        where: { fromTaskId: taskId, tenantId },
      });

      // Create new dependencies
      if (dto.dependencies.length > 0) {
        await Promise.all(
          dto.dependencies.map((depTaskId: string) =>
            this.createDependency(tenantId, userId, projectId, depTaskId, taskId, dto.dependencyType || 'finish-to-start'),
          ),
        );
      }
    }

    // Invalidate cache
    const redis = getRedis();
    await redis.del(`gantt:${tenantId}:${projectId}`);

    await this.realtime.broadcastProjectUpdate(tenantId, projectId, 'gantt.task.updated', updated);
    return updated;
  }

  /**
   * Delete a Gantt task
   */
  async deleteTask(tenantId: string, userId: string, projectId: string, taskId: string) {
    await this.permissions.ensureCanReadProject(tenantId, userId, projectId);

    const task = await this.prisma.tx.ganttTask.findFirst({
      where: { id: taskId, projectId, tenantId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Delete dependencies
    await this.prisma.tx.ganttDependency.deleteMany({
      where: {
        OR: [{ fromTaskId: taskId, tenantId }, { toTaskId: taskId, tenantId }],
      },
    });

    // Delete the task (children will be orphaned or cascade based on schema)
    await this.prisma.tx.ganttTask.delete({
      where: { id: taskId },
    });

    // Invalidate cache
    const redis = getRedis();
    await redis.del(`gantt:${tenantId}:${projectId}`);

    await this.realtime.broadcastProjectUpdate(tenantId, projectId, 'gantt.task.deleted', { id: taskId });
    return { ok: true };
  }

  /**
   * Create a dependency between two Gantt tasks
   */
  async createDependency(
    tenantId: string,
    userId: string,
    projectId: string,
    fromTaskId: string,
    toTaskId: string,
    type: string = 'finish-to-start',
    lag: number = 0,
  ) {
    await this.permissions.ensureCanReadProject(tenantId, userId, projectId);

    // Prevent self-dependency
    if (fromTaskId === toTaskId) {
      throw new BadRequestException('Task cannot depend on itself');
    }

    // Verify both tasks exist
    const [fromTask, toTask] = await Promise.all([
      this.prisma.tx.ganttTask.findFirst({ where: { id: fromTaskId, projectId, tenantId } }),
      this.prisma.tx.ganttTask.findFirst({ where: { id: toTaskId, projectId, tenantId } }),
    ]);

    if (!fromTask || !toTask) {
      throw new NotFoundException('One or both tasks not found');
    }

    // Check for cycles
    await this.ensureNoCycles(fromTaskId, toTaskId, tenantId);

    const dependency = await this.prisma.tx.ganttDependency.create({
      data: {
        tenantId,
        fromTaskId,
        toTaskId,
        type,
        lag,
      },
    });

    // Invalidate cache
    const redis = getRedis();
    await redis.del(`gantt:${tenantId}:${projectId}`);

    await this.realtime.broadcastProjectUpdate(tenantId, projectId, 'gantt.dependency.created', dependency);
    return dependency;
  }

  /**
   * Delete a dependency
   */
  async deleteDependency(tenantId: string, userId: string, projectId: string, dependencyId: string) {
    await this.permissions.ensureCanReadProject(tenantId, userId, projectId);

    await this.prisma.tx.ganttDependency.delete({
      where: { id: dependencyId, tenantId },
    });

    // Invalidate cache
    const redis = getRedis();
    await redis.del(`gantt:${tenantId}:${projectId}`);

    await this.realtime.broadcastProjectUpdate(tenantId, projectId, 'gantt.dependency.deleted', { id: dependencyId });
    return { ok: true };
  }

  /**
   * Update task schedule (dates) and recalculate dependent tasks
   */
  async updateTaskSchedule(
    tenantId: string,
    userId: string,
    projectId: string,
    taskId: string,
    startDate: Date,
    endDate: Date,
  ) {
    await this.permissions.ensureCanReadProject(tenantId, userId, projectId);

    // Update task
    await this.prisma.tx.ganttTask.update({
      where: { id: taskId, tenantId },
      data: {
        startDate,
        endDate,
        duration: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      },
    });

    // Get dependent tasks (tasks that depend on this one)
    const dependentTasks = await this.prisma.tx.ganttDependency.findMany({
      where: {
        tenantId,
        fromTaskId: taskId,
      },
      include: {
        to: true,
      },
    });

    // Update dependent tasks based on dependency type
    for (const dep of dependentTasks) {
      const taskDuration = dep.to.duration
        ? dep.to.duration * 24 * 60 * 60 * 1000
        : dep.to.endDate.getTime() - dep.to.startDate.getTime();

      let newStart: Date;
      let newEnd: Date;

      switch (dep.type) {
        case 'finish-to-start':
          newStart = new Date(endDate.getTime() + dep.lag * 24 * 60 * 60 * 1000);
          newEnd = new Date(newStart.getTime() + taskDuration);
          break;
        case 'start-to-start':
          newStart = new Date(startDate.getTime() + dep.lag * 24 * 60 * 60 * 1000);
          newEnd = new Date(newStart.getTime() + taskDuration);
          break;
        case 'finish-to-finish':
          newEnd = new Date(endDate.getTime() + dep.lag * 24 * 60 * 60 * 1000);
          newStart = new Date(newEnd.getTime() - taskDuration);
          break;
        case 'start-to-finish':
          newEnd = new Date(startDate.getTime() + dep.lag * 24 * 60 * 60 * 1000);
          newStart = new Date(newEnd.getTime() - taskDuration);
          break;
        default:
          newStart = new Date(endDate.getTime() + dep.lag * 24 * 60 * 60 * 1000);
          newEnd = new Date(newStart.getTime() + taskDuration);
      }

      await this.prisma.tx.ganttTask.update({
        where: { id: dep.toTaskId, tenantId },
        data: {
          startDate: newStart,
          endDate: newEnd,
        },
      });
    }

    // Invalidate cache
    const redis = getRedis();
    await redis.del(`gantt:${tenantId}:${projectId}`);

    return { updated: true };
  }

  /**
   * Ensure no cycles in dependency graph
   */
  private async ensureNoCycles(fromTaskId: string, toTaskId: string, tenantId: string) {
    // Simple DFS to check if adding this edge creates a cycle
    const visited = new Set<string>();
    const stack = new Set<string>();

    const dfs = async (nodeId: string): Promise<boolean> => {
      if (stack.has(nodeId)) return true; // Cycle detected
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      stack.add(nodeId);

      // Get all tasks this node depends on
      const dependencies = await this.prisma.tx.ganttDependency.findMany({
        where: { fromTaskId: nodeId, tenantId },
        select: { toTaskId: true },
      });

      for (const dep of dependencies) {
        if (await dfs(dep.toTaskId)) return true;
      }

      // Check if we're trying to create a cycle with the new edge
      if (nodeId === fromTaskId && toTaskId === fromTaskId) return true;

      stack.delete(nodeId);
      return false;
    };

    // Check if adding fromTaskId -> toTaskId creates a cycle
    // We need to check if there's a path from toTaskId back to fromTaskId
    const hasCycle = await dfs(toTaskId);
    if (hasCycle) {
      throw new BadRequestException('Creating this dependency would create a cycle');
    }
  }

  /**
   * Calculate critical path using forward and backward pass
   */
  private calculateCriticalPath(tasks: GanttTaskDto[]): string[] {
    const taskMap = new Map<string, GanttTaskDto>();
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

      if (Math.abs(slack) < 1000) {
        // Less than 1 second slack
        criticalPath.push(task.id);
      }
    });

    return criticalPath;
  }

  /**
   * Calculate project timeline with milestones
   */
  private calculateTimeline(project: any, tasks: GanttTaskDto[]) {
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
}

