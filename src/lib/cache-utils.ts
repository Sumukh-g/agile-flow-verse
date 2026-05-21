/**
 * Frontend Cache Utilities
 * Helpers for React Query cache invalidation and updates
 */

import { QueryClient } from '@tanstack/react-query';
import { cacheKeys } from './cache-keys';

/**
 * Invalidate all task-related queries
 */
export function invalidateTasks(queryClient: QueryClient, projectId?: string): void {
  if (projectId) {
    queryClient.invalidateQueries({ queryKey: cacheKeys.tasks.project(projectId) });
  }
  queryClient.invalidateQueries({ queryKey: cacheKeys.tasks.all });
  queryClient.invalidateQueries({ queryKey: cacheKeys.tasks.lists() });
}

/**
 * Invalidate all project-related queries
 */
export function invalidateProjects(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: cacheKeys.projects.all });
  queryClient.invalidateQueries({ queryKey: cacheKeys.projects.lists() });
}

/**
 * Invalidate all issue-related queries
 */
export function invalidateIssues(queryClient: QueryClient, projectId?: string): void {
  if (projectId) {
    queryClient.invalidateQueries({ 
      queryKey: cacheKeys.issues.list({ projectId }) 
    });
  }
  queryClient.invalidateQueries({ queryKey: cacheKeys.issues.all });
  queryClient.invalidateQueries({ queryKey: cacheKeys.issues.lists() });
}

/**
 * Invalidate dashboard cache
 */
export function invalidateDashboard(queryClient: QueryClient, userId: string): void {
  queryClient.invalidateQueries({ queryKey: cacheKeys.dashboard.data(userId) });
  queryClient.invalidateQueries({ queryKey: cacheKeys.dashboard.all });
}

/**
 * Invalidate user profile cache
 */
export function invalidateUserProfile(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: cacheKeys.user.profile() });
  queryClient.invalidateQueries({ queryKey: cacheKeys.user.all });
}

/**
 * Invalidate notifications cache
 */
export function invalidateNotifications(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: cacheKeys.notifications.all });
  queryClient.invalidateQueries({ queryKey: cacheKeys.notifications.unread() });
}

/**
 * Update task in cache optimistically
 */
export function updateTaskInCache(
  queryClient: QueryClient,
  taskId: string,
  updater: (old: unknown) => unknown,
): void {
  // Update detail query
  queryClient.setQueryData(cacheKeys.tasks.detail(taskId), updater);

  // Update in all list queries
  queryClient.setQueriesData(
    { queryKey: cacheKeys.tasks.lists() },
    (old: unknown) => {
      if (Array.isArray(old)) {
        return old.map((item: { id: string }) =>
          item.id === taskId ? updater(item) : item
        );
      }
      return old;
    },
  );
}

/**
 * Remove task from cache
 */
export function removeTaskFromCache(queryClient: QueryClient, taskId: string): void {
  queryClient.removeQueries({ queryKey: cacheKeys.tasks.detail(taskId) });
  
  // Remove from list queries
  queryClient.setQueriesData(
    { queryKey: cacheKeys.tasks.lists() },
    (old: unknown) => {
      if (Array.isArray(old)) {
        return old.filter((item: { id: string }) => item.id !== taskId);
      }
      return old;
    },
  );
}

/**
 * Add task to cache optimistically
 */
export function addTaskToCache(
  queryClient: QueryClient,
  task: unknown,
  projectId?: string,
): void {
  const queryKey = projectId
    ? cacheKeys.tasks.project(projectId)
    : cacheKeys.tasks.personal();

  queryClient.setQueryData(queryKey, (old: unknown) => {
    if (Array.isArray(old)) {
      return [...old, task];
    }
    return [task];
  });
}

