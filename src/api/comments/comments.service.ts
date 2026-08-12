import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectPermissionsService } from '../common/project-permissions.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: ProjectPermissionsService,
  ) {}

  /**
   * Resolve a note (tenant-scoped) and enforce the requested access level.
   *
   * - PERSONAL notes: only the creator may read/write.
   * - PROJECT notes: project RBAC applies (read for viewing comments, write
   *   for adding them).
   */
  private async assertNoteAccess(
    tenantId: string,
    userId: string,
    noteId: string,
    mode: 'read' | 'write',
  ) {
    const note = await this.prisma.tx.note.findFirst({
      where: { id: noteId, tenantId, deletedAt: null },
      select: { id: true, scope: true, projectId: true, createdById: true },
    });

    if (!note) throw new NotFoundException('Note not found');

    if (note.scope === 'PERSONAL' || !note.projectId) {
      if (note.createdById !== userId) {
        throw new ForbiddenException('Not authorized to access this personal note');
      }
      return note;
    }

    if (mode === 'write') {
      await this.permissions.ensureCanWriteProject(tenantId, userId, note.projectId);
    } else {
      await this.permissions.ensureCanReadProject(tenantId, userId, note.projectId);
    }

    return note;
  }

  async listForNote(tenantId: string, userId: string, noteId: string) {
    await this.assertNoteAccess(tenantId, userId, noteId, 'read');

    return this.prisma.tx.comment.findMany({
      where: { tenantId, noteId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async create(tenantId: string, userId: string, noteId: string, content: string) {
    const trimmed = (content ?? '').trim();
    if (!trimmed) {
      throw new BadRequestException('Comment content is required');
    }
    if (trimmed.length > 5000) {
      throw new BadRequestException('Comment must be 5000 characters or less');
    }

    await this.assertNoteAccess(tenantId, userId, noteId, 'write');

    return this.prisma.tx.comment.create({
      data: {
        tenantId,
        noteId,
        content: trimmed,
        createdBy: userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async delete(tenantId: string, userId: string, commentId: string) {
    const comment = await this.prisma.tx.comment.findFirst({
      where: { id: commentId, tenantId },
      select: { id: true, noteId: true, createdBy: true },
    });

    if (!comment || !comment.noteId) {
      throw new NotFoundException('Comment not found');
    }

    // The author can always delete their own comment; otherwise the caller
    // must have write access to the note (e.g. project admins/owners).
    if (comment.createdBy !== userId) {
      await this.assertNoteAccess(tenantId, userId, comment.noteId, 'write');
    }

    await this.prisma.tx.comment.delete({ where: { id: commentId } });
    return { ok: true };
  }
}
