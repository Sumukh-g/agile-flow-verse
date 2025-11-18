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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const swagger_decorators_1 = require("../common/swagger/swagger.decorators");
const reports_service_1 = require("./reports.service");
let ReportsController = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getBurndownReport(projectId, startDate, endDate, groupBy, req) {
        const config = {
            type: 'burndown',
            projectId,
            startDate,
            endDate,
            groupBy,
        };
        return this.reportsService.generateBurndownReport(req.user.tenantId, config);
    }
    async getVelocityReport(projectId, startDate, endDate, req) {
        const config = {
            type: 'velocity',
            projectId,
            startDate,
            endDate,
        };
        return this.reportsService.generateVelocityReport(req.user.tenantId, config);
    }
    async getCapacityReport(projectId, startDate, endDate, req) {
        const config = {
            type: 'capacity',
            projectId,
            startDate,
            endDate,
        };
        return this.reportsService.generateCapacityReport(req.user.tenantId, config);
    }
    async getTimeTrackingReport(projectId, userId, startDate, endDate, includeDetails, req) {
        const config = {
            type: 'time-tracking',
            projectId,
            userId,
            startDate,
            endDate,
            includeDetails: includeDetails === true,
        };
        return this.reportsService.generateTimeTrackingReport(req.user.tenantId, config);
    }
    async exportReport(type, format, projectId, startDate, endDate, res, req) {
        const config = {
            type: type,
            projectId,
            startDate,
            endDate,
        };
        let data;
        switch (type) {
            case 'burndown':
                data = await this.reportsService.generateBurndownReport(req.user.tenantId, config);
                break;
            case 'velocity':
                data = await this.reportsService.generateVelocityReport(req.user.tenantId, config);
                break;
            case 'capacity':
                data = await this.reportsService.generateCapacityReport(req.user.tenantId, config);
                break;
            case 'time-tracking':
                data = await this.reportsService.generateTimeTrackingReport(req.user.tenantId, config);
                break;
            default:
                throw new Error(`Unknown report type: ${type}`);
        }
        const exported = await this.reportsService.exportReport(req.user.tenantId, type, format, data);
        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${Date.now()}.csv"`);
            res.send(exported);
        }
        else if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${Date.now()}.json"`);
            res.send(exported);
        }
        else {
            throw new Error('PDF export not yet implemented');
        }
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('burndown'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate burndown chart data',
        description: 'Generates burndown chart data for a project showing planned vs actual progress over time.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'projectId', required: true, description: 'Project ID' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, description: 'Start date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, description: 'End date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'groupBy', required: false, enum: ['day', 'week', 'month'], description: 'Grouping interval' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Burndown data retrieved successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Query)('projectId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('groupBy')),
    __param(4, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getBurndownReport", null);
__decorate([
    (0, common_1.Get)('velocity'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate velocity report',
        description: 'Generates sprint velocity data showing completed vs planned tasks per sprint.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'projectId', required: false, description: 'Filter by project ID' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, description: 'Start date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, description: 'End date (ISO string)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Velocity data retrieved successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Query)('projectId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getVelocityReport", null);
__decorate([
    (0, common_1.Get)('capacity'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate capacity report',
        description: 'Generates team capacity and workload data showing assigned vs available hours per user.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'projectId', required: false, description: 'Filter by project ID' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, description: 'Start date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, description: 'End date (ISO string)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Capacity data retrieved successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Query)('projectId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getCapacityReport", null);
__decorate([
    (0, common_1.Get)('time-tracking'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate time tracking report',
        description: 'Generates detailed time tracking report grouped by date, user, and project.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'projectId', required: false, description: 'Filter by project ID' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false, description: 'Filter by user ID' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, description: 'Start date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, description: 'End date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'includeDetails', required: false, type: Boolean, description: 'Include detailed entries' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Time tracking data retrieved successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Query)('projectId')),
    __param(1, (0, common_1.Query)('userId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __param(4, (0, common_1.Query)('includeDetails')),
    __param(5, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Boolean, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getTimeTrackingReport", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, swagger_1.ApiOperation)({
        summary: 'Export report',
        description: 'Exports a report in the specified format (CSV, JSON, or PDF).',
    }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: true, enum: ['burndown', 'velocity', 'capacity', 'time-tracking'] }),
    (0, swagger_1.ApiQuery)({ name: 'format', required: true, enum: ['csv', 'json', 'pdf'] }),
    (0, swagger_1.ApiQuery)({ name: 'projectId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Report exported successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('format')),
    __param(2, (0, common_1.Query)('projectId')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __param(5, (0, common_1.Res)()),
    __param(6, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportReport", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('/v1/reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
