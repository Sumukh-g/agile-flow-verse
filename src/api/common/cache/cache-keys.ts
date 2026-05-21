/**
 * Cache Key Constants
 * Centralized cache key management for consistent invalidation
 */

export const CacheKeys = {
  // Dashboard
  dashboard: (tenantId: string, userId: string) => `dashboard:${tenantId}:${userId}`,
  dashboardPattern: (tenantId: string) => `dashboard:${tenantId}:*`,

  // User Permissions
  userPermissions: (tenantId: string, userId: string) => `permissions:${tenantId}:${userId}`,
  userPermissionsPattern: (tenantId: string, userId: string) => `permissions:${tenantId}:${userId}:*`,

  // Project Membership
  projectMembership: (tenantId: string, userId: string) => `project_membership:${tenantId}:${userId}`,
  projectMembershipPattern: (tenantId: string, userId: string) => `project_membership:${tenantId}:${userId}:*`,
  projectMembers: (tenantId: string, projectId: string) => `project_members:${tenantId}:${projectId}`,
  projectMembersPattern: (tenantId: string, projectId: string) => `project_members:${tenantId}:${projectId}:*`,

  // User Sessions
  userSession: (tenantId: string, userId: string) => `session:${tenantId}:${userId}`,
  userSessionPattern: (tenantId: string, userId: string) => `session:${tenantId}:${userId}:*`,

  // Tasks
  tasks: (tenantId: string, projectId?: string) => 
    projectId ? `tasks:${tenantId}:${projectId}` : `tasks:${tenantId}:all`,
  tasksPattern: (tenantId: string) => `tasks:${tenantId}:*`,

  // Projects
  projects: (tenantId: string, userId: string) => `projects:${tenantId}:${userId}`,
  projectsPattern: (tenantId: string) => `projects:${tenantId}:*`,

  // Issues
  issues: (tenantId: string, projectId?: string) => 
    projectId ? `issues:${tenantId}:${projectId}` : `issues:${tenantId}:all`,
  issuesPattern: (tenantId: string) => `issues:${tenantId}:*`,

  // Analytics
  analytics: (tenantId: string, userId: string) => `analytics:${tenantId}:${userId}`,
  analyticsPattern: (tenantId: string) => `analytics:${tenantId}:*`,
} as const;

/**
 * Cache TTL Constants (in seconds)
 */
export const CacheTTL = {
  DASHBOARD: 30, // 30 seconds
  USER_PERMISSIONS: 300, // 5 minutes
  PROJECT_MEMBERSHIP: 300, // 5 minutes
  USER_SESSION: 3600, // 1 hour
  TASKS: 60, // 1 minute
  PROJECTS: 60, // 1 minute
  ISSUES: 60, // 1 minute
  ANALYTICS: 300, // 5 minutes
} as const;

