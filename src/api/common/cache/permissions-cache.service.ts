/**
 * Permissions Cache Service
 * Caches user permissions with proper TTL and invalidation
 */

import { Injectable } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheKeys, CacheTTL } from './cache-keys';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsCacheService {
  constructor(
    private readonly cache: CacheService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get user's project role (cached)
   */
  async getUserProjectRole(
    tenantId: string,
    userId: string,
    projectId: string,
  ): Promise<'owner' | 'admin' | 'member' | 'viewer' | 'tenant_admin' | null> {
    const cacheKey = `${CacheKeys.userPermissions(tenantId, userId)}:project:${projectId}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        // Check if user is project creator (always has owner role)
        const project = await this.prisma.tx.project.findFirst({
          where: { id: projectId, tenantId },
          select: { createdBy: true },
        });

        if (!project) {
          return null;
        }

        if (project.createdBy === userId || String(project.createdBy) === String(userId)) {
          return 'owner';
        }

        // Check if user is tenant admin/owner
        const isTenantAdmin = await this.prisma.tx.roleAssignment.findFirst({
          where: {
            tenantId,
            userId,
            role: { permissions: { hasSome: ['tenant.admin', 'tenant.owner'] } },
          },
          select: { id: true },
        });

        if (isTenantAdmin) {
          return 'tenant_admin';
        }

        // Check project membership
        const member = await this.prisma.tx.projectMember.findFirst({
          where: { tenantId, projectId, userId },
          select: { role: true },
        });

        if (!member) {
          return null;
        }

        return (member.role as 'owner' | 'admin' | 'member' | 'viewer') || null;
      },
      CacheTTL.USER_PERMISSIONS,
    );
  }

  /**
   * Invalidate user permissions cache
   */
  async invalidateUserPermissions(tenantId: string, userId: string, projectId?: string): Promise<void> {
    if (projectId) {
      await this.cache.delete(`${CacheKeys.userPermissions(tenantId, userId)}:project:${projectId}`);
    }
    await this.cache.invalidateUserPermissions(tenantId, userId);
  }
}

