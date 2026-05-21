import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Project Permissions Service
 * 
 * Provides role-based access control (RBAC) for project operations.
 * Roles:
 * - owner: Full control (can do everything)
 * - admin: Can manage members and settings, create/edit/delete resources
 * - member: Can create/edit/delete resources, but cannot manage members
 * - viewer: Read-only access (cannot create/edit/delete)
 */
@Injectable()
export class ProjectPermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user's role in a project
   * Returns: 'owner' | 'admin' | 'member' | 'viewer' | null
   * null means user has no access (or is tenant admin)
   */
  async getUserProjectRole(
    tenantId: string,
    userId: string,
    projectId: string,
  ): Promise<'owner' | 'admin' | 'member' | 'viewer' | 'tenant_admin' | null> {
    // Look up the project by ID only — projects have globally unique CUIDs.
    // Do NOT filter by tenantId here: the user may be a cross-tenant member
    // (e.g. their JWT tenantId differs from the project's tenantId).
    const project = await this.prisma.tx.project.findFirst({
      where: { id: projectId },
      select: { createdBy: true, tenantId: true },
    });

    if (!project) {
      return null;
    }

    if (project.createdBy === userId || String(project.createdBy) === String(userId)) {
      return 'owner';
    }

    // Check if user is tenant admin/owner in the project's actual tenant
    const projectTenantId = project.tenantId;
    const isTenantAdmin = await this.prisma.tx.roleAssignment.findFirst({
      where: {
        tenantId: projectTenantId,
        userId,
        role: { permissions: { hasSome: ['tenant.admin', 'tenant.owner'] } },
      },
      select: { id: true },
    });

    if (isTenantAdmin) {
      return 'tenant_admin';
    }

    // Check project membership — no tenantId filter so cross-tenant members are found
    const member = await this.prisma.tx.projectMember.findFirst({
      where: { projectId, userId },
      select: { role: true },
    });

    if (!member) {
      return null;
    }

    return (member.role as 'owner' | 'admin' | 'member' | 'viewer') || null;
  }

  /**
   * Check if user can read project (has any access)
   */
  async ensureCanReadProject(
    tenantId: string,
    userId: string,
    projectId: string,
  ): Promise<void> {
    const role = await this.getUserProjectRole(tenantId, userId, projectId);
    if (!role) {
      throw new ForbiddenException('Not authorized to access this project');
    }
  }

  /**
   * Check if user can write to project (create/edit/delete resources)
   * Viewers are NOT allowed to write
   */
  async ensureCanWriteProject(
    tenantId: string,
    userId: string,
    projectId: string,
  ): Promise<void> {
    const role = await this.getUserProjectRole(tenantId, userId, projectId);
    
    if (!role) {
      throw new ForbiddenException('Not authorized to access this project');
    }

    if (role === 'viewer') {
      throw new ForbiddenException('Viewers have read-only access. You cannot create, edit, or delete resources.');
    }

    // owner, admin, member, and tenant_admin can all write
  }

  /**
   * Check if user can manage project members
   * Only owner, admin, and tenant_admin can manage members
   */
  async ensureCanManageProjectMembers(
    tenantId: string,
    userId: string,
    projectId: string,
  ): Promise<void> {
    const role = await this.getUserProjectRole(tenantId, userId, projectId);
    
    if (!role) {
      throw new ForbiddenException('Not authorized to access this project');
    }

    if (role !== 'owner' && role !== 'admin' && role !== 'tenant_admin') {
      throw new ForbiddenException('Only project owners and admins can manage members');
    }
  }

  /**
   * Check if user can manage project settings
   * Only owner, admin, and tenant_admin can manage settings
   */
  async ensureCanManageProjectSettings(
    tenantId: string,
    userId: string,
    projectId: string,
  ): Promise<void> {
    const role = await this.getUserProjectRole(tenantId, userId, projectId);
    
    if (!role) {
      throw new ForbiddenException('Not authorized to access this project');
    }

    if (role !== 'owner' && role !== 'admin' && role !== 'tenant_admin') {
      throw new ForbiddenException('Only project owners and admins can manage project settings');
    }
  }
}

