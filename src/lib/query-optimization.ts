/**
 * React Query Optimization Configuration
 * 
 * Enterprise-grade query client configuration with optimal caching,
 * prefetching, and performance strategies.
 * 
 * @module lib/query-optimization
 */

import { QueryClient, QueryClientConfig } from '@tanstack/react-query';

/**
 * Optimal stale times for different data types
 * Based on data volatility and user expectations
 */
export const STALE_TIMES = {
  // Real-time data (notifications, live updates)
  REALTIME: 0,
  
  // Frequently changing data (tasks, boards)
  FREQUENT: 30 * 1000, // 30 seconds
  
  // Moderately changing data (projects, users)
  MODERATE: 5 * 60 * 1000, // 5 minutes
  
  // Rarely changing data (settings, configurations)
  STABLE: 30 * 60 * 1000, // 30 minutes
  
  // Static data (permissions, constants)
  STATIC: Infinity,
} as const;

/**
 * Cache times (how long to keep unused data in cache)
 */
export const CACHE_TIMES = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 15 * 60 * 1000, // 15 minutes
  LONG: 60 * 60 * 1000, // 1 hour
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;

/**
 * Retry configuration based on error type
 */
export const RETRY_CONFIG = {
  // Network errors - retry with exponential backoff
  NETWORK: {
    retry: 3,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  
  // 4xx errors - don't retry (client error)
  CLIENT_ERROR: {
    retry: false,
  },
  
  // 5xx errors - retry with backoff
  SERVER_ERROR: {
    retry: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(2000 * 2 ** attemptIndex, 10000),
  },
  
  // Timeout errors - retry once
  TIMEOUT: {
    retry: 1,
    retryDelay: 2000,
  },
} as const;

/**
 * Create optimized query client configuration
 * Implements best practices for performance and UX
 */
export function createOptimizedQueryClientConfig(): QueryClientConfig {
  return {
    defaultOptions: {
      queries: {
        // Stale time: data is fresh for this duration
        staleTime: STALE_TIMES.MODERATE,
        
        // Cache time: keep unused data in cache
        gcTime: CACHE_TIMES.MEDIUM, // Previously cacheTime
        
        // Retry configuration
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors
          if (error?.response?.status >= 400 && error?.response?.status < 500) {
            return false;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Refetch behavior
        refetchOnMount: 'always', // Always check for fresh data on mount
        refetchOnWindowFocus: false, // Don't refetch on window focus (too aggressive)
        refetchOnReconnect: true, // Refetch when network reconnects
        
        // Network mode
        networkMode: 'online', // Only run queries when online
        
        // Structural sharing: prevent unnecessary re-renders
        structuralSharing: true,
      },
      
      mutations: {
        // Retry mutations once on network errors
        retry: (failureCount, error: any) => {
          if (error?.response?.status >= 400 && error?.response?.status < 500) {
            return false;
          }
          return failureCount < 1;
        },
        
        retryDelay: 1000,
        
        // Network mode
        networkMode: 'online',
      },
    },
  };
}

/**
 * Create optimized query client instance
 * Use this instead of creating QueryClient directly
 */
export function createOptimizedQueryClient(): QueryClient {
  return new QueryClient(createOptimizedQueryClientConfig());
}

/**
 * Query key factories for type-safe cache management
 * Prevents typos and ensures consistency
 */
export const queryKeys = {
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.projects.lists(), { filters }] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
  },
  
  // Tasks
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.tasks.lists(), { filters }] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
  },
  
  // Kanban
  kanban: {
    all: ['kanban'] as const,
    columns: (projectId: string) =>
      [...queryKeys.kanban.all, 'columns', projectId] as const,
    cards: (projectId: string) =>
      [...queryKeys.kanban.all, 'cards', projectId] as const,
  },
  
  // Sprints
  sprints: {
    all: ['sprints'] as const,
    byProject: (projectId: string) =>
      [...queryKeys.sprints.all, 'project', projectId] as const,
    active: (projectId: string) =>
      [...queryKeys.sprints.byProject(projectId), 'active'] as const,
    detail: (sprintId: string) =>
      [...queryKeys.sprints.all, 'detail', sprintId] as const,
  },
  
  // Epics
  epics: {
    all: ['epics'] as const,
    byProject: (projectId: string) =>
      [...queryKeys.epics.all, 'project', projectId] as const,
    detail: (epicId: string) =>
      [...queryKeys.epics.all, 'detail', epicId] as const,
  },
  
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: (tenantId: string) =>
      [...queryKeys.dashboard.all, 'stats', tenantId] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.notifications.all, 'list', filters] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
  },
} as const;

/**
 * Prefetch query data for likely next navigation
 * Improves perceived performance
 */
export async function prefetchQuery<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: STALE_TIMES.MODERATE,
  });
}

/**
 * Optimistically update cache
 * Provides instant UI feedback
 */
export function optimisticUpdate<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  updater: (old: T | undefined) => T
): void {
  queryClient.setQueryData<T>(queryKey, updater);
}

