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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = exports.NotificationChannel = exports.NotificationType = void 0;
const common_1 = require("@nestjs/common");
const kafka_service_1 = require("../common/kafka/kafka.service");
const redis_client_1 = require("../common/redis/redis.client");
const prisma_service_1 = require("../prisma/prisma.service");
const dto_1 = require("./dto");
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
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(prisma, kafka, redis) {
        this.prisma = prisma;
        this.kafka = kafka;
        this.redis = redis;
        this.logger = new common_1.Logger(NotificationsService_1.name);
    }
    async createNotification(data) {
        const notification = await this.prisma.tx.notification.create({
            data: {
                tenantId: data.tenantId,
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                data: data.data || {},
                channels: data.channels || [NotificationChannel.IN_APP],
                priority: data.priority || 'medium',
                scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : new Date(),
            },
        });
        // Send real-time notification via WebSocket
        await this.sendRealtimeNotification(notification);
        // Send to Kafka for processing
        await this.kafka.send('notifications.created', {
            notificationId: notification.id,
            tenantId: data.tenantId,
            userId: data.userId,
            type: data.type,
        });
        return notification;
    }
    async getUserNotifications(tenantId, userId, query) {
        const where = {
            tenantId,
            userId,
            archived: false, // By default, don't show archived
        };
        if (query.type) {
            where.type = query.type;
        }
        if (query.read !== undefined) {
            where.read = query.read;
        }
        if (query.priority) {
            where.priority = query.priority;
        }
        if (query.search) {
            where.OR = [
                { title: { contains: query.search, mode: 'insensitive' } },
                { message: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        const notifications = await this.prisma.tx.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: query.limit || 25,
            skip: query.offset || 0,
        });
        const total = await this.prisma.tx.notification.count({ where });
        return {
            notifications,
            total,
            hasMore: notifications.length === (query.limit || 25),
        };
    }
    async getArchivedNotifications(tenantId, userId, query) {
        const where = {
            tenantId,
            userId,
            archived: true,
        };
        if (query.search) {
            where.OR = [
                { title: { contains: query.search, mode: 'insensitive' } },
                { message: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        const notifications = await this.prisma.tx.notification.findMany({
            where,
            orderBy: { archivedAt: 'desc' },
            take: query.limit || 25,
            skip: query.offset || 0,
        });
        const total = await this.prisma.tx.notification.count({ where });
        return {
            notifications,
            total,
            hasMore: notifications.length === (query.limit || 25),
        };
    }
    async markAsRead(tenantId, userId, data) {
        const where = {
            tenantId,
            userId,
        };
        if (data.notificationIds && data.notificationIds.length > 0) {
            where.id = { in: data.notificationIds };
        }
        else if (data.type) {
            where.type = data.type;
        }
        const result = await this.prisma.tx.notification.updateMany({
            where,
            data: {
                read: true,
                readAt: new Date(),
            },
        });
        // Clear cache
        await this.clearNotificationCache(tenantId, userId);
        return result;
    }
    async markAllAsRead(tenantId, userId) {
        const result = await this.prisma.tx.notification.updateMany({
            where: {
                tenantId,
                userId,
                read: false,
            },
            data: {
                read: true,
                readAt: new Date(),
            },
        });
        // Clear cache
        await this.clearNotificationCache(tenantId, userId);
        return result;
    }
    async getUnreadCount(tenantId, userId) {
        const cacheKey = `notifications:unread:${tenantId}:${userId}`;
        // Try to get from cache first
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return parseInt(cached, 10);
        }
        const count = await this.prisma.tx.notification.count({
            where: {
                tenantId,
                userId,
                read: false,
            },
        });
        // Cache for 5 minutes
        await this.redis.setex(cacheKey, 300, count.toString());
        return count;
    }
    async deleteNotification(tenantId, userId, notificationId) {
        const result = await this.prisma.tx.notification.deleteMany({
            where: {
                id: notificationId,
                tenantId,
                userId,
            },
        });
        // Clear cache
        await this.clearNotificationCache(tenantId, userId);
        return result;
    }
    async archiveNotifications(tenantId, userId, notificationIds) {
        const result = await this.prisma.tx.notification.updateMany({
            where: {
                id: { in: notificationIds },
                tenantId,
                userId,
            },
            data: {
                archived: true,
                archivedAt: new Date(),
            },
        });
        // Clear cache
        await this.clearNotificationCache(tenantId, userId);
        return result;
    }
    async unarchiveNotifications(tenantId, userId, notificationIds) {
        const result = await this.prisma.tx.notification.updateMany({
            where: {
                id: { in: notificationIds },
                tenantId,
                userId,
            },
            data: {
                archived: false,
                archivedAt: null,
            },
        });
        // Clear cache
        await this.clearNotificationCache(tenantId, userId);
        return result;
    }
    async bulkDeleteNotifications(tenantId, userId, notificationIds) {
        const result = await this.prisma.tx.notification.deleteMany({
            where: {
                id: { in: notificationIds },
                tenantId,
                userId,
            },
        });
        // Clear cache
        await this.clearNotificationCache(tenantId, userId);
        return result;
    }
    // Notification Services Management
    async getUserServices(tenantId, userId) {
        return this.prisma.tx.notificationService.findMany({
            where: {
                tenantId,
                userId,
            },
            orderBy: { name: 'asc' },
        });
    }
    async createService(tenantId, userId, data) {
        return this.prisma.tx.notificationService.create({
            data: {
                tenantId,
                userId,
                name: data.name,
                category: data.category,
                icon: data.icon || 'Bell',
                color: data.color || 'bg-gray-500',
                enabled: true,
                connected: false,
                settings: data.settings || {},
            },
        });
    }
    async updateService(tenantId, userId, serviceId, data) {
        return this.prisma.tx.notificationService.updateMany({
            where: {
                id: serviceId,
                tenantId,
                userId,
            },
            data,
        });
    }
    async deleteService(tenantId, userId, serviceId) {
        return this.prisma.tx.notificationService.deleteMany({
            where: {
                id: serviceId,
                tenantId,
                userId,
            },
        });
    }
    async sendTaskNotification(tenantId, userId, type, taskId, taskTitle, additionalData) {
        const notification = await this.createNotification({
            tenantId,
            userId,
            type,
            title: this.getTaskNotificationTitle(type, taskTitle),
            message: this.getTaskNotificationMessage(type, taskTitle),
            data: {
                taskId,
                ...additionalData,
            },
            channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
            priority: this.getTaskNotificationPriority(type),
        });
        return notification;
    }
    async sendProjectNotification(tenantId, userId, type, projectId, projectName, additionalData) {
        const notification = await this.createNotification({
            tenantId,
            userId,
            type,
            title: this.getProjectNotificationTitle(type, projectName),
            message: this.getProjectNotificationMessage(type, projectName),
            data: {
                projectId,
                ...additionalData,
            },
            channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
            priority: this.getProjectNotificationPriority(type),
        });
        return notification;
    }
    async sendRealtimeNotification(notification) {
        try {
            // Send via WebSocket (implement your WebSocket service)
            // await this.websocketService.sendToUser(notification.userId, {
            //   type: 'notification',
            //   data: notification,
            // });
            this.logger.log(`Real-time notification sent to user ${notification.userId}`);
        }
        catch (error) {
            this.logger.error('Failed to send real-time notification', error);
        }
    }
    async clearNotificationCache(tenantId, userId) {
        const keys = [
            `notifications:unread:${tenantId}:${userId}`,
            `notifications:list:${tenantId}:${userId}`,
        ];
        await Promise.all(keys.map(key => this.redis.del(key)));
    }
    getTaskNotificationTitle(type, taskTitle) {
        switch (type) {
            case NotificationType.TASK_ASSIGNED:
                return `Task Assigned: ${taskTitle}`;
            case NotificationType.TASK_UPDATED:
                return `Task Updated: ${taskTitle}`;
            case NotificationType.TASK_COMPLETED:
                return `Task Completed: ${taskTitle}`;
            case NotificationType.TASK_OVERDUE:
                return `Task Overdue: ${taskTitle}`;
            default:
                return `Task Notification: ${taskTitle}`;
        }
    }
    getTaskNotificationMessage(type, taskTitle) {
        switch (type) {
            case NotificationType.TASK_ASSIGNED:
                return `You have been assigned to the task "${taskTitle}"`;
            case NotificationType.TASK_UPDATED:
                return `The task "${taskTitle}" has been updated`;
            case NotificationType.TASK_COMPLETED:
                return `The task "${taskTitle}" has been completed`;
            case NotificationType.TASK_OVERDUE:
                return `The task "${taskTitle}" is overdue`;
            default:
                return `Notification for task "${taskTitle}"`;
        }
    }
    getTaskNotificationPriority(type) {
        switch (type) {
            case NotificationType.TASK_OVERDUE:
                return dto_1.NotificationPriority.HIGH;
            case NotificationType.TASK_ASSIGNED:
                return dto_1.NotificationPriority.MEDIUM;
            case NotificationType.TASK_UPDATED:
                return dto_1.NotificationPriority.LOW;
            case NotificationType.TASK_COMPLETED:
                return dto_1.NotificationPriority.LOW;
            default:
                return dto_1.NotificationPriority.MEDIUM;
        }
    }
    getProjectNotificationTitle(type, projectName) {
        switch (type) {
            case NotificationType.PROJECT_UPDATED:
                return `Project Updated: ${projectName}`;
            default:
                return `Project Notification: ${projectName}`;
        }
    }
    getProjectNotificationMessage(type, projectName) {
        switch (type) {
            case NotificationType.PROJECT_UPDATED:
                return `The project "${projectName}" has been updated`;
            default:
                return `Notification for project "${projectName}"`;
        }
    }
    getProjectNotificationPriority(type) {
        switch (type) {
            case NotificationType.PROJECT_UPDATED:
                return dto_1.NotificationPriority.MEDIUM;
            default:
                return dto_1.NotificationPriority.MEDIUM;
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        kafka_service_1.KafkaService,
        redis_client_1.RedisClient])
], NotificationsService);
