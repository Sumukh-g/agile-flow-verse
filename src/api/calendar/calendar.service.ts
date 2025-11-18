import { Injectable, Logger } from '@nestjs/common';
import { RedisClient } from '../common/redis/redis.client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisClient,
  ) {}

  async getCalendarEvents(tenantId: string, userId: string, startDate?: string, endDate?: string) {
    const cacheKey = `calendar:${tenantId}:${userId}:${startDate}:${endDate}`;
    
    // Try to get from cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = { tenantId };

    if (startDate && endDate) {
      where.dueDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get tasks as calendar events
    const tasks = await this.prisma.tx.task.findMany({
      where: {
        ...where,
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
      orderBy: { dueDate: 'asc' },
    });

    // Get project deadlines
    const projectDeadlines = await this.prisma.tx.project.findMany({
      where: {
        tenantId,
        endDate: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      select: {
        id: true,
        name: true,
        endDate: true,
        status: true,
      },
    });

    // Transform tasks to calendar events
    const taskEvents = tasks.map(task => ({
      id: `task-${task.id}`,
      title: task.title,
      description: task.description,
      start: task.dueDate,
      end: task.dueDate,
      type: 'task',
      priority: task.priority,
      status: task.status,
      project: task.project,
      assignees: task.assignees.map(a => a.user),
      color: this.getTaskColor(task.status, task.priority),
      source: 'tasks',
    }));

    // Transform project deadlines to calendar events
    const projectEvents = projectDeadlines.map(project => ({
      id: `project-${project.id}`,
      title: `${project.name} Deadline`,
      description: `Project deadline for ${project.name}`,
      start: project.endDate,
      end: project.endDate,
      type: 'project',
      status: project.status,
      project: { id: project.id, name: project.name },
      color: this.getProjectColor(project.status),
      source: 'projects',
    }));

    const events = [...taskEvents, ...projectEvents];

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(events));

    return events;
  }

  async getProjectCalendar(tenantId: string, projectId: string, startDate?: string, endDate?: string) {
    const cacheKey = `calendar:project:${tenantId}:${projectId}:${startDate}:${endDate}`;
    
    // Try to get from cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = { tenantId, projectId };

    if (startDate && endDate) {
      where.dueDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const tasks = await this.prisma.tx.task.findMany({
      where,
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const events = tasks.map(task => ({
      id: `task-${task.id}`,
      title: task.title,
      description: task.description,
      start: task.dueDate,
      end: task.dueDate,
      type: 'task',
      priority: task.priority,
      status: task.status,
      assignees: task.assignees.map(a => a.user),
      color: this.getTaskColor(task.status, task.priority),
      source: 'project-tasks',
    }));

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(events));

    return events;
  }

  async getPersonalCalendar(tenantId: string, userId: string, startDate?: string, endDate?: string) {
    const cacheKey = `calendar:personal:${tenantId}:${userId}:${startDate}:${endDate}`;
    
    // Try to get from cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = { tenantId };

    if (startDate && endDate) {
      where.dueDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get user's assigned tasks
    const tasks = await this.prisma.tx.task.findMany({
      where: {
        ...where,
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
      orderBy: { dueDate: 'asc' },
    });

    const events = tasks.map(task => ({
      id: `task-${task.id}`,
      title: task.title,
      description: task.description,
      start: task.dueDate,
      end: task.dueDate,
      type: 'task',
      priority: task.priority,
      status: task.status,
      project: task.project,
      assignees: task.assignees.map(a => a.user),
      color: this.getTaskColor(task.status, task.priority),
      source: 'personal',
    }));

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(events));

    return events;
  }

  async getAllProjectsCalendar(tenantId: string, startDate?: string, endDate?: string) {
    const cacheKey = `calendar:all-projects:${tenantId}:${startDate}:${endDate}`;
    
    // Try to get from cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = { tenantId };

    if (startDate && endDate) {
      where.dueDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const tasks = await this.prisma.tx.task.findMany({
      where,
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
    });

    const events = tasks.map(task => ({
      id: `task-${task.id}`,
      title: task.title,
      description: task.description,
      start: task.dueDate,
      end: task.dueDate,
      type: 'task',
      priority: task.priority,
      status: task.status,
      project: task.project,
      assignees: task.assignees.map(a => a.user),
      color: this.getTaskColor(task.status, task.priority),
      source: 'all-projects',
    }));

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(events));

    return events;
  }

  private getTaskColor(status: string, priority: string): string {
    if (status === 'done') return 'bg-green-100 text-green-800';
    if (status === 'in-progress') return 'bg-blue-100 text-blue-800';
    if (priority === 'high') return 'bg-red-100 text-red-800';
    if (priority === 'medium') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  }

  private getProjectColor(status: string): string {
    if (status === 'completed') return 'bg-green-100 text-green-800';
    if (status === 'active') return 'bg-blue-100 text-blue-800';
    if (status === 'on-hold') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  }
}





