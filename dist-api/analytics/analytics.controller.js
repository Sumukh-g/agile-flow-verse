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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const swagger_decorators_1 = require("../common/swagger/swagger.decorators");
const analytics_service_1 = require("./analytics.service");
const enhanced_analytics_service_1 = require("./enhanced-analytics.service");
const dto_1 = require("./dto");
let AnalyticsController = class AnalyticsController {
    constructor(analyticsService, enhancedAnalyticsService) {
        this.analyticsService = analyticsService;
        this.enhancedAnalyticsService = enhancedAnalyticsService;
    }
    async getProjectAnalytics(projectId, query, req) {
        return this.analyticsService.getProjectAnalytics(req.user.tenantId, projectId, query);
    }
    async getTaskAnalytics(query, req) {
        return this.analyticsService.getTaskAnalytics(req.user.tenantId, query);
    }
    async getUserAnalytics(userId, query, req) {
        return this.analyticsService.getUserAnalytics(req.user.tenantId, userId, query);
    }
    async getTenantAnalytics(query, req) {
        return this.analyticsService.getTenantAnalytics(req.user.tenantId, query);
    }
    async getPerformanceMetrics(projectId, days, req) {
        return this.enhancedAnalyticsService.getPerformanceMetrics(req.user.tenantId, projectId, days || 30);
    }
    async getTrendData(metric, projectId, days, groupBy, req) {
        return this.enhancedAnalyticsService.getTrendData(req.user.tenantId, metric, projectId, days || 30, groupBy || 'day');
    }
    async getWorkloadAnalysis(projectId, req) {
        return this.enhancedAnalyticsService.getWorkloadAnalysis(req.user.tenantId, projectId);
    }
    async getForecast(projectId, targetDate, req) {
        return this.enhancedAnalyticsService.getForecast(req.user.tenantId, projectId, targetDate);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('projects/:projectId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get project analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Project analytics retrieved successfully' }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AnalyticsQueryDto, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getProjectAnalytics", null);
__decorate([
    (0, common_1.Get)('tasks'),
    (0, swagger_1.ApiOperation)({ summary: 'Get task analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Task analytics retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.AnalyticsQueryDto, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTaskAnalytics", null);
__decorate([
    (0, common_1.Get)('users/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User analytics retrieved successfully' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AnalyticsQueryDto, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getUserAnalytics", null);
__decorate([
    (0, common_1.Get)('tenant'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tenant analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tenant analytics retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.AnalyticsQueryDto, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTenantAnalytics", null);
__decorate([
    (0, common_1.Get)('performance'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get performance metrics',
        description: 'Get advanced performance metrics including cycle time, lead time, throughput, and WIP.'
    }),
    (0, swagger_1.ApiQuery)({ name: 'projectId', required: false, description: 'Filter by project ID' }),
    (0, swagger_1.ApiQuery)({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Performance metrics retrieved successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Query)('projectId')),
    __param(1, (0, common_1.Query)('days')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getPerformanceMetrics", null);
__decorate([
    (0, common_1.Get)('trends'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get trend data',
        description: 'Get trend data over time for tasks, projects, completion rate, or velocity.'
    }),
    (0, swagger_1.ApiQuery)({ name: 'metric', required: true, enum: ['tasks', 'projects', 'completion', 'velocity'] }),
    (0, swagger_1.ApiQuery)({ name: 'projectId', required: false, description: 'Filter by project ID' }),
    (0, swagger_1.ApiQuery)({ name: 'days', required: false, type: Number, description: 'Number of days (default: 30)' }),
    (0, swagger_1.ApiQuery)({ name: 'groupBy', required: false, enum: ['day', 'week', 'month'], description: 'Grouping interval' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Trend data retrieved successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Query)('metric')),
    __param(1, (0, common_1.Query)('projectId')),
    __param(2, (0, common_1.Query)('days')),
    __param(3, (0, common_1.Query)('groupBy')),
    __param(4, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, String, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTrendData", null);
__decorate([
    (0, common_1.Get)('workload'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get workload analysis',
        description: 'Get workload analysis for all team members showing assigned tasks, hours, and workload percentage.'
    }),
    (0, swagger_1.ApiQuery)({ name: 'projectId', required: false, description: 'Filter by project ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workload data retrieved successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Query)('projectId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getWorkloadAnalysis", null);
__decorate([
    (0, common_1.Get)('forecast'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get project forecast',
        description: 'Get predicted completion date and risk assessment for a project.'
    }),
    (0, swagger_1.ApiQuery)({ name: 'projectId', required: true, description: 'Project ID' }),
    (0, swagger_1.ApiQuery)({ name: 'targetDate', required: true, description: 'Target completion date (ISO string)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Forecast data retrieved successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Query)('projectId')),
    __param(1, (0, common_1.Query)('targetDate')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getForecast", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('analytics'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('/v1/analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService,
        enhanced_analytics_service_1.EnhancedAnalyticsService])
], AnalyticsController);
