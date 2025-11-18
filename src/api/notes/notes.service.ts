import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureProjectAccess(tenantId: string, userId: string, projectId: string) {
    // Check if user is project creator
    const project = await this.prisma.tx.project.findFirst({ where: { id: projectId, tenantId } });
    if (project && project.createdBy === userId) {
      return; // Creator has access
    }
    
    const isMember = await this.prisma.tx.projectMember.findFirst({ where: { tenantId, userId, projectId } });
    if (!isMember) {
      const hasAdmin = await this.prisma.tx.roleAssignment.findFirst({
        where: { tenantId, userId, role: { permissions: { hasSome: ['tenant.admin', 'tenant.owner'] } } },
      });
      if (!hasAdmin) throw new ForbiddenException('Not authorized for this project');
    }
  }

  async create(tenantId: string, userId: string, dto: any) {
    await this.ensureProjectAccess(tenantId, userId, dto.projectId);
    return this.prisma.tx.note.create({
      data: {
        title: dto.title,
        content: dto.content,
        projectId: dto.projectId,
        parentId: dto.parentId ?? null,
        tenantId,
      },
    });
  }

  async list(tenantId: string, projectId: string | undefined, cursor?: any, limit = 25) {
    const take = Math.min(Math.max(limit, 1), 100);
    const where: any = { tenantId };
    if (projectId) {
      where.projectId = projectId;
    }
    const items = await this.prisma.tx.note.findMany({
      where,
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor.id }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    });
    const nextCursor = items.length > take ? { id: items[take - 1].id } : null;
    return {
      items: items.slice(0, take),
      nextCursor: nextCursor ? Buffer.from(JSON.stringify(nextCursor), 'utf8').toString('base64url') : null,
    };
  }

  async get(tenantId: string, userId: string, id: string) {
    const note = await this.prisma.tx.note.findFirst({ where: { id, tenantId } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.projectId) {
      await this.ensureProjectAccess(tenantId, userId, note.projectId);
    }
    return note;
  }

  async update(tenantId: string, userId: string, id: string, dto: any) {
    const note = await this.prisma.tx.note.findFirst({ where: { id, tenantId } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.projectId) {
      await this.ensureProjectAccess(tenantId, userId, note.projectId);
    }
    return this.prisma.tx.note.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        ...(dto.tags && { tags: dto.tags }),
      },
    });
  }

  async delete(tenantId: string, userId: string, id: string) {
    const note = await this.prisma.tx.note.findFirst({ where: { id, tenantId } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.projectId) {
      await this.ensureProjectAccess(tenantId, userId, note.projectId);
    }
    return this.prisma.tx.note.delete({ where: { id } });
  }
} 