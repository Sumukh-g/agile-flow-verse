import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureCanAccessProject(tenantId: string, userId: string, projectId: string) {
    const member = await this.prisma.tx.projectMember.findFirst({
      where: { tenantId, projectId, userId },
      select: { id: true },
    });
    if (!member) {
      // Tenant admins/owners can bypass - check role assignments
      const ra = await this.prisma.tx.roleAssignment.findFirst({
        where: { tenantId, userId, role: { permissions: { hasSome: ['tenant.admin', 'tenant.owner'] } } },
        select: { id: true },
      });
      if (!ra) throw new ForbiddenException('Not a project member');
    }
  }

  async create(tenantId: string, userId: string, data: any) {
    return this.prisma.tx.project.create({
      data: {
        ...data,
        tenantId,
        createdBy: userId,
      },
    });
  }

  async list(tenantId: string, cursor?: any, limit = 25, sort = { createdAt: 'desc' as const }) {
    const take = Math.min(Math.max(limit, 1), 100);
    const where = { tenantId };
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
    await this.ensureCanAccessProject(tenantId, userId, id);
    const proj = await this.prisma.tx.project.findFirst({ where: { id, tenantId } });
    if (!proj) throw new NotFoundException('Project not found');
    return proj;
  }

  async update(tenantId: string, userId: string, id: string, data: any) {
    await this.ensureCanAccessProject(tenantId, userId, id);
    return this.prisma.tx.project.update({ where: { id }, data });
  }

  async remove(tenantId: string, userId: string, id: string) {
    await this.ensureCanAccessProject(tenantId, userId, id);
    await this.prisma.tx.project.delete({ where: { id } });
    return { ok: true };
  }
} 