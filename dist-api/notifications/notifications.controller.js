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
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const dto_1 = require("./dto");
const notifications_service_1 = require("./notifications.service");
let NotificationsController = class NotificationsController {
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    async create(body, req) {
        return this.notificationsService.createNotification({
            ...body,
            tenantId: req.user.tenantId,
            userId: req.user.userId,
        });
    }
    async list(query, req) {
        return this.notificationsService.getUserNotifications(req.user.tenantId, req.user.userId, query);
    }
    async getUnreadCount(req) {
        const count = await this.notificationsService.getUnreadCount(req.user.tenantId, req.user.userId);
        return { count };
    }
    async markAsRead(body, req) {
        return this.notificationsService.markAsRead(req.user.tenantId, req.user.userId, body);
    }
    async markAllAsRead(req) {
        return this.notificationsService.markAllAsRead(req.user.tenantId, req.user.userId);
    }
    async delete(id, req) {
        return this.notificationsService.deleteNotification(req.user.tenantId, req.user.userId, id);
    }
    async getArchived(query, req) {
        return this.notificationsService.getArchivedNotifications(req.user.tenantId, req.user.userId, query);
    }
    async archive(body, req) {
        return this.notificationsService.archiveNotifications(req.user.tenantId, req.user.userId, body.notificationIds);
    }
    async unarchive(body, req) {
        return this.notificationsService.unarchiveNotifications(req.user.tenantId, req.user.userId, body.notificationIds);
    }
    async bulkDelete(body, req) {
        return this.notificationsService.bulkDeleteNotifications(req.user.tenantId, req.user.userId, body.notificationIds);
    }
    // Notification Services Endpoints
    async getServices(req) {
        return this.notificationsService.getUserServices(req.user.tenantId, req.user.userId);
    }
    async createService(body, req) {
        return this.notificationsService.createService(req.user.tenantId, req.user.userId, body);
    }
    async updateService(id, body, req) {
        return this.notificationsService.updateService(req.user.tenantId, req.user.userId, id, body);
    }
    async deleteService(id, req) {
        return this.notificationsService.deleteService(req.user.tenantId, req.user.userId, id);
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new notification' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Notification created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateNotificationDto, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user notifications' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notifications retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.NotificationQueryDto, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('unread-count'),
    (0, swagger_1.ApiOperation)({ summary: 'Get unread notification count' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Unread count retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getUnreadCount", null);
__decorate([
    (0, common_1.Put)('mark-read'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark notifications as read' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notifications marked as read' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.MarkAsReadDto, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Put)('mark-all-read'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark all notifications as read' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'All notifications marked as read' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markAllAsRead", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a notification' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notification deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)('archived'),
    (0, swagger_1.ApiOperation)({ summary: 'Get archived notifications' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Archived notifications retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.NotificationQueryDto, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getArchived", null);
__decorate([
    (0, common_1.Put)('archive'),
    (0, swagger_1.ApiOperation)({ summary: 'Archive notifications' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notifications archived successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ArchiveNotificationDto, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "archive", null);
__decorate([
    (0, common_1.Put)('unarchive'),
    (0, swagger_1.ApiOperation)({ summary: 'Unarchive notifications' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notifications unarchived successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ArchiveNotificationDto, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "unarchive", null);
__decorate([
    (0, common_1.Delete)('bulk'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk delete notifications' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notifications deleted successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.BulkNotificationActionDto, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "bulkDelete", null);
__decorate([
    (0, common_1.Get)('services'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user notification services' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Services retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getServices", null);
__decorate([
    (0, common_1.Post)('services'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new notification service' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Service created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateNotificationServiceDto, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "createService", null);
__decorate([
    (0, common_1.Put)('services/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update notification service' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateNotificationServiceDto, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "updateService", null);
__decorate([
    (0, common_1.Delete)('services/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete notification service' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "deleteService", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, swagger_1.ApiTags)('notifications'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('/v1/notifications'),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsController);
