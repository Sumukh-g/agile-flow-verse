/**
 * Frontend Cache Keys
 * Centralized cache key management for React Query
 */

export const cacheKeys = {
  // Tasks
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...cacheKeys.tasks.all, 'list'] as const,
    list: (query?: { projectId?: string; status?: string; priority?: string }) =>
      [...cacheKeys.tasks.lists(), query] as const,
    details: () => [...cacheKeys.tasks.all, 'detail'] as const,
    detail: (id: string) => [...cacheKeys.tasks.details(), id] as const,
    project: (projectId: string) => [...cacheKeys.tasks.all, 'project', projectId] as const,
    personal: () => [...cacheKeys.tasks.all, 'personal'] as const,
  },

  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...cacheKeys.projects.all, 'list'] as const,
    list: (query?: { search?: string; status?: string }) =>
      [...cacheKeys.projects.lists(), query] as const,
    details: () => [...cacheKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...cacheKeys.projects.details(), id] as const,
  },

  // Issues
  issues: {
    all: ['issues'] as const,
    lists: () => [...cacheKeys.issues.all, 'list'] as const,
    list: (query?: { projectId?: string; status?: string }) =>
      [...cacheKeys.issues.lists(), query] as const,
    details: () => [...cacheKeys.issues.all, 'detail'] as const,
    detail: (id: string) => [...cacheKeys.issues.details(), id] as const,
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    data: (userId: string) => [...cacheKeys.dashboard.all, userId] as const,
  },

  // User
  user: {
    all: ['user'] as const,
    profile: () => [...cacheKeys.user.all, 'profile'] as const,
    permissions: (tenantId: string) => [...cacheKeys.user.all, 'permissions', tenantId] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...cacheKeys.notifications.all, 'list'] as const,
    unread: () => [...cacheKeys.notifications.lists(), 'unread'] as const,
  },
} as const;

