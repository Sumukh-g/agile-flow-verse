import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  private async ensureCanAccessProject(tenantId: string, userId: string, projectId: string) {
    console.log('[PROJECT DEBUG] ensureCanAccessProject() called:', { projectId, userId, tenantId });
    
    // First check if user is the creator (double-check for safety)
    const proj = await this.prisma.tx.project.findFirst({
      where: { id: projectId, tenantId },
      select: { createdBy: true },
    });
    
    if (proj && (proj.createdBy === userId || String(proj.createdBy) === String(userId))) {
      console.log('[PROJECT DEBUG] User is creator in ensureCanAccessProject, allowing');
      return; // Creator always has access
    }
    
    // Check project membership
    const member = await this.prisma.tx.projectMember.findFirst({
      where: { tenantId, projectId, userId },
      select: { id: true },
    });
    
    if (member) {
      console.log('[PROJECT DEBUG] User is project member, allowing');
      return;
    }
    
    // Tenant admins/owners can bypass - check role assignments
    const ra = await this.prisma.tx.roleAssignment.findFirst({
      where: { tenantId, userId, role: { permissions: { hasSome: ['tenant.admin', 'tenant.owner'] } } },
      select: { id: true },
    });
    
    if (ra) {
      console.log('[PROJECT DEBUG] User is tenant admin/owner, allowing');
      return;
    }
    
    console.log('[PROJECT DEBUG] Access denied - user is not creator, member, or admin');
    throw new ForbiddenException('Not a project member');
  }

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
    
    console.log('[PROJECT DEBUG] list() called:', { userId, tenantId, userIdType: typeof userId });
    
    // Get project IDs where user is a member
    const memberProjects = await this.prisma.tx.projectMember.findMany({
      where: { tenantId, userId },
      select: { projectId: true },
    });
    const memberProjectIds = memberProjects.map(m => m.projectId);
    
    console.log('[PROJECT DEBUG] Member project IDs:', memberProjectIds);
    
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
      tenantId,
      OR: whereConditions,
    };
    
    console.log('[PROJECT DEBUG] Query where clause:', JSON.stringify(where, null, 2));
    
    const orderBy = sort;
    const items = await this.prisma.tx.project.findMany({
      where,
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor.id }, skip: 1 } : {}),
      orderBy,
    });
    
    console.log('[PROJECT DEBUG] Found projects:', items.length, 'Project IDs:', items.map(p => ({ id: p.id, createdBy: p.createdBy })));
    
    const nextCursor = items.length > take ? { id: items[take - 1].id } : null;
    return {
      items: items.slice(0, take),
      nextCursor: nextCursor ? Buffer.from(JSON.stringify(nextCursor), 'utf8').toString('base64url') : null,
    };
  }

  async get(tenantId: string, userId: string, id: string) {
    // First check if project exists
    const proj = await this.prisma.tx.project.findFirst({ where: { id, tenantId } });
    if (!proj) throw new NotFoundException('Project not found');
    
    // Debug logging
    console.log('[PROJECT DEBUG] get() called:', { projectId: id, userId, tenantId, createdBy: proj.createdBy });
    console.log('[PROJECT DEBUG] userId type:', typeof userId, 'createdBy type:', typeof proj.createdBy);
    console.log('[PROJECT DEBUG] userId === createdBy:', userId === proj.createdBy);
    console.log('[PROJECT DEBUG] userId == createdBy:', userId == proj.createdBy);
    
    // Check access - but allow if user is the creator (use == for type coercion safety)
    if (proj.createdBy === userId || String(proj.createdBy) === String(userId)) {
      console.log('[PROJECT DEBUG] User is creator, allowing access');
      // Ensure creator is added as member if not already (fix for old projects)
      const existingMember = await this.prisma.tx.projectMember.findFirst({
        where: { tenantId, projectId: id, userId },
      });
      if (!existingMember) {
        console.log('[PROJECT DEBUG] Creator not in members, adding as owner');
        // Auto-add creator as owner member
        await this.prisma.tx.projectMember.create({
          data: {
            tenantId,
            projectId: id,
            userId,
            role: 'owner',
          },
        }).catch((err) => {
          // Ignore if already exists (race condition)
          console.log('[PROJECT DEBUG] Member creation failed (likely race condition):', err.message);
        });
      }
      return proj;
    }
    
    console.log('[PROJECT DEBUG] User is not creator, checking membership');
    // Otherwise check project membership
    await this.ensureCanAccessProject(tenantId, userId, id);
    return proj;
  }

  async update(tenantId: string, userId: string, id: string, data: any) {
    // Check access (ensureCanAccessProject now handles creator check)
    await this.ensureCanAccessProject(tenantId, userId, id);
    const updated = await this.prisma.tx.project.update({ where: { id }, data });
    
    // Broadcast real-time update
    await this.realtime.broadcastProjectUpdate(tenantId, id, 'project.updated', updated);
    
    return updated;
  }

  async remove(tenantId: string, userId: string, id: string) {
    // Check access (ensureCanAccessProject now handles creator check)
    await this.ensureCanAccessProject(tenantId, userId, id);
    await this.prisma.tx.project.delete({ where: { id } });
    
    // Broadcast real-time update
    await this.realtime.broadcastProjectUpdate(tenantId, id, 'project.deleted', { id });
    
    return { ok: true };
  }
} 