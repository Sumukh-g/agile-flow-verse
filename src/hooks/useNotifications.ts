import { apiClient } from '@/lib/api-client';
import { realtimeClient } from '@/lib/realtime-client';
import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';

// Types matching backend DTOs
export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: any;
  channels: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  readAt?: Date;
  archived: boolean;
  archivedAt?: Date;
  source?: string;
  category?: 'Important' | 'Social' | 'Work';
  scheduledFor: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationService {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
  connected: boolean;
  category: 'Important' | 'Social' | 'Work';
  settings: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  hasMore: boolean;
}

export interface NotificationQueryParams {
  search?: string;
  type?: string;
  read?: boolean;
  priority?: string;
  limit?: number;
  offset?: number;
}

// Query keys for cache management
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters: NotificationQueryParams) => [...notificationKeys.lists(), filters] as const,
  archived: (filters: NotificationQueryParams) => [...notificationKeys.all, 'archived', filters] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  services: () => [...notificationKeys.all, 'services'] as const,
};

/**
 * Hook to fetch notifications with filtering
 */
export function useNotifications(
  params: NotificationQueryParams = {},
  options?: Omit<UseQueryOptions<NotificationsResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<NotificationsResponse, Error>({
    queryKey: notificationKeys.list(params),
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.type) queryParams.append('type', params.type);
      if (params.read !== undefined) queryParams.append('read', String(params.read));
      if (params.priority) queryParams.append('priority', params.priority);
      if (params.limit) queryParams.append('limit', String(params.limit));
      if (params.offset) queryParams.append('offset', String(params.offset));
      
      return apiClient.get<NotificationsResponse>(
        `/notifications?${queryParams.toString()}`
      );
    },
    staleTime: 30000, // 30 seconds
    ...options,
  });
}

/**
 * Hook to fetch archived notifications
 */
export function useArchivedNotifications(
  params: NotificationQueryParams = {},
  options?: Omit<UseQueryOptions<NotificationsResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<NotificationsResponse, Error>({
    queryKey: notificationKeys.archived(params),
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.limit) queryParams.append('limit', String(params.limit));
      if (params.offset) queryParams.append('offset', String(params.offset));
      
      return apiClient.get<NotificationsResponse>(
        `/notifications/archived?${queryParams.toString()}`
      );
    },
    staleTime: 60000, // 1 minute
    ...options,
  });
}

/**
 * Hook to get unread notification count
 */
export function useUnreadCount() {
  return useQuery<{ count: number }, Error>({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => apiClient.get<{ count: number }>('/notifications/unread-count'),
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Hook to mark notifications as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationIds: string[]) =>
      apiClient.put('/notifications/mark-read', { notificationIds }),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark notifications as read');
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.put('/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      toast.success('All notifications marked as read');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark all as read');
    },
  });
}

/**
 * Hook to archive notifications
 */
export function useArchiveNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationIds: string[]) =>
      apiClient.put('/notifications/archive', { notificationIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.archived({}) });
      toast.success('Notifications archived');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to archive notifications');
    },
  });
}

/**
 * Hook to unarchive notifications
 */
export function useUnarchiveNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationIds: string[]) =>
      apiClient.put('/notifications/unarchive', { notificationIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.archived({}) });
      toast.success('Notifications unarchived');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unarchive notifications');
    },
  });
}

/**
 * Hook to delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      apiClient.delete(`/notifications/${notificationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      toast.success('Notification deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete notification');
    },
  });
}

/**
 * Hook to bulk delete notifications
 */
export function useBulkDeleteNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationIds: string[]) =>
      apiClient.delete('/notifications/bulk', { data: { notificationIds } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      toast.success('Notifications deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete notifications');
    },
  });
}

/**
 * Hook to fetch notification services
 */
export function useNotificationServices(
  options?: Omit<UseQueryOptions<NotificationService[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<NotificationService[], Error>({
    queryKey: notificationKeys.services(),
    queryFn: () => apiClient.get<NotificationService[]>('/notifications/services'),
    staleTime: 300000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to create a notification service
 */
export function useCreateNotificationService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; category: string; icon?: string; color?: string }) =>
      apiClient.post('/notifications/services', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.services() });
      toast.success('Service added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add service');
    },
  });
}

/**
 * Hook to update a notification service
 */
export function useUpdateNotificationService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NotificationService> }) =>
      apiClient.put(`/notifications/services/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.services() });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update service');
    },
  });
}

/**
 * Hook to delete a notification service
 */
export function useDeleteNotificationService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceId: string) =>
      apiClient.delete(`/notifications/services/${serviceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.services() });
      toast.success('Service removed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove service');
    },
  });
}

/**
 * Hook to enable real-time notifications
 * Subscribes to notification.new events and updates the cache
 */
export function useRealtimeNotifications(enabled: boolean = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    // Subscribe to new notification events
    const unsubscribe = realtimeClient.on('notification.new', (notification: Notification) => {
      console.log('[Realtime] New notification received:', notification);
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      
      // Show toast notification (only for high/urgent priority)
      if (notification.priority === 'high' || notification.priority === 'urgent') {
        toast.info(notification.title, {
          description: notification.message,
          action: {
            label: 'View',
            onClick: () => {
              // Navigate to notifications page
              window.location.href = '/notifications';
            },
          },
        });
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [enabled, queryClient]);
}

