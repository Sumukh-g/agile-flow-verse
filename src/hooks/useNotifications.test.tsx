import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { 
  useNotifications, 
  useUnreadCount, 
  useMarkAsRead,
  useMarkAllAsRead,
  useArchiveNotifications,
  useDeleteNotification,
  useNotificationServices,
  useCreateNotificationService,
} from './useNotifications';
import { apiClient } from '@/lib/api-client';

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock realtime client
jest.mock('@/lib/realtime-client', () => ({
  realtimeClient: {
    on: jest.fn(() => jest.fn()), // Return unsubscribe function
  },
}));

describe('useNotifications Hooks', () => {
  let queryClient: QueryClient;
  
  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  afterEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  describe('useNotifications', () => {
    it('should fetch notifications successfully', async () => {
      const mockData = {
        notifications: [
          {
            id: 'notif1',
            title: 'Test Notification',
            message: 'Test message',
            read: false,
            archived: false,
            priority: 'medium',
          },
        ],
        total: 1,
        hasMore: false,
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockData);
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/notifications?')
      );
    });

    it('should include query parameters', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        notifications: [],
        total: 0,
        hasMore: false,
      });

      const { result } = renderHook(
        () =>
          useNotifications({
            search: 'test',
            priority: 'high',
            read: false,
            limit: 10,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('search=test')
      );
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('priority=high')
      );
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('read=false')
      );
    });

    it('should handle error', async () => {
      const mockError = new Error('Failed to fetch');
      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useUnreadCount', () => {
    it('should fetch unread count', async () => {
      const mockData = { count: 5 };
      (apiClient.get as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useUnreadCount(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockData);
      expect(apiClient.get).toHaveBeenCalledWith('/notifications/unread-count');
    });
  });

  describe('useMarkAsRead', () => {
    it('should mark notifications as read', async () => {
      (apiClient.put as jest.Mock).mockResolvedValue({ count: 2 });

      const { result } = renderHook(() => useMarkAsRead(), {
        wrapper: createWrapper(),
      });

      const notificationIds = ['notif1', 'notif2'];
      result.current.mutate(notificationIds);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.put).toHaveBeenCalledWith('/notifications/mark-read', {
        notificationIds,
      });
    });

    it('should handle error', async () => {
      const mockError = new Error('Failed to mark as read');
      (apiClient.put as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useMarkAsRead(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(['notif1']);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useMarkAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      (apiClient.put as jest.Mock).mockResolvedValue({ count: 10 });

      const { result } = renderHook(() => useMarkAllAsRead(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.put).toHaveBeenCalledWith('/notifications/mark-all-read');
    });
  });

  describe('useArchiveNotifications', () => {
    it('should archive notifications', async () => {
      (apiClient.put as jest.Mock).mockResolvedValue({ count: 2 });

      const { result } = renderHook(() => useArchiveNotifications(), {
        wrapper: createWrapper(),
      });

      const notificationIds = ['notif1', 'notif2'];
      result.current.mutate(notificationIds);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.put).toHaveBeenCalledWith('/notifications/archive', {
        notificationIds,
      });
    });
  });

  describe('useDeleteNotification', () => {
    it('should delete a notification', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({ count: 1 });

      const { result } = renderHook(() => useDeleteNotification(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('notif1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.delete).toHaveBeenCalledWith('/notifications/notif1');
    });
  });

  describe('useNotificationServices', () => {
    it('should fetch notification services', async () => {
      const mockServices = [
        {
          id: 'service1',
          name: 'Gmail',
          icon: 'Mail',
          color: 'bg-blue-500',
          enabled: true,
          connected: true,
          category: 'Work',
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue(mockServices);

      const { result } = renderHook(() => useNotificationServices(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockServices);
      expect(apiClient.get).toHaveBeenCalledWith('/notifications/services');
    });
  });

  describe('useCreateNotificationService', () => {
    it('should create a notification service', async () => {
      const mockService = {
        id: 'service1',
        name: 'Slack',
        category: 'Work',
        icon: 'Slack',
        color: 'bg-purple-500',
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockService);

      const { result } = renderHook(() => useCreateNotificationService(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        name: 'Slack',
        category: 'Work',
        icon: 'Slack',
        color: 'bg-purple-500',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.post).toHaveBeenCalledWith('/notifications/services', {
        name: 'Slack',
        category: 'Work',
        icon: 'Slack',
        color: 'bg-purple-500',
      });
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate queries on mark as read', async () => {
      (apiClient.put as jest.Mock).mockResolvedValue({ count: 1 });

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useMarkAsRead(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(['notif1']);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining(['notifications']),
      });
    });

    it('should invalidate services on create', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({ id: 'service1' });

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateNotificationService(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        name: 'Teams',
        category: 'Work',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining(['notifications', 'services']),
      });
    });
  });
});

