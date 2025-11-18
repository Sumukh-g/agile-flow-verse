/**
 * Enhanced Notifications Hooks with React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, type Notification, type NotificationQueryDto } from '@/lib/api';

// Query keys
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters: NotificationQueryDto) => [...notificationKeys.lists(), filters] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
  archived: (filters: NotificationQueryDto) => [...notificationKeys.all, 'archived', filters] as const,
};

/**
 * Get all notifications
 */
export function useNotifications(query?: NotificationQueryDto) {
  return useQuery({
    queryKey: notificationKeys.list(query || {}),
    queryFn: async () => {
      const response = await api.notifications.getNotifications(query);
      return response.data || [];
    },
    staleTime: 10000, // 10 seconds (notifications should be fresh)
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Get unread notifications count
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => api.notifications.getUnreadCount(),
    staleTime: 10000,
    refetchInterval: 30000,
  });
}

/**
 * Mark notification(s) as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationIds: string[]) => api.notifications.markAsRead(notificationIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to mark as read');
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.notifications.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      toast.success('All notifications marked as read');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to mark all as read');
    },
  });
}

/**
 * Delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.notifications.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to delete notification');
    },
  });
}

/**
 * Bulk delete notifications
 */
export function useBulkDeleteNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationIds: string[]) => api.notifications.bulkDelete(notificationIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      toast.success('Notifications deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to delete notifications');
    },
  });
}

/**
 * Archive notification(s)
 */
export function useArchiveNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationIds: string[]) => api.notifications.archive(notificationIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      toast.success('Notifications archived successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to archive notifications');
    },
  });
}

/**
 * Unarchive notification(s)
 */
export function useUnarchiveNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationIds: string[]) => api.notifications.unarchive(notificationIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.archived({}) });
      toast.success('Notifications unarchived successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to unarchive notifications');
    },
  });
}

/**
 * Get archived notifications
 */
export function useArchivedNotifications(query?: NotificationQueryDto) {
  return useQuery({
    queryKey: notificationKeys.archived(query || {}),
    queryFn: async () => {
      const response = await api.notifications.getArchived(query);
      return response.data || [];
    },
    staleTime: 30000,
  });
}

