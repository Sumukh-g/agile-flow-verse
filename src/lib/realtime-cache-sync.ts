/**
 * Real-time Cache Synchronization
 * Handles targeted cache updates from WebSocket events (not full invalidation)
 */

import { QueryClient } from '@tanstack/react-query';
import { cacheKeys } from './cache-keys';
import { updateTaskInCache, addTaskToCache, removeTaskFromCache } from './cache-utils';

export interface RealtimeEventData {
  taskId?: string;
  projectId?: string;
  noteId?: string;
  event: string;
  data?: any;
  timestamp: string;
}

/**
 * Handle real-time task events with targeted cache updates
 */
export function handleTaskRealtimeEvent(
  queryClient: QueryClient,
  event: string,
  data: RealtimeEventData,
): void {
  const { taskId, projectId, data: taskData } = data;

  if (!taskId) return;

  switch (event) {
    case 'task.created':
      if (taskData) {
        // Add task to relevant caches
        addTaskToCache(queryClient, taskData, projectId);
        // Invalidate lists to show new task
        queryClient.invalidateQueries({ queryKey: cacheKeys.tasks.lists() });
      }
      break;

    case 'task.updated':
      if (taskData) {
        // Update task in cache optimistically
        updateTaskInCache(queryClient, taskId, () => taskData);
        // Also update project-specific cache if applicable
        if (projectId) {
          queryClient.setQueriesData(
            { queryKey: cacheKeys.tasks.project(projectId) },
            (old: unknown) => {
              if (Array.isArray(old)) {
                return old.map((item: { id: string }) =>
                  item.id === taskId ? taskData : item
                );
              }
              return old;
            },
          );
        }
      } else {
        // If no data provided, just invalidate the specific task
        queryClient.invalidateQueries({ queryKey: cacheKeys.tasks.detail(taskId) });
      }
      break;

    case 'task.deleted':
      removeTaskFromCache(queryClient, taskId);
      // Invalidate lists to remove deleted task
      queryClient.invalidateQueries({ queryKey: cacheKeys.tasks.lists() });
      break;
  }
}

/**
 * Handle real-time project events with targeted cache updates
 */
export function handleProjectRealtimeEvent(
  queryClient: QueryClient,
  event: string,
  data: RealtimeEventData,
): void {
  const { projectId, data: projectData } = data;

  if (!projectId) return;

  switch (event) {
    case 'project.created':
      if (projectData) {
        // Add project to cache
        queryClient.setQueryData(cacheKeys.projects.detail(projectId), projectData);
        // Invalidate lists to show new project
        queryClient.invalidateQueries({ queryKey: cacheKeys.projects.lists() });
      }
      break;

    case 'project.updated':
      if (projectData) {
        // Update project in cache
        queryClient.setQueryData(cacheKeys.projects.detail(projectId), projectData);
        // Update in lists
        queryClient.setQueriesData(
          { queryKey: cacheKeys.projects.lists() },
          (old: unknown) => {
            if (Array.isArray(old)) {
              return old.map((item: { id: string }) =>
                item.id === projectId ? projectData : item
              );
            }
            return old;
          },
        );
      } else {
        // If no data provided, just invalidate
        queryClient.invalidateQueries({ queryKey: cacheKeys.projects.detail(projectId) });
      }
      break;

    case 'project.deleted':
      // Remove from cache
      queryClient.removeQueries({ queryKey: cacheKeys.projects.detail(projectId) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: cacheKeys.projects.lists() });
      // Also invalidate related tasks
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: cacheKeys.tasks.project(projectId) });
      }
      break;

    case 'project.member.added':
    case 'project.member.updated':
    case 'project.member.removed':
      // When a member is added/updated/removed, invalidate:
      // 1. Project members list
      // 2. Projects list (so newly added members can see the project)
      // 3. Project detail (member count may have changed)
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
        queryClient.invalidateQueries({ queryKey: cacheKeys.projects.detail(projectId) });
        // CRITICAL: Invalidate projects list so newly added members can see the project
        queryClient.invalidateQueries({ queryKey: cacheKeys.projects.lists() });
        // Also invalidate dashboard (project counts may change)
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
      break;
  }
}

/**
 * Handle real-time note events with targeted cache updates
 */
export function handleNoteRealtimeEvent(
  queryClient: QueryClient,
  event: string,
  data: RealtimeEventData,
): void {
  const { noteId, projectId, data: noteData } = data;

  if (!noteId) return;

  // Note: Assuming notes have similar cache structure
  // Adjust based on actual note cache keys
  switch (event) {
    case 'note.created':
    case 'note.updated':
      if (noteData) {
        // Update note in cache if we have note cache keys
        // This is a placeholder - adjust based on actual implementation
        queryClient.invalidateQueries({ queryKey: ['notes'] });
      }
      break;

    case 'note.deleted':
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      break;
  }
}

/**
 * Debounced event handler to prevent overwhelming the UI
 */
export function createDebouncedEventHandler(
  handler: (queryClient: QueryClient, event: string, data: RealtimeEventData) => void,
  delay: number = 100,
) {
  const pendingUpdates = new Map<string, { event: string; data: RealtimeEventData; timer: NodeJS.Timeout }>();

  return (queryClient: QueryClient, event: string, data: RealtimeEventData) => {
    const key = `${event}:${data.taskId || data.projectId || data.noteId || 'unknown'}`;

    // Clear existing timer
    const existing = pendingUpdates.get(key);
    if (existing) {
      clearTimeout(existing.timer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      handler(queryClient, event, data);
      pendingUpdates.delete(key);
    }, delay);

    pendingUpdates.set(key, { event, data, timer });
  };
}

