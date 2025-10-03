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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const calendar_service_1 = require("./calendar.service");
const index_1 = require("./dto/index");
let CalendarController = class CalendarController {
    constructor(calendarService) {
        this.calendarService = calendarService;
    }
    // Calendar endpoints
    async getCalendars(filters, req) {
        return this.calendarService.getCalendars(req.user.sub, req.user.tenantId, filters);
    }
    async createCalendar(createCalendarDto, req) {
        return this.calendarService.createCalendar(createCalendarDto, req.user.sub, req.user.tenantId);
    }
    async updateCalendar(id, updateCalendarDto, req) {
        return this.calendarService.updateCalendar(id, updateCalendarDto, req.user.sub, req.user.tenantId);
    }
    async deleteCalendar(id, req) {
        return this.calendarService.deleteCalendar(id, req.user.sub, req.user.tenantId);
    }
    // Event endpoints
    async getEvents(filters, req) {
        return this.calendarService.getEvents(req.user.sub, req.user.tenantId, filters);
    }
    async createEvent(createEventDto, req) {
        return this.calendarService.createEvent(createEventDto, req.user.sub, req.user.tenantId);
    }
    async getEvent(id, req) {
        return this.calendarService.getEvent(id, req.user.sub, req.user.tenantId);
    }
    async updateEvent(id, updateEventDto, req) {
        return this.calendarService.updateEvent(id, updateEventDto, req.user.sub, req.user.tenantId);
    }
    async deleteEvent(id, req) {
        return this.calendarService.deleteEvent(id, req.user.sub, req.user.tenantId);
    }
    // Import/Export endpoints
    async importICS(file, req) {
        return this.calendarService.importICS(file, req.user.sub, req.user.tenantId);
    }
    async exportICS(calendarId, startDate, endDate, res, req) {
        const icsContent = await this.calendarService.exportICS({ calendarId, startDate, endDate }, req.user.sub, req.user.tenantId);
        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', 'attachment; filename="calendar.ics"');
        res.send(icsContent);
    }
    async exportCSV(calendarId, startDate, endDate, res, req) {
        const csvContent = await this.calendarService.exportCSV({ calendarId, startDate, endDate }, req.user.sub, req.user.tenantId);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="calendar.csv"');
        res.send(csvContent);
    }
    // AI endpoints
    async extractEvents(data, req) {
        return this.calendarService.extractEvents(data, req.user.sub, req.user.tenantId);
    }
    async autoSchedule(data, req) {
        return this.calendarService.autoSchedule(data, req.user.sub, req.user.tenantId);
    }
    async weeklySummary(data, req) {
        return this.calendarService.weeklySummary(data, req.user.sub, req.user.tenantId);
    }
    // Integration endpoints
    async connectGoogle(req) {
        return this.calendarService.connectGoogle(req.user.sub, req.user.tenantId);
    }
    async connectOutlook(req) {
        return this.calendarService.connectOutlook(req.user.sub, req.user.tenantId);
    }
    async syncCalendars(req) {
        return this.calendarService.syncCalendars(req.user.sub, req.user.tenantId);
    }
};
exports.CalendarController = CalendarController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user-accessible calendars' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Calendars retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [index_1.CalendarFiltersDto, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getCalendars", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new calendar' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Calendar created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [index_1.CreateCalendarDto, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "createCalendar", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a calendar' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Calendar updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, index_1.UpdateCalendarDto, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "updateCalendar", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a calendar' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Calendar deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "deleteCalendar", null);
__decorate([
    (0, common_1.Get)('events'),
    (0, swagger_1.ApiOperation)({ summary: 'Get events with filters' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Events retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [index_1.EventFiltersDto, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getEvents", null);
__decorate([
    (0, common_1.Post)('events'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new event' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Event created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [index_1.CreateEventDto, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "createEvent", null);
__decorate([
    (0, common_1.Get)('events/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific event' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getEvent", null);
__decorate([
    (0, common_1.Patch)('events/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an event' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, index_1.UpdateEventDto, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "updateEvent", null);
__decorate([
    (0, common_1.Delete)('events/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an event' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "deleteEvent", null);
__decorate([
    (0, common_1.Post)('events/import/ics'),
    (0, swagger_1.ApiOperation)({ summary: 'Import events from ICS file' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Events imported successfully' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof Express !== "undefined" && (_a = Express.Multer) !== void 0 && _a.File) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "importICS", null);
__decorate([
    (0, common_1.Get)('events/export/ics'),
    (0, swagger_1.ApiOperation)({ summary: 'Export events to ICS file' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'ICS file generated successfully' }),
    __param(0, (0, common_1.Query)('calendarId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Res)()),
    __param(4, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "exportICS", null);
__decorate([
    (0, common_1.Get)('events/export/csv'),
    (0, swagger_1.ApiOperation)({ summary: 'Export events to CSV file' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'CSV file generated successfully' }),
    __param(0, (0, common_1.Query)('calendarId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Res)()),
    __param(4, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "exportCSV", null);
__decorate([
    (0, common_1.Post)('ai/extract-events'),
    (0, swagger_1.ApiOperation)({ summary: 'Extract events from text using AI' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Events extracted successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "extractEvents", null);
__decorate([
    (0, common_1.Post)('ai/auto-schedule'),
    (0, swagger_1.ApiOperation)({ summary: 'Auto-schedule events using AI' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Schedule optimized successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "autoSchedule", null);
__decorate([
    (0, common_1.Post)('ai/weekly-summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate weekly summary using AI' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Weekly summary generated successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "weeklySummary", null);
__decorate([
    (0, common_1.Post)('integrations/google/connect'),
    (0, swagger_1.ApiOperation)({ summary: 'Connect Google Calendar' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Google Calendar connected successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "connectGoogle", null);
__decorate([
    (0, common_1.Post)('integrations/outlook/connect'),
    (0, swagger_1.ApiOperation)({ summary: 'Connect Outlook Calendar' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Outlook Calendar connected successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "connectOutlook", null);
__decorate([
    (0, common_1.Post)('integrations/sync'),
    (0, swagger_1.ApiOperation)({ summary: 'Sync with external calendars' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Calendar synced successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "syncCalendars", null);
exports.CalendarController = CalendarController = __decorate([
    (0, swagger_1.ApiTags)('Calendar'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('calendar'),
    __metadata("design:paramtypes", [calendar_service_1.CalendarService])
], CalendarController);
