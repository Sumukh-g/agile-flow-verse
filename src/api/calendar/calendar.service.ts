import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RedisClient } from '../common/redis/redis.client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectPermissionsService } from '../common/project-permissions.service';
import {
  CalendarEventQueryDto,
  CalendarEventType,
  CalendarEventSourceType,
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
  CalendarScope,
} from './dto';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisClient,
    private readonly permissions: ProjectPermissionsService,
  ) {}

  /**
   * List calendar events with filtering
   */
  async listEvents(
    tenantId: string,
    userId: string,
    query: CalendarEventQueryDto,
  ) {
    const { scope, projectId, sectionId, from, to, types, sourceType, personalOnly, excludePersonal } = query;

    // Build cache key
    const cacheKey = `calendar:events:${tenantId}:${userId}:${JSON.stringify(query)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Build where clause
    const where: any = { tenantId };

    // Scope filtering
    if (scope === CalendarScope.PROJECT) {
      if (!projectId) {
        throw new BadRequestException('projectId is required for project scope');
      }
      // Check project access
      await this.permissions.ensureCanReadProject(tenantId, userId, projectId);
      where.projectId = projectId;
    } else if (scope === CalendarScope.SECTION) {
      if (!sectionId) {
        throw new BadRequestException('sectionId is required for section scope');
      }
      where.sectionId = sectionId;
      // If section has projectId, check project access
      // Note: Sections are currently conceptual (note parentId), so we'll handle this later
    } else {
      // Global scope: get events from all projects user has access to
      // Get list of project IDs user can access
      const accessibleProjects = await this.getAccessibleProjectIds(tenantId, userId);
      
      if (personalOnly) {
        // Only personal events (projectId is null)
        where.projectId = null;
      } else if (excludePersonal) {
        // Only project events (exclude personal)
        // If user has no accessible projects, return empty array
        if (accessibleProjects.length === 0) {
          where.projectId = { in: [] }; // This will return no results
        } else {
          where.projectId = { in: accessibleProjects };
        }
      } else {
        // Include both personal and project events
        if (accessibleProjects.length === 0) {
          // If no accessible projects, only show personal events
          where.projectId = null;
        } else {
          where.OR = [
            { projectId: null }, // Global/personal events
            { projectId: { in: accessibleProjects } }, // Events from accessible projects
          ];
        }
      }
    }

    // Date range filtering (events overlapping the range)
    if (from && to) {
      where.AND = [
        { startAt: { lte: new Date(to) } }, // Event starts before range ends
        { endAt: { gte: new Date(from) } }, // Event ends after range starts
      ];
    } else if (from) {
      where.endAt = { gte: new Date(from) };
    } else if (to) {
      where.startAt = { lte: new Date(to) };
    }

    // Type filtering
    if (types && types.length > 0) {
      where.type = { in: types };
    }

    // Source type filtering
    if (sourceType) {
      where.sourceType = sourceType;
    }

    // Fetch events
    const events = await this.prisma.tx.calendarEvent.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { startAt: 'asc' },
    });

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(events));

    return events;
  }

  /**
   * Get a single calendar event by ID
   */
  async getEvent(tenantId: string, userId: string, eventId: string) {
    const event = await this.prisma.tx.calendarEvent.findFirst({
      where: { id: eventId, tenantId },
      include: {
        project: {
          select: { id: true, name: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Calendar event not found');
    }

    // Check project access if event is project-scoped
    if (event.projectId) {
      await this.permissions.ensureCanReadProject(tenantId, userId, event.projectId);
    }

    return event;
  }

  /**
   * Create a new calendar event
   */
  async createEvent(
    tenantId: string,
    userId: string,
    data: CreateCalendarEventDto,
  ) {
    // Validate dates
    const startAt = new Date(data.startAt);
    const endAt = new Date(data.endAt);

    if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    if (endAt < startAt) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check project access if projectId is provided
    if (data.projectId) {
      await this.permissions.ensureCanReadProject(tenantId, userId, data.projectId);
    }

    // Create event
    const event = await this.prisma.tx.calendarEvent.create({
      data: {
        tenantId,
        projectId: data.projectId || null,
        sectionId: data.sectionId || null,
        title: data.title,
        description: data.description,
        startAt,
        endAt,
        allDay: data.allDay || false,
        type: data.type || CalendarEventType.OTHER,
        sourceType: data.sourceType || null,
        sourceId: data.sourceId || null,
        createdById: userId,
        reminderMinutesBefore: data.reminderMinutesBefore || null,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Invalidate cache
    await this.invalidateCache(tenantId, userId);

    // TODO: Trigger external sync if enabled
    // await this.syncToExternalCalendars(event, userId);

    return event;
  }

  /**
   * Update a calendar event
   */
  async updateEvent(
    tenantId: string,
    userId: string,
    eventId: string,
    data: UpdateCalendarEventDto,
  ) {
    // Get existing event
    const existing = await this.getEvent(tenantId, userId, eventId);

    // Check permissions: only creator or project admin can edit
    if (existing.createdById !== userId) {
      if (existing.projectId) {
        const role = await this.permissions.getUserProjectRole(tenantId, userId, existing.projectId);
        if (role !== 'owner' && role !== 'admin' && role !== 'tenant_admin') {
          throw new ForbiddenException('Only event creator or project admin can edit events');
        }
      } else {
        throw new ForbiddenException('Only event creator can edit personal events');
      }
    }

    // Validate dates if provided
    let startAt = existing.startAt;
    let endAt = existing.endAt;

    if (data.startAt) {
      startAt = new Date(data.startAt);
      if (isNaN(startAt.getTime())) {
        throw new BadRequestException('Invalid start date format');
      }
    }

    if (data.endAt) {
      endAt = new Date(data.endAt);
      if (isNaN(endAt.getTime())) {
        throw new BadRequestException('Invalid end date format');
      }
    }

    if (endAt < startAt) {
      throw new BadRequestException('End date must be after start date');
    }

    // Update event
    const event = await this.prisma.tx.calendarEvent.update({
      where: { id: eventId },
      data: {
        title: data.title,
        description: data.description,
        startAt,
        endAt,
        allDay: data.allDay,
        type: data.type,
        reminderMinutesBefore: data.reminderMinutesBefore,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Invalidate cache
    await this.invalidateCache(tenantId, userId);

    // TODO: Trigger external sync if enabled
    // await this.syncToExternalCalendars(event, userId);

    return event;
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(tenantId: string, userId: string, eventId: string) {
    // First check if event exists and get it
    const existing = await this.prisma.tx.calendarEvent.findFirst({
      where: { id: eventId, tenantId },
      include: {
        project: {
          select: { id: true, name: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Calendar event not found');
    }

    // Check project access if event is project-scoped
    if (existing.projectId) {
      await this.permissions.ensureCanReadProject(tenantId, userId, existing.projectId);
    }

    // Check permissions: only creator or project admin can delete
    if (existing.createdById !== userId) {
      if (existing.projectId) {
        const role = await this.permissions.getUserProjectRole(tenantId, userId, existing.projectId);
        if (role !== 'owner' && role !== 'admin' && role !== 'tenant_admin') {
          throw new ForbiddenException('Only event creator or project admin can delete events');
        }
      } else {
        throw new ForbiddenException('Only event creator can delete personal events');
      }
    }

    // Delete event
    await this.prisma.tx.calendarEvent.delete({
      where: { id: eventId },
    });

    // Invalidate cache
    await this.invalidateCache(tenantId, userId);

    return { success: true };
  }

  /**
   * Get accessible project IDs for a user
   */
  private async getAccessibleProjectIds(tenantId: string, userId: string): Promise<string[]> {
    // Get projects where user is creator
    const createdProjects = await this.prisma.tx.project.findMany({
      where: { tenantId, createdBy: userId },
      select: { id: true },
    });

    // Get projects where user is a member
    const memberProjects = await this.prisma.tx.projectMember.findMany({
      where: { tenantId, userId },
      select: { projectId: true },
    });

    // Combine and deduplicate
    const projectIds = new Set<string>();
    createdProjects.forEach((p) => projectIds.add(p.id));
    memberProjects.forEach((m) => projectIds.add(m.projectId));

    return Array.from(projectIds);
  }

  /**
   * Invalidate calendar cache for a tenant/user
   */
  private async invalidateCache(tenantId: string, userId: string) {
    // For now, we'll skip pattern-based invalidation since RedisClient is a mock
    // In production with real Redis, you'd use SCAN or maintain a set of keys
    // The cache will naturally expire after 5 minutes anyway
    this.logger.debug(`Cache invalidation requested for tenant ${tenantId}, user ${userId}`);
  }

  // Legacy methods for backward compatibility (can be removed later)
  async getCalendarEvents(tenantId: string, userId: string, startDate?: string, endDate?: string) {
    return this.listEvents(tenantId, userId, {
      scope: CalendarScope.GLOBAL,
      from: startDate,
      to: endDate,
    });
  }

  async getProjectCalendar(tenantId: string, projectId: string, startDate?: string, endDate?: string) {
    // This method doesn't have userId, so we'll need to get it from context
    // For now, return events for the project (will be filtered by permissions in controller)
    const events = await this.prisma.tx.calendarEvent.findMany({
      where: {
        tenantId,
        projectId,
        ...(startDate && endDate
          ? {
              AND: [
                { startAt: { lte: new Date(endDate) } },
                { endAt: { gte: new Date(startDate) } },
              ],
            }
          : {}),
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { startAt: 'asc' },
    });

    return events;
  }

  async getPersonalCalendar(tenantId: string, userId: string, startDate?: string, endDate?: string) {
    return this.listEvents(tenantId, userId, {
      scope: CalendarScope.GLOBAL,
      from: startDate,
      to: endDate,
    });
  }

  async getAllProjectsCalendar(tenantId: string, startDate?: string, endDate?: string) {
    // This method doesn't have userId, so we'll need to get it from context
    // For now, return all events (will be filtered by permissions in controller)
    const events = await this.prisma.tx.calendarEvent.findMany({
      where: {
        tenantId,
        ...(startDate && endDate
          ? {
              AND: [
                { startAt: { lte: new Date(endDate) } },
                { endAt: { gte: new Date(startDate) } },
              ],
            }
          : {}),
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { startAt: 'asc' },
    });

    return events;
  }
}
