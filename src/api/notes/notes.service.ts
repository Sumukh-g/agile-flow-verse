import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectPermissionsService } from '../common/project-permissions.service';
import { CreateNoteDto, NoteScopeDto, UpdateNoteDto } from './dto';

type ListFilters = {
  projectId?: string;
  scope?: NoteScopeDto | string;
};

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: ProjectPermissionsService,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateNoteDto) {
    const hasProject = !!dto.projectId;
    const requestedScope = dto.scope;
    const resolvedScope: NoteScopeDto = hasProject ? NoteScopeDto.PROJECT : NoteScopeDto.PERSONAL;

    if (requestedScope === NoteScopeDto.PROJECT && !hasProject) {
      throw new BadRequestException('projectId is required for PROJECT notes');
    }
    if (requestedScope === NoteScopeDto.PERSONAL && hasProject) {
      throw new BadRequestException('projectId is not allowed for PERSONAL notes');
    }

    // Check if this is an approval request
    let isApprovalRequest = false;
    try {
      if (dto.content) {
        const parsed = typeof dto.content === 'string' ? JSON.parse(dto.content) : dto.content;
        isApprovalRequest = parsed?.meta?.kind === 'approval';
      }
    } catch {
      // If parsing fails, it's not an approval request
    }

    if (resolvedScope === NoteScopeDto.PROJECT) {
      // Viewers can only create approval requests, not regular notes
      if (isApprovalRequest) {
        await this.permissions.ensureCanReadProject(tenantId, userId, dto.projectId!);
      } else {
        await this.permissions.ensureCanWriteProject(tenantId, userId, dto.projectId!);
      }
    }

    return this.prisma.tx.note.create({
      data: {
        title: dto.title,
        content: dto.content,
        scope: resolvedScope,
        projectId: dto.projectId ?? null,
        parentId: dto.parentId ?? null,
        tenantId,
        createdById: userId,
        updatedById: userId,
        tags: dto.tags ?? [],
      },
    });
  }

  async list(tenantId: string, userId: string, filters: ListFilters, cursor?: any, limit = 25) {
    const take = Math.min(Math.max(limit, 1), 100);

    const where: any = {
      tenantId,
      deletedAt: null,
    };

    const normalizedScope =
      typeof filters.scope === 'string' ? filters.scope.trim().toUpperCase() : filters.scope;

    if (filters.projectId) {
      await this.permissions.ensureCanReadProject(tenantId, userId, filters.projectId);
      where.projectId = filters.projectId;
      where.scope = NoteScopeDto.PROJECT;
    } else if (!normalizedScope || normalizedScope === NoteScopeDto.PERSONAL) {
      where.scope = NoteScopeDto.PERSONAL;
      where.createdById = userId;
    } else if (normalizedScope === NoteScopeDto.PROJECT) {
      throw new BadRequestException('projectId is required when scope=PROJECT');
    } else {
      throw new BadRequestException('Invalid scope value');
    }

    const items = await this.prisma.tx.note.findMany({
      where,
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor.id }, skip: 1 } : {}),
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    const nextCursor = items.length > take ? { id: items[take - 1].id } : null;
    return {
      items: items.slice(0, take),
      nextCursor: nextCursor ? Buffer.from(JSON.stringify(nextCursor), 'utf8').toString('base64url') : null,
    };
  }

  async get(tenantId: string, userId: string, id: string) {
    const note = await this.prisma.tx.note.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!note) throw new NotFoundException('Note not found');

    if (note.scope === NoteScopeDto.PERSONAL) {
      if (note.createdById !== userId) {
        throw new ForbiddenException('Not authorized to access this personal note');
      }
      return note;
    }

    if (note.projectId) {
      await this.permissions.ensureCanReadProject(tenantId, userId, note.projectId);
    }

    return note;
  }

  async update(tenantId: string, userId: string, id: string, dto: UpdateNoteDto) {
    const note = await this.prisma.tx.note.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!note) throw new NotFoundException('Note not found');

    if (note.scope === NoteScopeDto.PERSONAL) {
      if (note.createdById !== userId) {
        throw new ForbiddenException('Not authorized to update this personal note');
      }
    } else if (note.projectId) {
      await this.permissions.ensureCanWriteProject(tenantId, userId, note.projectId);
    }

    if (dto.scope && dto.scope !== note.scope) {
      throw new BadRequestException('Changing note scope is not allowed');
    }
    if (typeof dto.projectId !== 'undefined' && dto.projectId !== note.projectId) {
      throw new BadRequestException('Changing projectId is not allowed');
    }

    const updateData: any = {
      updatedById: userId,
    };
    if (typeof dto.title !== 'undefined') updateData.title = dto.title;
    if (typeof dto.content !== 'undefined') updateData.content = dto.content;
    if (typeof dto.parentId !== 'undefined') updateData.parentId = dto.parentId ?? null;
    if (typeof dto.tags !== 'undefined') updateData.tags = dto.tags;

    return this.prisma.tx.note.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(tenantId: string, userId: string, id: string) {
    const note = await this.prisma.tx.note.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!note) throw new NotFoundException('Note not found');

    if (note.scope === NoteScopeDto.PERSONAL) {
      if (note.createdById !== userId) {
        throw new ForbiddenException('Not authorized to delete this personal note');
      }
    } else if (note.projectId) {
      await this.permissions.ensureCanWriteProject(tenantId, userId, note.projectId);
    }

    return this.prisma.tx.note.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: userId,
      },
    });
  }

  /**
   * Create a calendar event from a note
   */
  async createCalendarEventFromNote(
    tenantId: string,
    userId: string,
    noteId: string,
    data: { title?: string; startAt: string; endAt: string; allDay?: boolean; type?: string },
  ) {
    // Get the note
    const note = await this.get(tenantId, userId, noteId);

    // Calendar events are only valid for project-scoped notes
    if (note.scope !== NoteScopeDto.PROJECT || !note.projectId) {
      throw new BadRequestException('Calendar events can only be created from project notes');
    }
    await this.permissions.ensureCanWriteProject(tenantId, userId, note.projectId);

    // Create calendar event
    const event = await this.prisma.tx.calendarEvent.create({
      data: {
        tenantId,
        projectId: note.projectId,
        sectionId: note.parentId || null, // Use parentId as sectionId if available
        title: data.title || note.title,
        description: note.title, // Use note title as description
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        allDay: data.allDay || false,
        type: (data.type as any) || 'NOTE_DATE',
        sourceType: 'NOTE',
        sourceId: note.id,
        createdById: userId,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    }).catch((error: any) => {
      // Gracefully handle if calendar_events table doesn't exist yet
      if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
        throw new NotFoundException('Calendar feature not available. Please run database migrations.');
      }
      throw error;
    });

    return event;
  }
} 