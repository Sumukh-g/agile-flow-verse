import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

/**
 * Users Service
 * 
 * Handles user management operations including:
 * - Listing tenant users
 * - Getting user details
 * - Updating user information
 * - Managing user status (activate/deactivate)
 * - Resetting passwords
 * - Getting user statistics
 * 
 * All operations are tenant-scoped for security.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all users for a tenant
   * Returns basic user information with role and status
   * 
   * @param tenantId - The tenant ID to filter users
   * @returns Array of users with their roles and status
   */
  async getTenantUsers(tenantId: string) {
    // Get users that belong to this tenant via UserTenant or legacy tenantId
    const users = await this.prisma.tx.user.findMany({
      where: {
        OR: [
          { tenantId },
          { userTenants: { some: { tenantId } } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        userTenants: {
          where: { tenantId },
          select: {
            role: true,
            joinedAt: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Transform to include role and calculate status
    const transformedUsers = users.map((user) => {
      const userTenant = user.userTenants[0];
      const role = userTenant?.role || 'member';
      
      // Calculate last active (simplified - in production, track this separately)
      const lastActive = user.updatedAt;
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Determine status based on activity (simplified logic)
      let status: 'active' | 'inactive' | 'pending' = 'active';
      if (daysSinceUpdate > 30) {
        status = 'inactive';
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        status,
        lastActive: this.formatRelativeTime(lastActive),
        createdAt: user.createdAt,
      };
    });

    return { users: transformedUsers };
  }

  /**
   * Get detailed user information
   * Includes project and task counts
   * 
   * @param tenantId - The tenant ID
   * @param userId - The user ID to get details for
   * @returns Detailed user information
   */
  async getUserDetails(tenantId: string, userId: string) {
    // Verify user belongs to tenant
    const user = await this.prisma.tx.user.findFirst({
      where: {
        id: userId,
        OR: [
          { tenantId },
          { userTenants: { some: { tenantId } } },
        ],
      },
      include: {
        userTenants: {
          where: { tenantId },
          select: {
            role: true,
            joinedAt: true,
          },
        },
        projectMembers: {
          where: {
            project: { tenantId },
          },
          select: {
            projectId: true,
          },
        },
        taskAssignees: {
          where: {
            task: {
              tenantId,
              deletedAt: null,
            },
          },
          select: {
            taskId: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userTenant = user.userTenants[0];
    const role = userTenant?.role || 'member';

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      status: 'active', // Simplified - track separately in production
      lastActive: this.formatRelativeTime(user.updatedAt),
      projects: user.projectMembers.length,
      tasks: user.taskAssignees.length,
      joinedAt: userTenant?.joinedAt || user.createdAt,
      createdAt: user.createdAt,
    };
  }

  /**
   * Get workspace statistics for admin dashboard
   * Includes user counts, project counts, task counts, and storage usage
   * 
   * @param tenantId - The tenant ID
   * @returns Workspace statistics
   */
  async getWorkspaceStats(tenantId: string) {
    // Get all statistics in parallel for performance
    const [
      userCount,
      activeUserCount,
      projectCount,
      activeProjectCount,
      taskCount,
      completedTaskCount,
    ] = await Promise.all([
      // Total users
      this.prisma.tx.user.count({
        where: {
          OR: [
            { tenantId },
            { userTenants: { some: { tenantId } } },
          ],
        },
      }),
      // Active users (updated in last 30 days)
      this.prisma.tx.user.count({
        where: {
          OR: [
            { tenantId },
            { userTenants: { some: { tenantId } } },
          ],
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Total projects
      this.prisma.tx.project.count({
        where: {
          tenantId,
          deletedAt: null,
        },
      }),
      // Active projects (not archived)
      this.prisma.tx.project.count({
        where: {
          tenantId,
          deletedAt: null,
          status: {
            not: 'archived',
          },
        },
      }),
      // Total tasks
      this.prisma.tx.task.count({
        where: {
          tenantId,
          deletedAt: null,
        },
      }),
      // Completed tasks
      this.prisma.tx.task.count({
        where: {
          tenantId,
          deletedAt: null,
          status: 'done',
        },
      }),
    ]);

    // Calculate storage usage (simplified - in production, track actual file sizes)
    const storageUsed = 0; // TODO: Calculate from attachments
    const storageLimit = 10; // GB - should come from plan/subscription

    // Calculate API calls (simplified - in production, track from logs)
    const apiCalls = 0; // TODO: Track from audit logs
    const apiLimit = 50000; // Should come from plan/subscription

    return {
      totalUsers: userCount,
      activeUsers: activeUserCount,
      totalProjects: projectCount,
      activeProjects: activeProjectCount,
      totalTasks: taskCount,
      completedTasks: completedTaskCount,
      storageUsed,
      storageLimit,
      apiCalls,
      apiLimit,
    };
  }

  /**
   * Update user information
   * Only allows updating name and email (for now)
   * 
   * @param tenantId - The tenant ID
   * @param userId - The user ID to update
   * @param data - Update data
   * @returns Updated user
   */
  async updateUser(tenantId: string, userId: string, data: { name?: string; email?: string }) {
    // Verify user belongs to tenant
    const user = await this.prisma.tx.user.findFirst({
      where: {
        id: userId,
        OR: [
          { tenantId },
          { userTenants: { some: { tenantId } } },
        ],
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user
    const updated = await this.prisma.tx.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
    };
  }

  /**
   * Reset user password
   * Generates a temporary password (in production, send via email)
   * 
   * @param tenantId - The tenant ID
   * @param userId - The user ID to reset password for
   * @returns Temporary password (in production, don't return this)
   */
  async resetUserPassword(tenantId: string, userId: string) {
    // Verify user belongs to tenant
    const user = await this.prisma.tx.user.findFirst({
      where: {
        id: userId,
        OR: [
          { tenantId },
          { userTenants: { some: { tenantId } } },
        ],
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update password
    await this.prisma.tx.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // In production, send password via email instead of returning it
    return {
      message: 'Password reset successfully',
      tempPassword, // Remove this in production
    };
  }

  /**
   * Format relative time (e.g., "2 minutes ago")
   * 
   * @param date - The date to format
   * @returns Formatted relative time string
   */
  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return 'Over 30 days ago';
  }
}

