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
exports.MonitoringController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const monitoring_service_1 = require("./monitoring.service");
let MonitoringController = class MonitoringController {
    constructor(monitoringService) {
        this.monitoringService = monitoringService;
    }
    async getSystemMetrics() {
        return this.monitoringService.getSystemMetrics();
    }
    async getTenantMetrics(tenantId) {
        return this.monitoringService.getTenantMetrics(tenantId);
    }
    async getPerformanceMetrics() {
        return this.monitoringService.getPerformanceMetrics();
    }
    async getErrorMetrics() {
        return this.monitoringService.getErrorMetrics();
    }
    async getHealthStatus() {
        return this.monitoringService.getHealthStatus();
    }
    async getAuditLogs(limit, req) {
        return this.monitoringService.getAuditLogs(req.user.tenantId, limit);
    }
};
exports.MonitoringController = MonitoringController;
__decorate([
    (0, common_1.Get)('system'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'System metrics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getSystemMetrics", null);
__decorate([
    (0, common_1.Get)('tenant/:tenantId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tenant metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tenant metrics retrieved successfully' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getTenantMetrics", null);
__decorate([
    (0, common_1.Get)('performance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get performance metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Performance metrics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getPerformanceMetrics", null);
__decorate([
    (0, common_1.Get)('errors'),
    (0, swagger_1.ApiOperation)({ summary: 'Get error metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Error metrics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getErrorMetrics", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system health status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Health status retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getHealthStatus", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get audit logs' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Audit logs retrieved successfully' }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getAuditLogs", null);
exports.MonitoringController = MonitoringController = __decorate([
    (0, swagger_1.ApiTags)('monitoring'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('/v1/monitoring'),
    __metadata("design:paramtypes", [monitoring_service_1.MonitoringService])
], MonitoringController);
