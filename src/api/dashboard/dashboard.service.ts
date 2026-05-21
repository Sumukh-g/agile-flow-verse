import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';
import { CacheKeys, CacheTTL } from '../common/cache/cache-keys';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async getDashboardData(tenantId: string, userId: string) {
    const cacheKey = CacheKeys.dashboard(tenantId, userId);

    // Try to get from cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.logger.debug(`Dashboard cache hit for tenant ${tenantId}, user ${userId}`);
      return cached;
    }

    // Get user's accessible project IDs and admin status
    const { projectIds: accessibleProjectIds, isTenantAdmin } = await this.getAccessibleProjectIds(tenantId, userId);

    const [
      recentTasks,
      upcomingTasks,
      projectStats,
      taskStats,
      crmStats,
      recentActivity,
      notifications,
      analytics,
    ] = await Promise.all([
      this.getRecentTasks(tenantId, userId, accessibleProjectIds, isTenantAdmin),
      this.getUpcomingTasks(tenantId, userId, accessibleProjectIds, isTenantAdmin),
      this.getProjectStats(tenantId, accessibleProjectIds, isTenantAdmin),
      this.getTaskStats(tenantId, accessibleProjectIds, isTenantAdmin),
      this.getCrmStats(tenantId, accessibleProjectIds, isTenantAdmin),
      this.getRecentActivity(tenantId, userId, accessibleProjectIds, isTenantAdmin),
      this.getNotifications(tenantId, userId),
      this.getAnalytics(tenantId, accessibleProjectIds, isTenantAdmin),
    ]);

    const dashboardData = {
      recentTasks,
      upcomingTasks,
      projectStats,
      taskStats,
      crmStats,
      analytics,
      recentActivity,
      notifications,
      timestamp: new Date().toISOString(),
    };

    // Cache for 30 seconds (TTL from CacheTTL.DASHBOARD)
    await this.cache.set(cacheKey, dashboardData, CacheTTL.DASHBOARD);

    this.logger.log(`Dashboard data fetched for tenant ${tenantId}: ${taskStats.total} tasks, ${crmStats.totalProjects} CRM projects`);

    return dashboardData;
  }

  /**
   * Get all valid project IDs for a tenant
   * This helper ensures we only query tasks from existing projects,
   * preventing orphaned tasks (tasks with invalid projectIds) from appearing
   * 
   * @param tenantId - The tenant ID
   * @returns Array of valid project IDs
   */
  private async getValidProjectIds(tenantId: string): Promise<string[]> {
    const validProjects = await this.prisma.tx.project.findMany({
      where: { tenantId, deletedAt: null }, // Exclude deleted projects
      select: { id: true },
    });
    return validProjects.map(p => p.id);
  }

  /**
   * Get user's accessible project IDs (projects they created or are members of)
   * Returns an object with projectIds array and isTenantAdmin flag
   * This allows us to distinguish between "no projects" (show nothing) and "tenant admin" (show all)
   * 
   * @param tenantId - The tenant ID
   * @param userId - The user ID
   * @returns Object with projectIds array and isTenantAdmin boolean flag
   */
  private async getAccessibleProjectIds(tenantId: string, userId: string): Promise<{ projectIds: string[]; isTenantAdmin: boolean }> {
    // Check if user is tenant admin/owner - they can see all projects
    const isTenantAdmin = await this.prisma.tx.roleAssignment.findFirst({
      where: {
        tenantId,
        userId,
        role: { permissions: { hasSome: ['tenant.admin', 'tenant.owner'] } },
      },
      select: { id: true },
    });

    if (isTenantAdmin) {
      // Tenant admins can see all projects - return empty array with flag set to true
      return { projectIds: [], isTenantAdmin: true };
    }

    // Optimized: Get both created and member projects in parallel, then filter deleted in single query
    const [createdProjects, memberProjects] = await Promise.all([
      this.prisma.tx.project.findMany({
        where: { tenantId, createdBy: userId, deletedAt: null },
        select: { id: true },
      }),
      this.prisma.tx.projectMember.findMany({
        where: { tenantId, userId },
        select: { projectId: true },
      }),
    ]);

    // Get all unique member project IDs
    const memberProjectIds = [...new Set(memberProjects.map(m => m.projectId))];
    
    // Single query to get valid (non-deleted) member projects
    const validMemberProjects = memberProjectIds.length > 0
      ? await this.prisma.tx.project.findMany({
          where: { 
            id: { in: memberProjectIds },
            tenantId,
            deletedAt: null 
          },
          select: { id: true },
        })
      : [];

    // Combine and deduplicate
    const projectIds = new Set<string>();
    createdProjects.forEach(p => projectIds.add(p.id));
    validMemberProjects.forEach(p => projectIds.add(p.id));

    return { projectIds: Array.from(projectIds), isTenantAdmin: false };
  }

  /**
   * Build an OR filter that includes both project-scoped tasks AND personal tasks (projectId: null).
   * Personal tasks belong to the tenant and are always visible to their creator — they must not be
   * silently excluded by a projectId allowlist filter.
   */
  private buildTaskProjectFilter(
    tenantId: string,
    accessibleProjectIds: string[],
    isTenantAdmin: boolean,
    validProjectIds?: string[],
  ): any {
    // Always include personal tasks (projectId: null) for this tenant
    const personalTaskFilter = { tenantId, projectId: null };

    if (isTenantAdmin && accessibleProjectIds.length === 0) {
      // Admin with no explicit list → use validProjectIds (non-deleted projects)
      const ids = validProjectIds ?? [];
      if (ids.length === 0) return personalTaskFilter; // only personal tasks
      return { tenantId, OR: [{ projectId: { in: ids } }, { projectId: null }] };
    }

    if (accessibleProjectIds.length > 0) {
      return { tenantId, OR: [{ projectId: { in: accessibleProjectIds } }, { projectId: null }] };
    }

    // No project access, no admin — still show personal tasks
    return personalTaskFilter;
  }

  /**
   * Get recent tasks from accessible projects only
   * Personal tasks (projectId: null) are always included.
   */
  async getRecentTasks(tenantId: string, userId: string, accessibleProjectIds: string[], isTenantAdmin: boolean) {
    let validProjectIds: string[] | undefined;
    if (isTenantAdmin && accessibleProjectIds.length === 0) {
      validProjectIds = await this.getValidProjectIds(tenantId);
    }

    const where = this.buildTaskProjectFilter(tenantId, accessibleProjectIds, isTenantAdmin, validProjectIds);

    return this.prisma.tx.task.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true },
        },
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });
  }

  /**
   * Get upcoming tasks assigned to the user.
   * Personal tasks (projectId: null) are always included.
   */
  async getUpcomingTasks(tenantId: string, userId: string, accessibleProjectIds: string[], isTenantAdmin: boolean) {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    let validProjectIds: string[] | undefined;
    if (isTenantAdmin && accessibleProjectIds.length === 0) {
      validProjectIds = await this.getValidProjectIds(tenantId);
    }

    const projectFilter = this.buildTaskProjectFilter(tenantId, accessibleProjectIds, isTenantAdmin, validProjectIds);

    return this.prisma.tx.task.findMany({
      where: {
        ...projectFilter,
        assignees: { some: { userId } },
        dueDate: { gte: today, lte: nextWeek },
        status: { not: 'done' },
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });
  }

  /**
   * Get project statistics
   * If user has no accessible projects and is not a tenant admin, return zeros
   */
  async getProjectStats(tenantId: string, accessibleProjectIds: string[], isTenantAdmin: boolean) {
    // If user has no accessible projects and is not a tenant admin, return zeros
    if (accessibleProjectIds.length === 0 && !isTenantAdmin) {
      return {
        total: 0,
        active: 0,
        completed: 0,
        onHold: 0,
      };
    }

    const where: any = { 
      tenantId,
      deletedAt: null, // Exclude soft-deleted projects from counts
    };
    
    // If user has accessible projects, filter by them
    if (accessibleProjectIds.length > 0) {
      where.id = { in: accessibleProjectIds };
    }
    // If isTenantAdmin is true and accessibleProjectIds is empty, show all (no id filter)

    const [total, active, completed, onHold] = await Promise.all([
      this.prisma.tx.project.count({ where }),
      this.prisma.tx.project.count({ where: { ...where, status: 'active' } }),
      this.prisma.tx.project.count({ where: { ...where, status: 'completed' } }),
      this.prisma.tx.project.count({ where: { ...where, status: 'on-hold' } }),
    ]);

    return {
      total,
      active,
      completed,
      onHold,
    };
  }

  /**
   * Get task statistics
   * If user has no accessible projects and is not a tenant admin, return zeros
   */
  async getTaskStats(tenantId: string, accessibleProjectIds: string[], isTenantAdmin: boolean) {
    try {
      let validProjectIds: string[] | undefined;
      if (isTenantAdmin && accessibleProjectIds.length === 0) {
        validProjectIds = await this.getValidProjectIds(tenantId);
      }

      // Personal tasks (projectId: null) are always counted — they belong to this tenant.
      const baseWhere = this.buildTaskProjectFilter(tenantId, accessibleProjectIds, isTenantAdmin, validProjectIds);

      const [total, todo, inProgress, done, overdue] = await Promise.all([
        this.prisma.tx.task.count({ where: baseWhere }),
        this.prisma.tx.task.count({ where: { ...baseWhere, status: 'todo' } }),
        this.prisma.tx.task.count({ where: { ...baseWhere, status: 'in-progress' } }),
        this.prisma.tx.task.count({ where: { ...baseWhere, status: 'done' } }),
        this.prisma.tx.task.count({
          where: { ...baseWhere, dueDate: { lt: new Date() }, status: { not: 'done' } },
        }),
      ]);

      this.logger.log(`Task stats for tenant ${tenantId}: total=${total}, todo=${todo}, inProgress=${inProgress}, done=${done}, overdue=${overdue}`);

      return { total, todo, inProgress, done, overdue };
    } catch (error) {
      this.logger.error(`Error fetching task stats for tenant ${tenantId}:`, error);
      return { total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 };
    }
  }

  /**
   * Get CRM statistics
   * If user has no accessible projects and is not a tenant admin, return zeros
   * Note: CRM projects are separate from regular projects, so we only filter by tenant
   */
  async getCrmStats(tenantId: string, accessibleProjectIds: string[], isTenantAdmin: boolean) {
    try {
      // If user has no accessible projects and is not a tenant admin, return zeros
      // This ensures new users don't see CRM data from other users in the same tenant
      // (In a proper multi-tenant setup, each user should have their own tenant, but we're being defensive)
      if (accessibleProjectIds.length === 0 && !isTenantAdmin) {
        this.logger.debug(`CRM stats for tenant ${tenantId}: User has no accessible projects, returning zeros`);
        return {
          totalProjects: 0,
          totalClients: 0,
          totalDeals: 0,
          activeProjects: 0,
        };
      }

      // CRM projects are separate from regular projects, but we should still filter by tenant
      // For tenant admins or users with projects, show all CRM data for tenant
      const [totalProjects, totalClients, totalDeals, activeProjects] = await Promise.all([
        this.prisma.tx.crmProject.count({ where: { tenantId } }),
        this.prisma.tx.crmClient.count({ where: { tenantId } }),
        this.prisma.tx.crmDeal.count({ where: { tenantId } }),
        this.prisma.tx.crmProject.count({ 
          where: { 
            tenantId,
            status: { in: ['active', 'in-progress', 'Active', 'ACTIVE'] }
          } 
        }),
      ]);

      this.logger.debug(`CRM stats for tenant ${tenantId}: projects=${totalProjects}, clients=${totalClients}, deals=${totalDeals}, active=${activeProjects}`);

      return {
        totalProjects,
        totalClients,
        totalDeals,
        activeProjects,
      };
    } catch (error) {
      this.logger.error(`Error fetching CRM stats for tenant ${tenantId}:`, error);
      // Return zeros on error to prevent dashboard from breaking
      return {
        totalProjects: 0,
        totalClients: 0,
        totalDeals: 0,
        activeProjects: 0,
      };
    }
  }

  /**
   * Get analytics data for the dashboard widgets.
   * Personal tasks (projectId: null) are always included in counts — they are real
   * work the user created and must not be hidden simply because they lack a project.
   */
  async getAnalytics(tenantId: string, accessibleProjectIds: string[], isTenantAdmin: boolean) {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let validProjectIds: string[] | undefined;
    if (isTenantAdmin && accessibleProjectIds.length === 0) {
      validProjectIds = await this.getValidProjectIds(tenantId);
    }

    // Task filter that always includes personal tasks (projectId: null)
    const baseWhere = this.buildTaskProjectFilter(tenantId, accessibleProjectIds, isTenantAdmin, validProjectIds);

    // Project filter is purely project-scoped (no null concept for projects)
    const projectWhere: any = { tenantId, deletedAt: null };
    if (accessibleProjectIds.length > 0) {
      projectWhere.id = { in: accessibleProjectIds };
    } else if (isTenantAdmin && validProjectIds && validProjectIds.length > 0) {
      projectWhere.id = { in: validProjectIds };
    }

    const [
      tasksCreatedLast7Days,
      tasksCreatedLast30Days,
      projectsCreatedLast30Days,
      completionRate,
    ] = await Promise.all([
      this.prisma.tx.task.count({ where: { ...baseWhere, createdAt: { gte: last7Days } } }),
      this.prisma.tx.task.count({ where: { ...baseWhere, createdAt: { gte: last30Days } } }),
      this.prisma.tx.project.count({ where: { ...projectWhere, createdAt: { gte: last30Days } } }),
      this.prisma.tx.task.aggregate({ where: baseWhere, _count: { id: true } }).then(async (total) => {
        if (total._count.id === 0) return 0;
        const completed = await this.prisma.tx.task.count({ where: { ...baseWhere, status: 'done' } });
        return Math.round((completed / total._count.id) * 100);
      }),
    ]);

    return { tasksCreatedLast7Days, tasksCreatedLast30Days, projectsCreatedLast30Days, completionRate };
  }

  /**
   * Get recent activity logs
   * If user has no accessible projects and is not a tenant admin, return empty array
   * For now, we filter by userId to show only the user's own activity
   */
  async getRecentActivity(tenantId: string, userId: string, accessibleProjectIds: string[], isTenantAdmin: boolean) {
    // If user has no accessible projects and is not a tenant admin, return empty array
    if (accessibleProjectIds.length === 0 && !isTenantAdmin) {
      return [];
    }

    // Filter activity logs by user's actions
    // For tenant admins, show all tenant activity; for regular users, show only their own activity
    const where: any = { tenantId };
    
    if (!isTenantAdmin) {
      // Regular users only see their own activity
      where.userId = userId;
    }
    // If isTenantAdmin is true, show all tenant activity (no userId filter)
    
    return this.prisma.tx.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getNotifications(tenantId: string, userId: string) {
    return this.prisma.tx.notification.findMany({
      where: {
        tenantId,
        userId,
        read: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }
}




