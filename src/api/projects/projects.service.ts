import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ProjectPermissionsService } from '../common/project-permissions.service';
import { CacheService } from '../common/cache/cache.service';
import { AddProjectMemberDto, UpdateProjectMemberRoleDto } from './dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
    private readonly permissions: ProjectPermissionsService,
    private readonly cache: CacheService,
  ) {}


  async create(tenantId: string, userId: string, data: any) {
    const project = await this.prisma.tx.project.create({
      data: {
        ...data,
        tenantId,
        createdBy: userId, // Fixed: schema uses 'createdBy', not 'ownerId'
      },
    });

    // Automatically add creator as project member with owner role
    await this.prisma.tx.projectMember.create({
      data: {
        tenantId,
        projectId: project.id,
        userId,
        role: 'owner',
      },
    });

    // Broadcast real-time update
    await this.realtime.broadcastProjectUpdate(tenantId, project.id, 'project.created', project);

    return project;
  }

  async list(tenantId: string, userId: string, cursor?: any, limit = 25, sort = { createdAt: 'desc' as const }) {
    const take = Math.min(Math.max(limit, 1), 100);
    
    // Check if user is tenant admin/owner - they can see all projects
    const isTenantAdmin = await this.prisma.tx.roleAssignment.findFirst({
      where: { 
        tenantId, 
        userId, 
        role: { permissions: { hasSome: ['tenant.admin', 'tenant.owner'] } } 
      },
      select: { id: true },
    });
    
    if (isTenantAdmin) {
      const where: any = { 
        tenantId,
        deletedAt: null, // Exclude soft-deleted projects
      };
      const orderBy = sort;
      const items = await this.prisma.tx.project.findMany({
        where,
        take: take + 1,
        ...(cursor ? { cursor: { id: cursor.id }, skip: 1 } : {}),
        orderBy,
      });
      
      const nextCursor = items.length > take ? { id: items[take - 1].id } : null;
      return {
        items: items.slice(0, take),
        nextCursor: nextCursor ? Buffer.from(JSON.stringify(nextCursor), 'utf8').toString('base64url') : null,
      };
    }
    
    // Get all tenants the user belongs to (via UserTenant or legacy tenantId)
    // This ensures we find projects even if the JWT tenantId doesn't match
    const userTenants = await this.prisma.tx.userTenant.findMany({
      where: { userId },
      select: { tenantId: true },
    });
    const userTenantIds = userTenants.length > 0 
      ? userTenants.map(ut => ut.tenantId)
      : [tenantId]; // Fallback to JWT tenantId if no UserTenant records
    
    // Also check legacy tenantId on User table
    const user = await this.prisma.tx.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });
    if (user?.tenantId && !userTenantIds.includes(user.tenantId)) {
      userTenantIds.push(user.tenantId);
    }
    
    // Ensure JWT tenantId is included (in case user was just added to tenant)
    if (!userTenantIds.includes(tenantId)) {
      userTenantIds.push(tenantId);
    }
    
    // Get project IDs where user is a member across ALL their tenants
    const memberProjects = await this.prisma.tx.projectMember.findMany({
      where: { 
        tenantId: { in: userTenantIds }, // Query across all user's tenants
        userId,
      },
      select: { projectId: true, tenantId: true },
    });
    const memberProjectIds = memberProjects.map(m => m.projectId);
    
    // Build where clause: user is creator OR member
    // Prisma handles string comparisons, so we can use direct comparison
    const whereConditions: any[] = [
      { createdBy: userId }, // User is creator
    ];
    
    // Add member condition if user has memberships
    if (memberProjectIds.length > 0) {
      whereConditions.push({ id: { in: memberProjectIds } });
    }
    
    const where: any = {
      tenantId: { in: userTenantIds }, // Query projects from ALL user's tenants, not just JWT tenantId
      OR: whereConditions,
      deletedAt: null, // Exclude soft-deleted projects
    };
    
    const orderBy = sort;
    const items = await this.prisma.tx.project.findMany({
      where,
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor.id }, skip: 1 } : {}),
      orderBy,
    });
    
    const nextCursor = items.length > take ? { id: items[take - 1].id } : null;
    return {
      items: items.slice(0, take),
      nextCursor: nextCursor ? Buffer.from(JSON.stringify(nextCursor), 'utf8').toString('base64url') : null,
    };
  }

  async get(tenantId: string, userId: string, id: string) {
    // Look up by ID only — the user may be a cross-tenant project member whose
    // JWT tenantId differs from the project's tenantId. Never filter by tenantId here.
    const proj = await this.prisma.tx.project.findFirst({ 
      where: { id, deletedAt: null }
    });
    if (!proj) throw new NotFoundException('Project not found');
    
    // Check access - project creator always has access
    if (proj.createdBy === userId || String(proj.createdBy) === String(userId)) {
      // Ensure creator is a member record (auto-heal for projects created before membership tracking)
      await this.prisma.tx.projectMember.upsert({
        where: { tenantId_projectId_userId: { tenantId: proj.tenantId, projectId: id, userId } },
        create: { tenantId: proj.tenantId, projectId: id, userId, role: 'owner' },
        update: {},
      }).catch(() => { /* ignore race-condition conflicts */ });
      return proj;
    }
    
    // Otherwise verify membership (cross-tenant aware via fixed getUserProjectRole)
    await this.permissions.ensureCanReadProject(tenantId, userId, id);
    return proj;
  }

  async update(tenantId: string, userId: string, id: string, data: any) {
    // Check permissions - only owners/admins can update project settings
    await this.permissions.ensureCanManageProjectSettings(tenantId, userId, id);
    const updated = await this.prisma.tx.project.update({ where: { id }, data });
    
    // Broadcast real-time update
    await this.realtime.broadcastProjectUpdate(tenantId, id, 'project.updated', updated);

    // Invalidate cache
    await this.cache.invalidateProjects(tenantId, userId);
    await this.cache.invalidateDashboard(tenantId, userId);
    
    return updated;
  }

  /**
   * Soft delete a project (move to bin)
   * Projects are not permanently deleted, but moved to bin for recovery
   * 
   * @param tenantId - The tenant ID
   * @param userId - The user ID requesting deletion
   * @param id - The project ID to delete
   * @returns Success confirmation
   */
  async remove(tenantId: string, userId: string, id: string) {
    // Check permissions - only owners/admins can delete projects
    await this.permissions.ensureCanManageProjectSettings(tenantId, userId, id);
    
    // Verify project exists and belongs to tenant, and is not already deleted
    const project = await this.prisma.tx.project.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });
    
    if (!project) {
      throw new NotFoundException('Project not found or already deleted');
    }

    // Soft delete: set deletedAt timestamp instead of hard delete
    await this.prisma.tx.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    
    // Broadcast real-time update to notify clients
    await this.realtime.broadcastProjectUpdate(tenantId, id, 'project.deleted', { id });

    // Invalidate cache
    await this.cache.invalidateProjects(tenantId, userId);
    await this.cache.invalidateProjectMembership(tenantId, undefined, id);
    await this.cache.invalidateTasks(tenantId, id);
    await this.cache.invalidateDashboard(tenantId, userId);
    
    return { ok: true };
  }

  /**
   * Permanently delete a project (hard delete from bin)
   * This is irreversible and should only be called from the bin/trash section
   * 
   * @param tenantId - The tenant ID
   * @param userId - The user ID requesting permanent deletion
   * @param id - The project ID to permanently delete
   * @returns Success confirmation
   */
  async permanentDelete(tenantId: string, userId: string, id: string) {
    // Check permissions - only owners/admins can permanently delete projects
    await this.permissions.ensureCanManageProjectSettings(tenantId, userId, id);
    
    // Verify project exists, belongs to tenant, and is already soft-deleted
    const project = await this.prisma.tx.project.findFirst({
      where: { id, tenantId, deletedAt: { not: null } },
      select: { id: true },
    });
    
    if (!project) {
      throw new NotFoundException('Project not found in bin');
    }

    // Hard delete: permanently remove the project and all related data
    await this.prisma.tx.task.deleteMany({
      where: { projectId: id, tenantId },
    });

    await this.prisma.tx.projectMember.deleteMany({
      where: { projectId: id, tenantId },
    });

    await this.prisma.tx.project.delete({ where: { id } });
    
    // Broadcast real-time update
    await this.realtime.broadcastProjectUpdate(tenantId, id, 'project.permanently_deleted', { id });
    
    return { ok: true };
  }

  /**
   * Restore a soft-deleted project from bin
   * 
   * @param tenantId - The tenant ID
   * @param userId - The user ID requesting restoration
   * @param id - The project ID to restore
   * @returns Restored project
   */
  async restore(tenantId: string, userId: string, id: string) {
    // Check permissions
    await this.permissions.ensureCanManageProjectSettings(tenantId, userId, id);
    
    // Verify project exists in bin
    const project = await this.prisma.tx.project.findFirst({
      where: { id, tenantId, deletedAt: { not: null } },
    });
    
    if (!project) {
      throw new NotFoundException('Project not found in bin');
    }

    // Restore: clear deletedAt timestamp
    const restored = await this.prisma.tx.project.update({
      where: { id },
      data: { deletedAt: null },
    });
    
    // Broadcast real-time update
    await this.realtime.broadcastProjectUpdate(tenantId, id, 'project.restored', restored);
    
    return restored;
  }

  /**
   * Archive a project
   * Archived projects are hidden from normal views but can be restored
   * 
   * @param tenantId - The tenant ID
   * @param userId - The user ID requesting archive
   * @param id - The project ID to archive
   * @returns Archived project
   */
  async archive(tenantId: string, userId: string, id: string) {
    await this.permissions.ensureCanManageProjectSettings(tenantId, userId, id);
    
    const project = await this.prisma.tx.project.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const archived = await this.prisma.tx.project.update({
      where: { id },
      data: { archived: true },
    });
    
    await this.realtime.broadcastProjectUpdate(tenantId, id, 'project.archived', archived);
    
    return archived;
  }

  /**
   * Unarchive a project
   * 
   * @param tenantId - The tenant ID
   * @param userId - The user ID requesting unarchive
   * @param id - The project ID to unarchive
   * @returns Unarchived project
   */
  async unarchive(tenantId: string, userId: string, id: string) {
    await this.permissions.ensureCanManageProjectSettings(tenantId, userId, id);
    
    const project = await this.prisma.tx.project.findFirst({
      where: { id, tenantId },
    });
    
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const unarchived = await this.prisma.tx.project.update({
      where: { id },
      data: { archived: false },
    });
    
    await this.realtime.broadcastProjectUpdate(tenantId, id, 'project.unarchived', unarchived);
    
    return unarchived;
  }

  /**
   * Bulk delete projects (soft delete - move to bin)
   * 
   * @param tenantId - The tenant ID
   * @param userId - The user ID requesting bulk deletion
   * @param ids - Array of project IDs to delete
   * @returns Success confirmation with count
   */
  async bulkDelete(tenantId: string, userId: string, ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No project IDs provided');
    }

    // Check permissions for all projects
    for (const id of ids) {
      await this.permissions.ensureCanManageProjectSettings(tenantId, userId, id);
    }

    // Soft delete all projects
    const result = await this.prisma.tx.project.updateMany({
      where: {
        id: { in: ids },
        tenantId,
        deletedAt: null, // Only delete if not already deleted
      },
      data: { deletedAt: new Date() },
    });

    // Broadcast updates
    for (const id of ids) {
      await this.realtime.broadcastProjectUpdate(tenantId, id, 'project.deleted', { id });
    }

    return { ok: true, count: result.count };
  }

  /**
   * Bulk archive projects
   * 
   * @param tenantId - The tenant ID
   * @param userId - The user ID requesting bulk archive
   * @param ids - Array of project IDs to archive
   * @returns Success confirmation with count
   */
  async bulkArchive(tenantId: string, userId: string, ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No project IDs provided');
    }

    // Check permissions for all projects
    for (const id of ids) {
      await this.permissions.ensureCanManageProjectSettings(tenantId, userId, id);
    }

    // Archive all projects
    const result = await this.prisma.tx.project.updateMany({
      where: {
        id: { in: ids },
        tenantId,
        deletedAt: null, // Don't archive already deleted projects
      },
      data: { archived: true },
    });

    // Broadcast updates
    for (const id of ids) {
      await this.realtime.broadcastProjectUpdate(tenantId, id, 'project.archived', { id });
    }

    return { ok: true, count: result.count };
  }

  /**
   * Bulk unarchive projects
   * 
   * @param tenantId - The tenant ID
   * @param userId - The user ID requesting bulk unarchive
   * @param ids - Array of project IDs to unarchive
   * @returns Success confirmation with count
   */
  async bulkUnarchive(tenantId: string, userId: string, ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No project IDs provided');
    }

    // Check permissions for all projects
    for (const id of ids) {
      await this.permissions.ensureCanManageProjectSettings(tenantId, userId, id);
    }

    // Unarchive all projects
    const result = await this.prisma.tx.project.updateMany({
      where: {
        id: { in: ids },
        tenantId,
      },
      data: { archived: false },
    });

    // Broadcast updates
    for (const id of ids) {
      await this.realtime.broadcastProjectUpdate(tenantId, id, 'project.unarchived', { id });
    }

    return { ok: true, count: result.count };
  }

  /**
   * List deleted projects (for bin/trash view)
   * 
   * @param tenantId - The tenant ID
   * @param userId - The user ID
   * @returns List of deleted projects
   */
  async listDeleted(tenantId: string, userId: string) {
    // Check if user is tenant admin - they can see all deleted projects
    const isTenantAdmin = await this.prisma.tx.roleAssignment.findFirst({
      where: {
        tenantId,
        userId,
        role: { permissions: { hasSome: ['tenant.admin', 'tenant.owner'] } },
      },
      select: { id: true },
    });

    let where: any = {
      tenantId,
      deletedAt: { not: null }, // Only deleted projects
    };

    // If not tenant admin, filter by projects user created or is a member of
    if (!isTenantAdmin) {
      // Get projects user created
      const createdProjectIds = await this.prisma.tx.project.findMany({
        where: { tenantId, createdBy: userId, deletedAt: { not: null } },
        select: { id: true },
      });

      // Get projects user is a member of (even if deleted)
      const memberProjects = await this.prisma.tx.projectMember.findMany({
        where: { tenantId, userId },
        select: { projectId: true },
      });
      const memberProjectIds = memberProjects.map(m => m.projectId);

      // Build OR conditions
      const whereConditions: any[] = [];
      
      if (createdProjectIds.length > 0) {
        whereConditions.push({ id: { in: createdProjectIds.map(p => p.id) } });
      }
      
      if (memberProjectIds.length > 0) {
        // Verify these projects are actually deleted
        const deletedMemberProjects = await this.prisma.tx.project.findMany({
          where: {
            id: { in: memberProjectIds },
            tenantId,
            deletedAt: { not: null },
          },
          select: { id: true },
        });
        if (deletedMemberProjects.length > 0) {
          whereConditions.push({ id: { in: deletedMemberProjects.map(p => p.id) } });
        }
      }

      // If no conditions, return empty array
      if (whereConditions.length === 0) {
        return [];
      }

      where.OR = whereConditions;
    }
    // If tenant admin, show all deleted projects (no OR filter needed)

    const deletedProjects = await this.prisma.tx.project.findMany({
      where,
      orderBy: { deletedAt: 'desc' },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return deletedProjects;
  }

  private async ensureCanManageProject(tenantId: string, userId: string, projectId: string) {
    // Use the shared permissions service
    await this.permissions.ensureCanManageProjectMembers(tenantId, userId, projectId);
  }

  async getMembers(tenantId: string, userId: string, projectId: string) {
    // Anyone with read access can see members
    await this.permissions.ensureCanReadProject(tenantId, userId, projectId);

    const members = await this.prisma.tx.projectMember.findMany({
      where: { tenantId, projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return { members };
  }

  async addMember(tenantId: string, userId: string, projectId: string, data: AddProjectMemberDto) {
    await this.ensureCanManageProject(tenantId, userId, projectId);

    // Validate that either userId or email is provided
    if (!data.userId && !data.email) {
      throw new BadRequestException('Either userId or email must be provided');
    }

    let targetUserId: string;

    // Handle email-based invitation (Jira-style)
    if (data.email) {
      const normalizedEmail = data.email.trim().toLowerCase();
      // Find or create user by email (case-insensitive normalized)
      let targetUser = await this.prisma.tx.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      });

      if (!targetUser) {
        // User doesn't exist - create them (they'll need to set password on first login)
        targetUser = await this.prisma.tx.user.create({
          data: {
            email: normalizedEmail,
            name: normalizedEmail.split('@')[0], // Use email prefix as default name
            tenantId: null, // Will be set via UserTenant
          },
        });
      }

      targetUserId = targetUser.id;

      // Ensure user is in tenant (via UserTenant)
      const userTenant = await this.prisma.tx.userTenant.findUnique({
        where: {
          userId_tenantId: {
            userId: targetUserId,
            tenantId,
          },
        },
      });

      if (!userTenant) {
        // Add user to tenant with member role
        await this.prisma.tx.userTenant.create({
          data: {
            userId: targetUserId,
            tenantId,
            role: 'member',
            invitedBy: userId,
          },
        });
        
        // CRITICAL: Also set the user's tenantId if it's null
        // This ensures the user can log in and their JWT token has the correct tenantId
        await this.prisma.tx.user.update({
          where: { id: targetUserId },
          data: {
            tenantId: tenantId, // Set tenantId so login works correctly
          },
        });
      }
    } else if (data.userId) {
      targetUserId = data.userId;
    } else {
      throw new BadRequestException('Either userId or email must be provided');
    }

    // Verify user exists in tenant (check UserTenant or legacy tenantId)
    const targetUser = await this.prisma.tx.user.findFirst({
      where: { 
        id: targetUserId,
        OR: [
          { tenantId },
          { userTenants: { some: { tenantId } } },
        ],
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found in tenant');
    }

    // Check if already a member
    const existing = await this.prisma.tx.projectMember.findFirst({
      where: { tenantId, projectId, userId: targetUserId },
    });

    if (existing) {
      throw new ConflictException('User is already a project member');
    }

    const member = await this.prisma.tx.projectMember.create({
      data: {
        tenantId,
        projectId,
        userId: targetUserId,
        role: data.role || 'member',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Invalidate cache for both the person who added the member AND the newly added member
    // This ensures:
    // 1. The person who added sees updated member list
    // 2. The newly added member can see the project in their list
    await this.cache.invalidateProjects(tenantId, userId); // Person who added
    await this.cache.invalidateProjects(tenantId, targetUserId); // Newly added member
    await this.cache.invalidateProjectMembership(tenantId, targetUserId, projectId); // Member cache
    await this.cache.invalidateDashboard(tenantId, targetUserId); // Dashboard cache for new member

    // Broadcast real-time update
    await this.realtime.broadcastProjectUpdate(tenantId, projectId, 'project.member.added', member);

    return member;
  }

  async updateMemberRole(tenantId: string, userId: string, projectId: string, targetUserId: string, role: string) {
    await this.ensureCanManageProject(tenantId, userId, projectId);

    // Prevent changing creator's role
    const project = await this.prisma.tx.project.findFirst({
      where: { id: projectId, tenantId },
      select: { createdBy: true },
    });

    if (project && (project.createdBy === targetUserId || String(project.createdBy) === String(targetUserId))) {
      throw new BadRequestException('Cannot change project creator role');
    }

    const member = await this.prisma.tx.projectMember.update({
      where: {
        tenantId_projectId_userId: {
          tenantId,
          projectId,
          userId: targetUserId,
        },
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Broadcast real-time update
    await this.realtime.broadcastProjectUpdate(tenantId, projectId, 'project.member.updated', member);

    return member;
  }

  async removeMember(tenantId: string, userId: string, projectId: string, targetUserId: string) {
    await this.ensureCanManageProject(tenantId, userId, projectId);

    // Prevent removing the creator
    const project = await this.prisma.tx.project.findFirst({
      where: { id: projectId, tenantId },
      select: { createdBy: true },
    });

    if (project && (project.createdBy === targetUserId || String(project.createdBy) === String(targetUserId))) {
      throw new BadRequestException('Cannot remove project creator');
    }

    await this.prisma.tx.projectMember.delete({
      where: {
        tenantId_projectId_userId: {
          tenantId,
          projectId,
          userId: targetUserId,
        },
      },
    });

    // Broadcast real-time update
    await this.realtime.broadcastProjectUpdate(tenantId, projectId, 'project.member.removed', { userId: targetUserId });

    return { success: true };
  }
} 