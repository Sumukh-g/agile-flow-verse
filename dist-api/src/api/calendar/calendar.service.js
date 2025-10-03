"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ai_service_1 = require("../ai/ai.service");
let CalendarService = class CalendarService {
    constructor(prisma, aiService) {
        this.prisma = prisma;
        this.aiService = aiService;
    }
    async create(createEventDto, userId, tenantId) {
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
                throw new common_1.ForbiddenException('You do not have access to this project');
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
            }
            catch (error) {
                // AI analysis is optional, don't fail the event creation
                console.warn('AI analysis failed:', error);
            }
        }
        return event;
    }
    async findAll(filters, userId, tenantId) {
        const where = {
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
    async findOne(id, userId, tenantId) {
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
            throw new common_1.NotFoundException('Calendar event not found');
        }
        return event;
    }
    async update(id, updateEventDto, userId, tenantId) {
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
            throw new common_1.ForbiddenException('You do not have permission to edit this event');
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
                throw new common_1.ForbiddenException('You do not have access to this project');
            }
        }
        const updateData = { ...updateEventDto };
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
    async remove(id, userId, tenantId) {
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
            throw new common_1.ForbiddenException('You do not have permission to delete this event');
        }
        await this.prisma.calendarEvent.delete({
            where: { id },
        });
        return { message: 'Calendar event deleted successfully' };
    }
    async findByProject(projectId, userId, tenantId) {
        // Verify user has access to the project
        const projectAccess = await this.prisma.projectMember.findFirst({
            where: {
                projectId,
                userId,
                tenantId,
            },
        });
        if (!projectAccess) {
            throw new common_1.ForbiddenException('You do not have access to this project');
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
    async toggleComplete(id, userId, tenantId) {
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
    async getAISuggestions(userId, tenantId) {
        const userEvents = await this.findAll({}, userId, tenantId);
        try {
            const suggestions = await this.aiService.getCalendarSuggestions({
                events: userEvents,
                userId,
                tenantId,
            });
            return suggestions;
        }
        catch (error) {
            console.warn('AI suggestions failed:', error);
            return { suggestions: [] };
        }
    }
    async optimizeSchedule(userId, tenantId, dateRange) {
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
        }
        catch (error) {
            console.warn('Schedule optimization failed:', error);
            return { optimized: false, message: 'Optimization failed' };
        }
    }
    async generateRecurringEvents(template, userId, tenantId) {
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
        }
        catch (error) {
            console.warn('Recurring event generation failed:', error);
            throw new Error('Failed to generate recurring events');
        }
    }
    // Helper methods
    calculateDuration(startTime, endTime) {
        if (!startTime || !endTime)
            return 0;
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        return (end.getTime() - start.getTime()) / (1000 * 60); // Duration in minutes
    }
    // New Calendar System Methods
    async getCalendars(userId, tenantId, filters) {
        const where = {
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
    async createCalendar(createCalendarDto, userId, tenantId) {
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
    async updateCalendar(id, updateCalendarDto, userId, tenantId) {
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
            throw new common_1.NotFoundException('Calendar not found');
        }
        if (calendar.ownerUserId !== userId) {
            throw new common_1.ForbiddenException('You can only update your own calendars');
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
    async deleteCalendar(id, userId, tenantId) {
        const calendar = await this.prisma.calendar.findFirst({
            where: {
                id,
                tenantId,
                ownerUserId: userId,
            },
        });
        if (!calendar) {
            throw new common_1.NotFoundException('Calendar not found');
        }
        await this.prisma.calendar.delete({
            where: { id },
        });
        return { message: 'Calendar deleted successfully' };
    }
    async getEvents(userId, tenantId, filters) {
        const where = {
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
    async createEvent(createEventDto, userId, tenantId) {
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
            throw new common_1.ForbiddenException('You do not have access to this calendar');
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
    async getEvent(id, userId, tenantId) {
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
            throw new common_1.NotFoundException('Event not found');
        }
        return event;
    }
    async updateEvent(id, updateEventDto, userId, tenantId) {
        const event = await this.getEvent(id, userId, tenantId);
        // Check if user can edit this event
        if (event.creator.id !== userId) {
            throw new common_1.ForbiddenException('You can only edit events you created');
        }
        const updateData = {
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
    async deleteEvent(id, userId, tenantId) {
        const event = await this.getEvent(id, userId, tenantId);
        // Check if user can delete this event
        if (event.creator.id !== userId) {
            throw new common_1.ForbiddenException('You can only delete events you created');
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
    async importICS(file, userId, tenantId) {
        // TODO: Implement ICS import logic
        return { message: 'ICS import not yet implemented' };
    }
    async exportICS(filters, userId, tenantId) {
        const events = await this.getEvents(userId, tenantId, filters);
        // TODO: Implement ICS export logic
        return { message: 'ICS export not yet implemented', events };
    }
    async exportCSV(filters, userId, tenantId) {
        const events = await this.getEvents(userId, tenantId, filters);
        // TODO: Implement CSV export logic
        return { message: 'CSV export not yet implemented', events };
    }
    // AI methods
    async extractEvents(data, userId, tenantId) {
        // TODO: Implement AI event extraction
        return { message: 'AI event extraction not yet implemented' };
    }
    async autoSchedule(data, userId, tenantId) {
        // TODO: Implement AI auto-scheduling
        return { message: 'AI auto-scheduling not yet implemented' };
    }
    async weeklySummary(data, userId, tenantId) {
        // TODO: Implement AI weekly summary
        return { message: 'AI weekly summary not yet implemented' };
    }
    // Integration methods
    async connectGoogle(userId, tenantId) {
        // TODO: Implement Google Calendar integration
        return { message: 'Google Calendar integration not yet implemented' };
    }
    async connectOutlook(userId, tenantId) {
        // TODO: Implement Outlook Calendar integration
        return { message: 'Outlook Calendar integration not yet implemented' };
    }
    async syncCalendars(userId, tenantId) {
        // TODO: Implement calendar sync
        return { message: 'Calendar sync not yet implemented' };
    }
};
exports.CalendarService = CalendarService;
exports.CalendarService = CalendarService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_service_1.AiService])
], CalendarService);
