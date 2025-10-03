import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CalendarEventFiltersDto, 
  CreateCalendarEventDto, 
  UpdateCalendarEventDto,
  CreateCalendarDto,
  UpdateCalendarDto,
  CreateEventDto,
  UpdateEventDto,
  EventFiltersDto,
  CalendarFiltersDto,
  EventVisibility,
  InviteStatus
} from './dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async create(createEventDto: CreateCalendarEventDto, userId: string, tenantId: string) {
    // Validate project access if projectId is provided
    if (createEventDto.projectId) {
      const projectAccess = await this.prisma.projectMember.findFirst({
        where: {
          projectId: createEventDto.projectId,
          userId,
          tenantId,
        },
      });

      if (!projectAccess) {
        throw new ForbiddenException('You do not have access to this project');
      }
    }

    const event = await this.prisma.calendarEvent.create({
      data: {
        ...createEventDto,
        date: new Date(createEventDto.date),
        tenantId,
        createdBy: userId,
        attendees: createEventDto.attendees || [],
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
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

    // AI: Analyze event and suggest optimizations
    if (event.description) {
      try {
        await this.aiService.analyzeCalendarEvent({
          eventId: event.id,
          title: event.title,
          description: event.description,
          type: event.type,
          priority: event.priority,
          duration: this.calculateDuration(event.startTime, event.endTime),
        });
      } catch (error) {
        // AI analysis is optional, don't fail the event creation
        console.warn('AI analysis failed:', error);
      }
    }

    return event;
  }

  async findAll(filters: CalendarEventFiltersDto, userId: string, tenantId: string) {
    const where: any = {
      tenantId,
      OR: [
        { createdBy: userId },
        { 
          project: {
            members: {
              some: {
                userId,
                tenantId,
              },
            },
          },
        },
        { projectId: null },
      ],
    };

    // Apply filters
    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (typeof filters.completed === 'boolean') {
      where.completed = filters.completed;
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const events = await this.prisma.calendarEvent.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
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
        date: 'asc',
      },
    });

    return events;
  }

  async findOne(id: string, userId: string, tenantId: string) {
    const event = await this.prisma.calendarEvent.findFirst({
      where: {
        id,
        tenantId,
        OR: [
          { createdBy: userId },
          { 
            project: {
              members: {
                some: {
                  userId,
                  tenantId,
                },
              },
            },
          },
          { projectId: null },
        ],
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
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

    if (!event) {
      throw new NotFoundException('Calendar event not found');
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateCalendarEventDto, userId: string, tenantId: string) {
    const existingEvent = await this.findOne(id, userId, tenantId);

    // Check if user can edit this event
    const canEdit = existingEvent.createdBy === userId || 
      (existingEvent.project && await this.prisma.projectMember.findFirst({
        where: {
          projectId: existingEvent.projectId,
          userId,
          tenantId,
          role: { in: ['admin', 'manager'] },
        },
      }));

    if (!canEdit) {
      throw new ForbiddenException('You do not have permission to edit this event');
    }

    // If projectId is being changed, verify user has access to the new project
    if (updateEventDto.projectId && updateEventDto.projectId !== existingEvent.projectId) {
      const projectAccess = await this.prisma.projectMember.findFirst({
        where: {
          projectId: updateEventDto.projectId,
          userId,
          tenantId,
        },
      });

      if (!projectAccess) {
        throw new ForbiddenException('You do not have access to this project');
      }
    }

    const updateData: any = { ...updateEventDto };
    if (updateEventDto.date) {
      updateData.date = new Date(updateEventDto.date);
    }

    const event = await this.prisma.calendarEvent.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
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

    return event;
  }

  async remove(id: string, userId: string, tenantId: string) {
    const existingEvent = await this.findOne(id, userId, tenantId);

    // Check if user can delete this event
    const canDelete = existingEvent.createdBy === userId || 
      (existingEvent.project && await this.prisma.projectMember.findFirst({
        where: {
          projectId: existingEvent.projectId,
          userId,
          tenantId,
          role: { in: ['admin', 'manager'] },
        },
      }));

    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete this event');
    }

    await this.prisma.calendarEvent.delete({
      where: { id },
    });

    return { message: 'Calendar event deleted successfully' };
  }

  async findByProject(projectId: string, userId: string, tenantId: string) {
    // Verify user has access to the project
    const projectAccess = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
        tenantId,
      },
    });

    if (!projectAccess) {
      throw new ForbiddenException('You do not have access to this project');
    }

    const events = await this.prisma.calendarEvent.findMany({
      where: {
        projectId,
        tenantId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
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
        date: 'asc',
      },
    });

    return events;
  }

  async toggleComplete(id: string, userId: string, tenantId: string) {
    const existingEvent = await this.findOne(id, userId, tenantId);

    const event = await this.prisma.calendarEvent.update({
      where: { id },
      data: {
        completed: !existingEvent.completed,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
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

    return event;
  }

  // AI-powered calendar features
  async getAISuggestions(userId: string, tenantId: string) {
    const userEvents = await this.findAll({}, userId, tenantId);
    
    try {
      const suggestions = await this.aiService.getCalendarSuggestions({
        events: userEvents,
        userId,
        tenantId,
      });
      
      return suggestions;
    } catch (error) {
      console.warn('AI suggestions failed:', error);
      return { suggestions: [] };
    }
  }

  async optimizeSchedule(userId: string, tenantId: string, dateRange: { start: string; end: string }) {
    const events = await this.findAll({
      startDate: dateRange.start,
      endDate: dateRange.end,
    }, userId, tenantId);

    try {
      const optimization = await this.aiService.optimizeCalendarSchedule({
        events,
        dateRange,
        userId,
        tenantId,
      });

      return optimization;
    } catch (error) {
      console.warn('Schedule optimization failed:', error);
      return { optimized: false, message: 'Optimization failed' };
    }
  }

  async generateRecurringEvents(template: any, userId: string, tenantId: string) {
    try {
      const events = await this.aiService.generateRecurringEvents({
        template,
        userId,
        tenantId,
      });

      // Create the generated events
      const createdEvents = [];
      for (const eventData of events) {
        const event = await this.create(eventData, userId, tenantId);
        createdEvents.push(event);
      }

      return createdEvents;
    } catch (error) {
      console.warn('Recurring event generation failed:', error);
      throw new Error('Failed to generate recurring events');
    }
  }

  // Helper methods
  private calculateDuration(startTime?: string, endTime?: string): number {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    return (end.getTime() - start.getTime()) / (1000 * 60); // Duration in minutes
  }

  // New Calendar System Methods
  async getCalendars(userId: string, tenantId: string, filters: CalendarFiltersDto) {
    const where: any = {
      tenantId,
      OR: [
        { ownerUserId: userId },
        { isShared: true },
      ],
    };

    if (filters.sectionId) {
      where.sectionId = filters.sectionId;
    }

    if (filters.ownerUserId) {
      where.ownerUserId = filters.ownerUserId;
    }

    if (filters.isShared !== undefined) {
      where.isShared = filters.isShared;
    }

    return this.prisma.calendar.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            events: true,
          },
        },
      },
    });
  }

  async createCalendar(createCalendarDto: CreateCalendarDto, userId: string, tenantId: string) {
    return this.prisma.calendar.create({
      data: {
        ...createCalendarDto,
        tenantId,
        ownerUserId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async updateCalendar(id: string, updateCalendarDto: UpdateCalendarDto, userId: string, tenantId: string) {
    const calendar = await this.prisma.calendar.findFirst({
      where: {
        id,
        tenantId,
        OR: [
          { ownerUserId: userId },
          { isShared: true },
        ],
      },
    });

    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    if (calendar.ownerUserId !== userId) {
      throw new ForbiddenException('You can only update your own calendars');
    }

    return this.prisma.calendar.update({
      where: { id },
      data: updateCalendarDto,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async deleteCalendar(id: string, userId: string, tenantId: string) {
    const calendar = await this.prisma.calendar.findFirst({
      where: {
        id,
        tenantId,
        ownerUserId: userId,
      },
    });

    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    await this.prisma.calendar.delete({
      where: { id },
    });

    return { message: 'Calendar deleted successfully' };
  }

  async getEvents(userId: string, tenantId: string, filters: EventFiltersDto) {
    const where: any = {
      tenantId,
      deletedAt: null,
      calendar: {
        OR: [
          { ownerUserId: userId },
          { isShared: true },
        ],
      },
    };

    if (filters.calendarIds && filters.calendarIds.length > 0) {
      where.calendarId = { in: filters.calendarIds };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.startDate) {
      where.startAt = { gte: new Date(filters.startDate) };
    }

    if (filters.endDate) {
      where.endAt = { lte: new Date(filters.endDate) };
    }

    if (filters.visibility) {
      where.visibility = filters.visibility;
    }

    if (filters.allDay !== undefined) {
      where.allDay = filters.allDay;
    }

    return this.prisma.event.findMany({
      where,
      include: {
        calendar: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        invites: {
          include: {
            // Include invite details if needed
          },
        },
      },
      orderBy: {
        startAt: 'asc',
      },
    });
  }

  async createEvent(createEventDto: CreateEventDto, userId: string, tenantId: string) {
    // Verify calendar access
    const calendar = await this.prisma.calendar.findFirst({
      where: {
        id: createEventDto.calendarId,
        tenantId,
        OR: [
          { ownerUserId: userId },
          { isShared: true },
        ],
      },
    });

    if (!calendar) {
      throw new ForbiddenException('You do not have access to this calendar');
    }

    return this.prisma.event.create({
      data: {
        ...createEventDto,
        tenantId,
        createdBy: userId,
        updatedBy: userId,
        startAt: new Date(createEventDto.startAt),
        endAt: new Date(createEventDto.endAt),
        reminders: createEventDto.reminders || [],
        attendees: createEventDto.attendees || [],
      },
      include: {
        calendar: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getEvent(id: string, userId: string, tenantId: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
        calendar: {
          OR: [
            { ownerUserId: userId },
            { isShared: true },
          ],
        },
      },
      include: {
        calendar: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        invites: {
          include: {
            // Include invite details if needed
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async updateEvent(id: string, updateEventDto: UpdateEventDto, userId: string, tenantId: string) {
    const event = await this.getEvent(id, userId, tenantId);

    // Check if user can edit this event
    if (event.creator.id !== userId) {
      throw new ForbiddenException('You can only edit events you created');
    }

    const updateData: any = {
      ...updateEventDto,
      updatedBy: userId,
    };

    if (updateEventDto.startAt) {
      updateData.startAt = new Date(updateEventDto.startAt);
    }

    if (updateEventDto.endAt) {
      updateData.endAt = new Date(updateEventDto.endAt);
    }

    return this.prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        calendar: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async deleteEvent(id: string, userId: string, tenantId: string) {
    const event = await this.getEvent(id, userId, tenantId);

    // Check if user can delete this event
    if (event.creator.id !== userId) {
      throw new ForbiddenException('You can only delete events you created');
    }

    // Soft delete
    await this.prisma.event.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: 'Event deleted successfully' };
  }

  // Import/Export methods
  async importICS(file: any, userId: string, tenantId: string) {
    // TODO: Implement ICS import logic
    return { message: 'ICS import not yet implemented' };
  }

  async exportICS(filters: EventFiltersDto, userId: string, tenantId: string) {
    const events = await this.getEvents(userId, tenantId, filters);
    // TODO: Implement ICS export logic
    return { message: 'ICS export not yet implemented', events };
  }

  async exportCSV(filters: EventFiltersDto, userId: string, tenantId: string) {
    const events = await this.getEvents(userId, tenantId, filters);
    // TODO: Implement CSV export logic
    return { message: 'CSV export not yet implemented', events };
  }

  // AI methods
  async extractEvents(data: any, userId: string, tenantId: string) {
    // TODO: Implement AI event extraction
    return { message: 'AI event extraction not yet implemented' };
  }

  async autoSchedule(data: any, userId: string, tenantId: string) {
    // TODO: Implement AI auto-scheduling
    return { message: 'AI auto-scheduling not yet implemented' };
  }

  async weeklySummary(data: any, userId: string, tenantId: string) {
    // TODO: Implement AI weekly summary
    return { message: 'AI weekly summary not yet implemented' };
  }

  // Integration methods
  async connectGoogle(userId: string, tenantId: string) {
    // TODO: Implement Google Calendar integration
    return { message: 'Google Calendar integration not yet implemented' };
  }

  async connectOutlook(userId: string, tenantId: string) {
    // TODO: Implement Outlook Calendar integration
    return { message: 'Outlook Calendar integration not yet implemented' };
  }

  async syncCalendars(userId: string, tenantId: string) {
    // TODO: Implement calendar sync
    return { message: 'Calendar sync not yet implemented' };
  }
}
