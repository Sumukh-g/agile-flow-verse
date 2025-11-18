/**
 * Notifications API Client
 */

import { apiClient } from '../api-client';
import {
  Notification,
  CreateNotificationDto,
  NotificationQueryDto,
  PaginatedResponse,
} from './types';

export const notificationsApi = {
  /**
   * Get all notifications for the current user
   */
  async getNotifications(query?: NotificationQueryDto): Promise<PaginatedResponse<Notification>> {
    return apiClient.get('/notifications', { params: query });
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    return apiClient.get('/notifications/unread-count');
  },

  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    return apiClient.post('/notifications', data);
  },

  /**
   * Mark notification(s) as read
   */
  async markAsRead(notificationIds: string[]): Promise<void> {
    return apiClient.put('/notifications/mark-read', { notificationIds });
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    return apiClient.put('/notifications/mark-all-read');
  },

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<void> {
    return apiClient.delete(`/notifications/${id}`);
  },

  /**
   * Bulk delete notifications
   */
  async bulkDelete(notificationIds: string[]): Promise<void> {
    return apiClient.delete('/notifications/bulk', { data: { notificationIds } });
  },

  /**
   * Archive notification(s)
   */
  async archive(notificationIds: string[]): Promise<void> {
    return apiClient.put('/notifications/archive', { notificationIds });
  },

  /**
   * Unarchive notification(s)
   */
  async unarchive(notificationIds: string[]): Promise<void> {
    return apiClient.put('/notifications/unarchive', { notificationIds });
  },

  /**
   * Get archived notifications
   */
  async getArchived(query?: NotificationQueryDto): Promise<PaginatedResponse<Notification>> {
    return apiClient.get('/notifications/archived', { params: query });
  },
};

