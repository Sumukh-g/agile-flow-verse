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
exports.TenantAnalyticsDto = exports.UserAnalyticsDto = exports.TaskAnalyticsDto = exports.ProjectAnalyticsDto = exports.AnalyticsQueryDto = exports.AnalyticsTimeRange = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var AnalyticsTimeRange;
(function (AnalyticsTimeRange) {
    AnalyticsTimeRange["LAST_7_DAYS"] = "7d";
    AnalyticsTimeRange["LAST_30_DAYS"] = "30d";
    AnalyticsTimeRange["LAST_90_DAYS"] = "90d";
    AnalyticsTimeRange["LAST_YEAR"] = "1y";
    AnalyticsTimeRange["CUSTOM"] = "custom";
})(AnalyticsTimeRange || (exports.AnalyticsTimeRange = AnalyticsTimeRange = {}));
class AnalyticsQueryDto {
}
exports.AnalyticsQueryDto = AnalyticsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Time range for analytics',
        enum: AnalyticsTimeRange,
        example: AnalyticsTimeRange.LAST_30_DAYS
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(AnalyticsTimeRange),
    __metadata("design:type", String)
], AnalyticsQueryDto.prototype, "timeRange", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Start date for custom range', example: '2024-01-01T00:00:00Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AnalyticsQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'End date for custom range', example: '2024-01-31T23:59:59Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AnalyticsQueryDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by project ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnalyticsQueryDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by user ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnalyticsQueryDto.prototype, "userId", void 0);
class ProjectAnalyticsDto {
}
exports.ProjectAnalyticsDto = ProjectAnalyticsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Project information' }),
    __metadata("design:type", Object)
], ProjectAnalyticsDto.prototype, "project", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Task statistics' }),
    __metadata("design:type", Object)
], ProjectAnalyticsDto.prototype, "tasks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Time tracking statistics' }),
    __metadata("design:type", Object)
], ProjectAnalyticsDto.prototype, "timeTracking", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Progress over time data' }),
    __metadata("design:type", Object)
], ProjectAnalyticsDto.prototype, "progressOverTime", void 0);
class TaskAnalyticsDto {
}
exports.TaskAnalyticsDto = TaskAnalyticsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of tasks' }),
    __metadata("design:type", Number)
], TaskAnalyticsDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tasks grouped by status' }),
    __metadata("design:type", Object)
], TaskAnalyticsDto.prototype, "byStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Task completion rate percentage' }),
    __metadata("design:type", Number)
], TaskAnalyticsDto.prototype, "completionRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Average completion time in days' }),
    __metadata("design:type", Number)
], TaskAnalyticsDto.prototype, "averageCompletionTimeDays", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of overdue tasks' }),
    __metadata("design:type", Number)
], TaskAnalyticsDto.prototype, "overdueTasks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Task velocity metrics' }),
    __metadata("design:type", Object)
], TaskAnalyticsDto.prototype, "velocity", void 0);
class UserAnalyticsDto {
}
exports.UserAnalyticsDto = UserAnalyticsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of assigned tasks' }),
    __metadata("design:type", Number)
], UserAnalyticsDto.prototype, "assignedTasks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of completed tasks' }),
    __metadata("design:type", Number)
], UserAnalyticsDto.prototype, "completedTasks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Task completion rate percentage' }),
    __metadata("design:type", Number)
], UserAnalyticsDto.prototype, "completionRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total hours logged' }),
    __metadata("design:type", Number)
], UserAnalyticsDto.prototype, "totalHoursLogged", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Average hours per day' }),
    __metadata("design:type", Number)
], UserAnalyticsDto.prototype, "averageHoursPerDay", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tasks grouped by status' }),
    __metadata("design:type", Object)
], UserAnalyticsDto.prototype, "tasksByStatus", void 0);
class TenantAnalyticsDto {
}
exports.TenantAnalyticsDto = TenantAnalyticsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tenant overview statistics' }),
    __metadata("design:type", Object)
], TenantAnalyticsDto.prototype, "overview", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Task statistics' }),
    __metadata("design:type", Object)
], TenantAnalyticsDto.prototype, "tasks", void 0);
