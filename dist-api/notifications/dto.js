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
exports.UpdateNotificationServiceDto = exports.CreateNotificationServiceDto = exports.NotificationServiceCategory = exports.ArchiveNotificationDto = exports.BulkNotificationActionDto = exports.NotificationResponseDto = exports.MarkAsReadDto = exports.NotificationQueryDto = exports.CreateNotificationDto = exports.NotificationPriority = exports.NotificationChannel = exports.NotificationType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
var NotificationType;
(function (NotificationType) {
    NotificationType["TASK_ASSIGNED"] = "task.assigned";
    NotificationType["TASK_UPDATED"] = "task.updated";
    NotificationType["TASK_COMPLETED"] = "task.completed";
    NotificationType["TASK_OVERDUE"] = "task.overdue";
    NotificationType["PROJECT_UPDATED"] = "project.updated";
    NotificationType["COMMENT_ADDED"] = "comment.added";
    NotificationType["MENTION"] = "mention";
    NotificationType["SYSTEM"] = "system";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["IN_APP"] = "in_app";
    NotificationChannel["EMAIL"] = "email";
    NotificationChannel["SLACK"] = "slack";
    NotificationChannel["WEBHOOK"] = "webhook";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
var NotificationPriority;
(function (NotificationPriority) {
    NotificationPriority["LOW"] = "low";
    NotificationPriority["MEDIUM"] = "medium";
    NotificationPriority["HIGH"] = "high";
    NotificationPriority["URGENT"] = "urgent";
})(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
class CreateNotificationDto {
}
exports.CreateNotificationDto = CreateNotificationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tenant ID', example: 'tenant123' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "tenantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID to notify', example: 'user123' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Notification type',
        enum: NotificationType,
        example: NotificationType.TASK_ASSIGNED
    }),
    (0, class_validator_1.IsEnum)(NotificationType),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Notification title', example: 'Task Assigned' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Notification message', example: 'You have been assigned to a new task' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Additional notification data' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateNotificationDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Notification channels',
        enum: NotificationChannel,
        isArray: true,
        example: [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(NotificationChannel, { each: true }),
    __metadata("design:type", Array)
], CreateNotificationDto.prototype, "channels", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Notification priority',
        enum: NotificationPriority,
        example: NotificationPriority.MEDIUM
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(NotificationPriority),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Scheduled send time', example: '2024-01-01T00:00:00Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "scheduledFor", void 0);
class NotificationQueryDto {
    constructor() {
        this.limit = 25;
        this.offset = 0;
    }
}
exports.NotificationQueryDto = NotificationQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search term for title or message' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificationQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by notification type',
        enum: NotificationType
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(NotificationType),
    __metadata("design:type", String)
], NotificationQueryDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by read status' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], NotificationQueryDto.prototype, "read", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by priority',
        enum: NotificationPriority
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(NotificationPriority),
    __metadata("design:type", String)
], NotificationQueryDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Number of items per page', example: 25 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], NotificationQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Number of items to skip', example: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], NotificationQueryDto.prototype, "offset", void 0);
class MarkAsReadDto {
}
exports.MarkAsReadDto = MarkAsReadDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Specific notification IDs to mark as read',
        type: [String],
        example: ['notif123', 'notif456']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)(4, { each: true }),
    __metadata("design:type", Array)
], MarkAsReadDto.prototype, "notificationIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Mark all notifications of this type as read',
        enum: NotificationType
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(NotificationType),
    __metadata("design:type", String)
], MarkAsReadDto.prototype, "type", void 0);
class NotificationResponseDto {
}
exports.NotificationResponseDto = NotificationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Notification ID' }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tenant ID' }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "tenantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID' }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Notification type', enum: NotificationType }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Notification title' }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Notification message' }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Additional data' }),
    __metadata("design:type", Object)
], NotificationResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Notification channels', enum: NotificationChannel, isArray: true }),
    __metadata("design:type", Array)
], NotificationResponseDto.prototype, "channels", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Notification priority', enum: NotificationPriority }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Read status' }),
    __metadata("design:type", Boolean)
], NotificationResponseDto.prototype, "read", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Read timestamp' }),
    __metadata("design:type", Date)
], NotificationResponseDto.prototype, "readAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Archived status' }),
    __metadata("design:type", Boolean)
], NotificationResponseDto.prototype, "archived", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Scheduled send time' }),
    __metadata("design:type", Date)
], NotificationResponseDto.prototype, "scheduledFor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Created timestamp' }),
    __metadata("design:type", Date)
], NotificationResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Updated timestamp' }),
    __metadata("design:type", Date)
], NotificationResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Source service name' }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Category', enum: ['Important', 'Social', 'Work'] }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "category", void 0);
class BulkNotificationActionDto {
}
exports.BulkNotificationActionDto = BulkNotificationActionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Notification IDs to perform action on',
        type: [String],
        example: ['notif123', 'notif456']
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)(4, { each: true }),
    __metadata("design:type", Array)
], BulkNotificationActionDto.prototype, "notificationIds", void 0);
class ArchiveNotificationDto {
}
exports.ArchiveNotificationDto = ArchiveNotificationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Notification IDs to archive',
        type: [String],
        example: ['notif123', 'notif456']
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)(4, { each: true }),
    __metadata("design:type", Array)
], ArchiveNotificationDto.prototype, "notificationIds", void 0);
class NotificationServiceCategory {
    constructor() {
        this.IMPORTANT = 'Important';
        this.SOCIAL = 'Social';
        this.WORK = 'Work';
    }
}
exports.NotificationServiceCategory = NotificationServiceCategory;
class CreateNotificationServiceDto {
}
exports.CreateNotificationServiceDto = CreateNotificationServiceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Service name', example: 'Gmail' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNotificationServiceDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Service category', enum: ['Important', 'Social', 'Work'], example: 'Work' }),
    (0, class_validator_1.IsEnum)(['Important', 'Social', 'Work']),
    __metadata("design:type", String)
], CreateNotificationServiceDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Service icon name', example: 'Mail' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNotificationServiceDto.prototype, "icon", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Service color', example: 'bg-blue-500' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNotificationServiceDto.prototype, "color", void 0);
class UpdateNotificationServiceDto {
}
exports.UpdateNotificationServiceDto = UpdateNotificationServiceDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Service name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateNotificationServiceDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Service category', enum: ['Important', 'Social', 'Work'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['Important', 'Social', 'Work']),
    __metadata("design:type", String)
], UpdateNotificationServiceDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Enabled status' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationServiceDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Connected status' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationServiceDto.prototype, "connected", void 0);
