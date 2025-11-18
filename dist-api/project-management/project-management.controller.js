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
exports.ProjectManagementController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const swagger_decorators_1 = require("../common/swagger/swagger.decorators");
const gantt_service_1 = require("./gantt.service");
const resource_management_service_1 = require("./resource-management.service");
let ProjectManagementController = class ProjectManagementController {
    constructor(ganttService, resourceService) {
        this.ganttService = ganttService;
        this.resourceService = resourceService;
    }
    async getGanttData(projectId, req) {
        return this.ganttService.getGanttData(req.user.tenantId, projectId);
    }
    async updateTaskSchedule(projectId, taskId, body, req) {
        return this.ganttService.updateTaskSchedule(req.user.tenantId, projectId, taskId, new Date(body.startDate), new Date(body.endDate));
    }
    async optimizeSchedule(projectId, req) {
        return this.ganttService.optimizeSchedule(req.user.tenantId, projectId);
    }
    async getResourceAllocations(startDate, endDate, projectId, req) {
        return this.resourceService.getResourceAllocations(req.user.tenantId, new Date(startDate), new Date(endDate), projectId);
    }
    async suggestResources(taskId, skills, req) {
        const skillArray = skills ? skills.split(',') : undefined;
        return this.resourceService.suggestResources(req.user.tenantId, taskId, skillArray);
    }
    async balanceWorkload(projectId, startDate, endDate, req) {
        return this.resourceService.balanceWorkload(req.user.tenantId, projectId, new Date(startDate), new Date(endDate));
    }
    async getResourceAvailability(userId, startDate, endDate, req) {
        return this.resourceService.getResourceAvailability(req.user.tenantId, userId, new Date(startDate), new Date(endDate));
    }
};
exports.ProjectManagementController = ProjectManagementController;
__decorate([
    (0, common_1.Get)('gantt/:projectId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Gantt chart data',
        description: 'Retrieves Gantt chart data including tasks, dependencies, and critical path for a project.',
    }),
    (0, swagger_decorators_1.ApiIdParam)('Project ID'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Gantt data retrieved successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProjectManagementController.prototype, "getGanttData", null);
__decorate([
    (0, common_1.Put)('gantt/:projectId/tasks/:taskId/schedule'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update task schedule',
        description: 'Updates task start and end dates, automatically adjusting dependent tasks.',
    }),
    (0, swagger_decorators_1.ApiIdParam)('Project ID'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Schedule updated successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('taskId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ProjectManagementController.prototype, "updateTaskSchedule", null);
__decorate([
    (0, common_1.Post)('gantt/:projectId/optimize'),
    (0, swagger_1.ApiOperation)({
        summary: 'Optimize project schedule',
        description: 'Analyzes project schedule and provides optimization suggestions.',
    }),
    (0, swagger_decorators_1.ApiIdParam)('Project ID'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Optimization suggestions generated' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProjectManagementController.prototype, "optimizeSchedule", null);
__decorate([
    (0, common_1.Get)('resources/allocations'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get resource allocations',
        description: 'Retrieves resource allocation data including workload, utilization, and conflicts.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, description: 'Start date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, description: 'End date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'projectId', required: false, description: 'Filter by project ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Resource allocations retrieved successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('projectId')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ProjectManagementController.prototype, "getResourceAllocations", null);
__decorate([
    (0, common_1.Get)('resources/suggest/:taskId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Suggest resources for task',
        description: 'Suggests best resources to assign to a task based on availability and experience.',
    }),
    (0, swagger_decorators_1.ApiIdParam)('Task ID'),
    (0, swagger_1.ApiQuery)({ name: 'skills', required: false, description: 'Required skills (comma-separated)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Resource suggestions generated' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Query)('skills')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ProjectManagementController.prototype, "suggestResources", null);
__decorate([
    (0, common_1.Post)('resources/balance'),
    (0, swagger_1.ApiOperation)({
        summary: 'Balance workload',
        description: 'Analyzes team workload and suggests task reallocation to balance work distribution.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'projectId', required: true, description: 'Project ID' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, description: 'Start date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, description: 'End date (ISO string)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workload balance suggestions generated' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Query)('projectId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ProjectManagementController.prototype, "balanceWorkload", null);
__decorate([
    (0, common_1.Get)('resources/:userId/availability'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get resource availability',
        description: 'Retrieves availability information for a specific user in a date range.',
    }),
    (0, swagger_decorators_1.ApiIdParam)('User ID'),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, description: 'Start date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, description: 'End date (ISO string)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Resource availability retrieved successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ProjectManagementController.prototype, "getResourceAvailability", null);
exports.ProjectManagementController = ProjectManagementController = __decorate([
    (0, swagger_1.ApiTags)('project-management'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('/v1/project-management'),
    __metadata("design:paramtypes", [gantt_service_1.GanttService,
        resource_management_service_1.ResourceManagementService])
], ProjectManagementController);
