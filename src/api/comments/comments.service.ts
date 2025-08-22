import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, userId: string, noteId: string, content: string) {
    const note = await this.prisma.tx.note.findFirst({ where: { id: noteId, tenantId } });
    if (!note) throw new NotFoundException('Note not found');

    return this.prisma.tx.comment.create({
      data: {
        tenantId,
        noteId,
        content,
        createdBy: userId,
      },
    });
  }
} 