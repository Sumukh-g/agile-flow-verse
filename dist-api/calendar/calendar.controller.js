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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const calendar_service_1 = require("./calendar.service");
let CalendarController = class CalendarController {
    constructor(calendarService) {
        this.calendarService = calendarService;
    }
    async getEvents(startDate, endDate, req) {
        return this.calendarService.getCalendarEvents(req.user.tenantId, req.user.userId, startDate, endDate);
    }
    async getPersonalEvents(startDate, endDate, req) {
        return this.calendarService.getPersonalCalendar(req.user.tenantId, req.user.userId, startDate, endDate);
    }
    async getAllProjectsEvents(startDate, endDate, req) {
        return this.calendarService.getAllProjectsCalendar(req.user.tenantId, startDate, endDate);
    }
    async getProjectEvents(projectId, startDate, endDate, req) {
        return this.calendarService.getProjectCalendar(req.user.tenantId, projectId, startDate, endDate);
    }
};
exports.CalendarController = CalendarController;
__decorate([
    (0, common_1.Get)('events'),
    (0, swagger_1.ApiOperation)({ summary: 'Get calendar events' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Calendar events retrieved successfully' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getEvents", null);
__decorate([
    (0, common_1.Get)('personal'),
    (0, swagger_1.ApiOperation)({ summary: 'Get personal calendar events' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Personal calendar events retrieved successfully' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getPersonalEvents", null);
__decorate([
    (0, common_1.Get)('projects'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all projects calendar events' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'All projects calendar events retrieved successfully' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getAllProjectsEvents", null);
__decorate([
    (0, common_1.Get)('projects/:projectId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get project calendar events' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Project calendar events retrieved successfully' }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getProjectEvents", null);
exports.CalendarController = CalendarController = __decorate([
    (0, swagger_1.ApiTags)('calendar'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('/v1/calendar'),
    __metadata("design:paramtypes", [calendar_service_1.CalendarService])
], CalendarController);
