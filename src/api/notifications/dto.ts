import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsNumber, IsObject, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

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

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export class CreateNotificationDto {
  @ApiProperty({ description: 'Tenant ID', example: 'tenant123' })
  @IsString()
  @IsUUID()
  tenantId: string;

  @ApiProperty({ description: 'User ID to notify', example: 'user123' })
  @IsString()
  @IsUUID()
  userId: string;

  @ApiProperty({ 
    description: 'Notification type', 
    enum: NotificationType,
    example: NotificationType.TASK_ASSIGNED
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Notification title', example: 'Task Assigned' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification message', example: 'You have been assigned to a new task' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Additional notification data' })
  @IsOptional()
  @IsObject()
  data?: any;

  @ApiPropertyOptional({ 
    description: 'Notification channels', 
    enum: NotificationChannel,
    isArray: true,
    example: [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];

  @ApiPropertyOptional({ 
    description: 'Notification priority', 
    enum: NotificationPriority,
    example: NotificationPriority.MEDIUM
  })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({ description: 'Scheduled send time', example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;
}

export class NotificationQueryDto {
  @ApiPropertyOptional({ description: 'Search term for title or message' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by notification type', 
    enum: NotificationType
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ description: 'Filter by read status' })
  @IsOptional()
  read?: boolean;

  @ApiPropertyOptional({ 
    description: 'Filter by priority', 
    enum: NotificationPriority
  })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({ description: 'Number of items per page', example: 25 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 25;

  @ApiPropertyOptional({ description: 'Number of items to skip', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

export class MarkAsReadDto {
  @ApiPropertyOptional({ 
    description: 'Specific notification IDs to mark as read', 
    type: [String],
    example: ['notif123', 'notif456']
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  notificationIds?: string[];

  @ApiPropertyOptional({ 
    description: 'Mark all notifications of this type as read', 
    enum: NotificationType
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}

export class NotificationResponseDto {
  @ApiProperty({ description: 'Notification ID' })
  id: string;

  @ApiProperty({ description: 'Tenant ID' })
  tenantId: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  title: string;

  @ApiProperty({ description: 'Notification message' })
  message: string;

  @ApiProperty({ description: 'Additional data' })
  data: any;

  @ApiProperty({ description: 'Notification channels', enum: NotificationChannel, isArray: true })
  channels: NotificationChannel[];

  @ApiProperty({ description: 'Notification priority', enum: NotificationPriority })
  priority: NotificationPriority;

  @ApiProperty({ description: 'Read status' })
  read: boolean;

  @ApiProperty({ description: 'Read timestamp' })
  readAt?: Date;

  @ApiProperty({ description: 'Archived status' })
  archived: boolean;

  @ApiProperty({ description: 'Scheduled send time' })
  scheduledFor: Date;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Source service name' })
  source?: string;

  @ApiProperty({ description: 'Category', enum: ['Important', 'Social', 'Work'] })
  category?: string;
}

export class BulkNotificationActionDto {
  @ApiProperty({ 
    description: 'Notification IDs to perform action on', 
    type: [String],
    example: ['notif123', 'notif456']
  })
  @IsArray()
  @IsUUID(4, { each: true })
  notificationIds: string[];
}

export class ArchiveNotificationDto {
  @ApiProperty({ 
    description: 'Notification IDs to archive', 
    type: [String],
    example: ['notif123', 'notif456']
  })
  @IsArray()
  @IsUUID(4, { each: true })
  notificationIds: string[];
}

export class NotificationServiceCategory {
  IMPORTANT = 'Important';
  SOCIAL = 'Social';
  WORK = 'Work';
}

export class CreateNotificationServiceDto {
  @ApiProperty({ description: 'Service name', example: 'Gmail' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Service category', enum: ['Important', 'Social', 'Work'], example: 'Work' })
  @IsEnum(['Important', 'Social', 'Work'])
  category: string;

  @ApiPropertyOptional({ description: 'Service icon name', example: 'Mail' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Service color', example: 'bg-blue-500' })
  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateNotificationServiceDto {
  @ApiPropertyOptional({ description: 'Service name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Service category', enum: ['Important', 'Social', 'Work'] })
  @IsOptional()
  @IsEnum(['Important', 'Social', 'Work'])
  category?: string;

  @ApiPropertyOptional({ description: 'Enabled status' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Connected status' })
  @IsOptional()
  @IsBoolean()
  connected?: boolean;
}




