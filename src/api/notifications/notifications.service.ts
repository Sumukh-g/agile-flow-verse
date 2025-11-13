import { Injectable, Logger } from '@nestjs/common';
import { KafkaService } from '../common/kafka/kafka.service';
import { RedisClient } from '../common/redis/redis.client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto, MarkAsReadDto, NotificationPriority, NotificationQueryDto } from './dto';

export enum NotificationType {
  TASK_ASSIGNED = 'task.assigned',
  TASK_UPDATED = 'task.updated',
  TASK_COMPLETED = 'task.completed',
  TASK_OVERDUE = 'task.overdue',
  PROJECT_UPDATED = 'project.updated',
  COMMENT_ADDED = 'comment.added',
  MENTION = 'mention',
  SYSTEM = 'system',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafka: KafkaService,
    private readonly redis: RedisClient,
  ) {}

  async createNotification(data: CreateNotificationDto) {
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

  async getUserNotifications(tenantId: string, userId: string, query: NotificationQueryDto) {
    const where: any = {
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

  async getArchivedNotifications(tenantId: string, userId: string, query: NotificationQueryDto) {
    const where: any = {
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

  async markAsRead(tenantId: string, userId: string, data: MarkAsReadDto) {
    const where: any = {
      tenantId,
      userId,
    };

    if (data.notificationIds && data.notificationIds.length > 0) {
      where.id = { in: data.notificationIds };
    } else if (data.type) {
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

  async markAllAsRead(tenantId: string, userId: string) {
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

  async getUnreadCount(tenantId: string, userId: string): Promise<number> {
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

  async deleteNotification(tenantId: string, userId: string, notificationId: string) {
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

  async archiveNotifications(tenantId: string, userId: string, notificationIds: string[]) {
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

  async unarchiveNotifications(tenantId: string, userId: string, notificationIds: string[]) {
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

  async bulkDeleteNotifications(tenantId: string, userId: string, notificationIds: string[]) {
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
  async getUserServices(tenantId: string, userId: string) {
    return this.prisma.tx.notificationService.findMany({
      where: {
        tenantId,
        userId,
      },
      orderBy: { name: 'asc' },
    });
  }

  async createService(tenantId: string, userId: string, data: any) {
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

  async updateService(tenantId: string, userId: string, serviceId: string, data: any) {
    return this.prisma.tx.notificationService.updateMany({
      where: {
        id: serviceId,
        tenantId,
        userId,
      },
      data,
    });
  }

  async deleteService(tenantId: string, userId: string, serviceId: string) {
    return this.prisma.tx.notificationService.deleteMany({
      where: {
        id: serviceId,
        tenantId,
        userId,
      },
    });
  }

  async sendTaskNotification(
    tenantId: string,
    userId: string,
    type: NotificationType,
    taskId: string,
    taskTitle: string,
    additionalData?: any,
  ) {
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

  async sendProjectNotification(
    tenantId: string,
    userId: string,
    type: NotificationType,
    projectId: string,
    projectName: string,
    additionalData?: any,
  ) {
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

  private async sendRealtimeNotification(notification: any) {
    try {
      // Send via WebSocket (implement your WebSocket service)
      // await this.websocketService.sendToUser(notification.userId, {
      //   type: 'notification',
      //   data: notification,
      // });
      
      this.logger.log(`Real-time notification sent to user ${notification.userId}`);
    } catch (error) {
      this.logger.error('Failed to send real-time notification', error);
    }
  }

  private async clearNotificationCache(tenantId: string, userId: string) {
    const keys = [
      `notifications:unread:${tenantId}:${userId}`,
      `notifications:list:${tenantId}:${userId}`,
    ];
    
    await Promise.all(keys.map(key => this.redis.del(key)));
  }

  private getTaskNotificationTitle(type: NotificationType, taskTitle: string): string {
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

  private getTaskNotificationMessage(type: NotificationType, taskTitle: string): string {
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

  private getTaskNotificationPriority(type: NotificationType): NotificationPriority {
    switch (type) {
      case NotificationType.TASK_OVERDUE:
        return NotificationPriority.HIGH;
      case NotificationType.TASK_ASSIGNED:
        return NotificationPriority.MEDIUM;
      case NotificationType.TASK_UPDATED:
        return NotificationPriority.LOW;
      case NotificationType.TASK_COMPLETED:
        return NotificationPriority.LOW;
      default:
        return NotificationPriority.MEDIUM;
    }
  }

  private getProjectNotificationTitle(type: NotificationType, projectName: string): string {
    switch (type) {
      case NotificationType.PROJECT_UPDATED:
        return `Project Updated: ${projectName}`;
      default:
        return `Project Notification: ${projectName}`;
    }
  }

  private getProjectNotificationMessage(type: NotificationType, projectName: string): string {
    switch (type) {
      case NotificationType.PROJECT_UPDATED:
        return `The project "${projectName}" has been updated`;
      default:
        return `Notification for project "${projectName}"`;
    }
  }

  private getProjectNotificationPriority(type: NotificationType): NotificationPriority {
    switch (type) {
      case NotificationType.PROJECT_UPDATED:
        return NotificationPriority.MEDIUM;
      default:
        return NotificationPriority.MEDIUM;
    }
  }
}




