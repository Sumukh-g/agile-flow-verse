import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ProjectPermissionsService } from '../common/project-permissions.service';

/**
 * Kanban Service
 * Handles all Kanban board operations (columns and cards)
 * Separate from Gantt chart to avoid data conflicts
 */
@Injectable()
export class KanbanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
    private readonly permissions: ProjectPermissionsService,
  ) {}

  /**
   * Get all Kanban columns for a project
   * Auto-creates default columns if none exist
   */
  async getColumns(tenantId: string, userId: string, projectId: string) {
    // Verify project access
    await this.permissions.ensureCanReadProject(tenantId, userId, projectId);

    let columns = await this.prisma.tx.kanbanColumn.findMany({
      where: { projectId, tenantId },
      orderBy: { position: 'asc' },
      include: {
        cards: {
          orderBy: { position: 'asc' },
        },
      },
    });

    // If no columns exist, create default columns with original IDs and WIP limits
    if (columns.length === 0) {
      const defaultColumns = [
        { name: 'Backlog', color: '#6b7280', position: 0, wipLimit: 20 },
        { name: 'To Do', color: '#3b82f6', position: 1, wipLimit: 10 },
        { name: 'In Progress', color: '#f59e42', position: 2, wipLimit: 5 },
        { name: 'Review', color: '#8b5cf6', position: 3, wipLimit: 3 },
        { name: 'Done', color: '#22c55e', position: 4 },
      ];

      const createdColumns = await Promise.all(
        defaultColumns.map((col) =>
          this.prisma.tx.kanbanColumn.create({
            data: {
              projectId,
              tenantId,
              name: col.name,
              color: col.color,
              position: col.position,
              wipLimit: col.wipLimit,
            },
            include: {
              cards: true,
            },
          }),
        ),
      );

      columns = createdColumns;
      
      // Broadcast that columns were created
      await this.realtime.broadcastProjectUpdate(tenantId, projectId, 'kanban.columns.initialized', createdColumns);
    }

    return columns;
  }

  /**
   * Create a new Kanban column
   */
  async createColumn(tenantId: string, userId: string, projectId: string, dto: any) {
    await this.permissions.ensureCanManageProjectSettings(tenantId, userId, projectId);

    // Get max position
    const maxPosition = await this.prisma.tx.kanbanColumn.findFirst({
      where: { projectId, tenantId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const column = await this.prisma.tx.kanbanColumn.create({
      data: {
        projectId,
        tenantId,
        name: dto.name,
        color: dto.color || '#6b7280',
        position: (maxPosition?.position ?? -1) + 1,
        wipLimit: dto.wipLimit,
        description: dto.description,
        collapsed: dto.collapsed || false,
      },
    });

    await this.realtime.broadcastProjectUpdate(tenantId, projectId, 'kanban.column.created', column);
    return column;
  }

  /**
   * Update a Kanban column
   */
  async updateColumn(tenantId: string, userId: string, projectId: string, columnId: string, dto: any) {
    await this.permissions.ensureCanManageProjectSettings(tenantId, userId, projectId);

    const column = await this.prisma.tx.kanbanColumn.findFirst({
      where: { id: columnId, projectId, tenantId },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    const updated = await this.prisma.tx.kanbanColumn.update({
      where: { id: columnId },
      data: {
        name: dto.name,
        color: dto.color,
        wipLimit: dto.wipLimit,
        description: dto.description,
        collapsed: dto.collapsed,
        position: dto.position,
      },
    });

    await this.realtime.broadcastProjectUpdate(tenantId, projectId, 'kanban.column.updated', updated);
    return updated;
  }

  /**
   * Delete a Kanban column (and move cards to another column or delete them)
   */
  async deleteColumn(tenantId: string, userId: string, projectId: string, columnId: string, moveToColumnId?: string) {
    await this.permissions.ensureCanManageProjectSettings(tenantId, userId, projectId);

    const column = await this.prisma.tx.kanbanColumn.findFirst({
      where: { id: columnId, projectId, tenantId },
      include: { cards: true },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    // If moving cards to another column
    if (moveToColumnId) {
      const targetColumn = await this.prisma.tx.kanbanColumn.findFirst({
        where: { id: moveToColumnId, projectId, tenantId },
      });

      if (!targetColumn) {
        throw new NotFoundException('Target column not found');
      }

      // Move all cards to target column
      await this.prisma.tx.kanbanCard.updateMany({
        where: { columnId, tenantId },
        data: { columnId: moveToColumnId },
      });
    } else {
      // Delete all cards in the column
      await this.prisma.tx.kanbanCard.deleteMany({
        where: { columnId, tenantId },
      });
    }

    // Delete the column
    await this.prisma.tx.kanbanColumn.delete({
      where: { id: columnId },
    });

    await this.realtime.broadcastProjectUpdate(tenantId, projectId, 'kanban.column.deleted', { id: columnId });
    return { ok: true };
  }

  /**
   * Reorder columns
   */
  async reorderColumns(tenantId: string, userId: string, projectId: string, columnIds: string[]) {
    await this.permissions.ensureCanManageProjectSettings(tenantId, userId, projectId);

    // Update positions
    await Promise.all(
      columnIds.map((id, index) =>
        this.prisma.tx.kanbanColumn.update({
          where: { id },
          data: { position: index },
        }),
      ),
    );

    const columns = await this.getColumns(tenantId, userId, projectId);
    await this.realtime.broadcastProjectUpdate(tenantId, projectId, 'kanban.columns.reordered', columns);
    return columns;
  }

  /**
   * Get all Kanban cards for a project
   */
  async getCards(tenantId: string, userId: string, projectId: string, columnId?: string) {
    await this.permissions.ensureCanReadProject(tenantId, userId, projectId);

    const where: any = { projectId, tenantId };
    if (columnId) {
      where.columnId = columnId;
    }

    const cards = await this.prisma.tx.kanbanCard.findMany({
      where,
      orderBy: { position: 'asc' },
    });

    return cards;
  }

  /**
   * Create a new Kanban card
   */
  async createCard(tenantId: string, userId: string, projectId: string, dto: any) {
    await this.permissions.ensureCanReadProject(tenantId, userId, projectId);

    // Validate required fields
    if (!dto.title || !dto.title.trim()) {
      throw new BadRequestException('Card title is required');
    }

    if (!dto.columnId) {
      throw new BadRequestException('Column ID is required');
    }

    // Verify column exists
    const column = await this.prisma.tx.kanbanColumn.findFirst({
      where: { id: dto.columnId, projectId, tenantId },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    // Get max position in column
    const maxPosition = await this.prisma.tx.kanbanCard.findFirst({
      where: { columnId: dto.columnId, tenantId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const card = await this.prisma.tx.kanbanCard.create({
      data: {
        projectId,
        tenantId,
        columnId: dto.columnId,
        title: dto.title,
        description: dto.description,
        status: dto.status || 'todo',
        priority: dto.priority || 'medium',
        position: (maxPosition?.position ?? -1) + 1,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        estimatedHours: dto.estimatedHours,
        assignees: dto.assignees || [],
        labels: dto.labels || [],
        subtasks: dto.subtasks || [],
        checklists: dto.checklists || [],
        attachments: dto.attachments || [],
        comments: dto.comments || [],
        dependencies: dto.dependencies || [],
        blockedBy: dto.blockedBy || [],
        blocking: dto.blocking || [],
        customFields: dto.customFields || {},
        createdBy: userId,
      },
    });

    await this.realtime.broadcastProjectUpdate(tenantId, projectId, 'kanban.card.created', card);
    return card;
  }

  /**
   * Update a Kanban card
   */
  async updateCard(tenantId: string, userId: string, projectId: string, cardId: string, dto: any) {
    await this.permissions.ensureCanReadProject(tenantId, userId, projectId);

    const card = await this.prisma.tx.kanbanCard.findFirst({
      where: { id: cardId, projectId, tenantId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // If moving to another column, verify it exists
    if (dto.columnId && dto.columnId !== card.columnId) {
      const newColumn = await this.prisma.tx.kanbanColumn.findFirst({
        where: { id: dto.columnId, projectId, tenantId },
      });

      if (!newColumn) {
        throw new NotFoundException('Target column not found');
      }

      // Get max position in new column
      const maxPosition = await this.prisma.tx.kanbanCard.findFirst({
        where: { columnId: dto.columnId, tenantId },
        orderBy: { position: 'desc' },
        select: { position: true },
      });

      dto.position = (maxPosition?.position ?? -1) + 1;
    }

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.columnId !== undefined) updateData.columnId = dto.columnId;
    if (dto.position !== undefined) updateData.position = dto.position;
    if (dto.dueDate !== undefined) updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.startDate !== undefined) updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.estimatedHours !== undefined) updateData.estimatedHours = dto.estimatedHours;
    if (dto.actualHours !== undefined) updateData.actualHours = dto.actualHours;
    if (dto.assignees !== undefined) updateData.assignees = dto.assignees;
    if (dto.labels !== undefined) updateData.labels = dto.labels;
    if (dto.subtasks !== undefined) updateData.subtasks = dto.subtasks;
    if (dto.checklists !== undefined) updateData.checklists = dto.checklists;
    if (dto.attachments !== undefined) updateData.attachments = dto.attachments;
    if (dto.comments !== undefined) updateData.comments = dto.comments;
    if (dto.dependencies !== undefined) updateData.dependencies = dto.dependencies;
    if (dto.blockedBy !== undefined) updateData.blockedBy = dto.blockedBy;
    if (dto.blocking !== undefined) updateData.blocking = dto.blocking;
    if (dto.customFields !== undefined) updateData.customFields = dto.customFields;
    if (dto.archived !== undefined) updateData.archived = dto.archived;

    const updated = await this.prisma.tx.kanbanCard.update({
      where: { id: cardId },
      data: updateData,
    });

    await this.realtime.broadcastProjectUpdate(tenantId, projectId, 'kanban.card.updated', updated);
    return updated;
  }

  /**
   * Delete a Kanban card
   */
  async deleteCard(tenantId: string, userId: string, projectId: string, cardId: string) {
    await this.permissions.ensureCanReadProject(tenantId, userId, projectId);

    const card = await this.prisma.tx.kanbanCard.findFirst({
      where: { id: cardId, projectId, tenantId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    await this.prisma.tx.kanbanCard.delete({
      where: { id: cardId },
    });

    await this.realtime.broadcastProjectUpdate(tenantId, projectId, 'kanban.card.deleted', { id: cardId });
    return { ok: true };
  }

  /**
   * Move a card between columns (drag and drop)
   */
  async moveCard(
    tenantId: string,
    userId: string,
    projectId: string,
    cardId: string,
    targetColumnId: string,
    newPosition: number,
  ) {
    await this.permissions.ensureCanReadProject(tenantId, userId, projectId);

    const card = await this.prisma.tx.kanbanCard.findFirst({
      where: { id: cardId, projectId, tenantId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    const targetColumn = await this.prisma.tx.kanbanColumn.findFirst({
      where: { id: targetColumnId, projectId, tenantId },
    });

    if (!targetColumn) {
      throw new NotFoundException('Target column not found');
    }

    // If moving to a different column, update positions in both columns
    if (card.columnId !== targetColumnId) {
      // Shift positions in old column
      await this.prisma.tx.kanbanCard.updateMany({
        where: {
          columnId: card.columnId,
          tenantId,
          position: { gte: card.position },
        },
        data: {
          position: { decrement: 1 },
        },
      });

      // Shift positions in new column
      await this.prisma.tx.kanbanCard.updateMany({
        where: {
          columnId: targetColumnId,
          tenantId,
          position: { gte: newPosition },
        },
        data: {
          position: { increment: 1 },
        },
      });
    } else {
      // Same column, just reorder
      if (card.position < newPosition) {
        await this.prisma.tx.kanbanCard.updateMany({
          where: {
            columnId: targetColumnId,
            tenantId,
            position: { gt: card.position, lte: newPosition },
          },
          data: {
            position: { decrement: 1 },
          },
        });
      } else {
        await this.prisma.tx.kanbanCard.updateMany({
          where: {
            columnId: targetColumnId,
            tenantId,
            position: { gte: newPosition, lt: card.position },
          },
          data: {
            position: { increment: 1 },
          },
        });
      }
    }

    // Update the card
    const updated = await this.prisma.tx.kanbanCard.update({
      where: { id: cardId },
      data: {
        columnId: targetColumnId,
        position: newPosition,
      },
    });

    await this.realtime.broadcastProjectUpdate(tenantId, projectId, 'kanban.card.moved', updated);
    return updated;
  }
}

