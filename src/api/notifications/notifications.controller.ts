import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
    ArchiveNotificationDto,
    BulkNotificationActionDto,
    CreateNotificationDto,
    CreateNotificationServiceDto,
    MarkAsReadDto,
    NotificationQueryDto,
    UpdateNotificationServiceDto
} from './dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: 201, description: 'Notification created successfully' })
  async create(@Body() body: CreateNotificationDto, @Request() req: any) {
    return this.notificationsService.createNotification({
      ...body,
      tenantId: req.user.tenantId,
      userId: req.user.userId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async list(@Query() query: NotificationQueryDto, @Request() req: any) {
    return this.notificationsService.getUserNotifications(
      req.user.tenantId,
      req.user.userId,
      query,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationsService.getUnreadCount(
      req.user.tenantId,
      req.user.userId,
    );
    return { count };
  }

  @Put('mark-read')
  @ApiOperation({ summary: 'Mark notifications as read' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read' })
  async markAsRead(@Body() body: MarkAsReadDto, @Request() req: any) {
    return this.notificationsService.markAsRead(
      req.user.tenantId,
      req.user.userId,
      body,
    );
  }

  @Put('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.deleteNotification(
      req.user.tenantId,
      req.user.userId,
      id,
    );
  }

  @Get('archived')
  @ApiOperation({ summary: 'Get archived notifications' })
  @ApiResponse({ status: 200, description: 'Archived notifications retrieved successfully' })
  async getArchived(@Query() query: NotificationQueryDto, @Request() req: any) {
    return this.notificationsService.getArchivedNotifications(
      req.user.tenantId,
      req.user.userId,
      query,
    );
  }

  @Put('archive')
  @ApiOperation({ summary: 'Archive notifications' })
  @ApiResponse({ status: 200, description: 'Notifications archived successfully' })
  async archive(@Body() body: ArchiveNotificationDto, @Request() req: any) {
    return this.notificationsService.archiveNotifications(
      req.user.tenantId,
      req.user.userId,
      body.notificationIds,
    );
  }

  @Put('unarchive')
  @ApiOperation({ summary: 'Unarchive notifications' })
  @ApiResponse({ status: 200, description: 'Notifications unarchived successfully' })
  async unarchive(@Body() body: ArchiveNotificationDto, @Request() req: any) {
    return this.notificationsService.unarchiveNotifications(
      req.user.tenantId,
      req.user.userId,
      body.notificationIds,
    );
  }

  @Delete('bulk')
  @ApiOperation({ summary: 'Bulk delete notifications' })
  @ApiResponse({ status: 200, description: 'Notifications deleted successfully' })
  async bulkDelete(@Body() body: BulkNotificationActionDto, @Request() req: any) {
    return this.notificationsService.bulkDeleteNotifications(
      req.user.tenantId,
      req.user.userId,
      body.notificationIds,
    );
  }

  // Notification Services Endpoints
  @Get('services')
  @ApiOperation({ summary: 'Get user notification services' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  async getServices(@Request() req: any) {
    return this.notificationsService.getUserServices(
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Post('services')
  @ApiOperation({ summary: 'Create a new notification service' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  async createService(@Body() body: CreateNotificationServiceDto, @Request() req: any) {
    return this.notificationsService.createService(
      req.user.tenantId,
      req.user.userId,
      body,
    );
  }

  @Put('services/:id')
  @ApiOperation({ summary: 'Update notification service' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  async updateService(
    @Param('id') id: string,
    @Body() body: UpdateNotificationServiceDto,
    @Request() req: any,
  ) {
    return this.notificationsService.updateService(
      req.user.tenantId,
      req.user.userId,
      id,
      body,
    );
  }

  @Delete('services/:id')
  @ApiOperation({ summary: 'Delete notification service' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  async deleteService(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.deleteService(
      req.user.tenantId,
      req.user.userId,
      id,
    );
  }
}




