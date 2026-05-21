import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Epic Service
 * 
 * Handles all epic-related operations for organizing work into larger initiatives.
 * Epics contain multiple cards/tasks and track overall progress.
 * 
 * Features:
 * - Epic CRUD operations
 * - Progress rollup from child items
 * - Story points aggregation
 * - Epic timeline tracking
 */
@Injectable()
export class EpicsService {
  private readonly logger = new Logger(EpicsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new epic
   */
  async create(tenantId: string, data: {
    projectId: string;
    name: string;
    description?: string;
    color?: string;
    priority?: string;
    startDate?: Date;
    targetDate?: Date;
    businessValue?: number;
  }) {
    const epic = await this.prisma.epic.create({
      data: {
        tenantId,
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        color: data.color || '#6366f1',
        priority: data.priority || 'medium',
        startDate: data.startDate,
        targetDate: data.targetDate,
        businessValue: data.businessValue,
        status: 'open'
      },
      include: {
        project: { select: { id: true, name: true } }
      }
    });

    this.logger.log(`[EPIC] Created epic "${epic.name}" for project ${data.projectId}`);
    return epic;
  }

  /**
   * Get all epics for a project
   */
  async findAllByProject(tenantId: string, projectId: string, options?: {
    status?: string;
    includeItems?: boolean;
  }) {
    const where: any = { tenantId, projectId };
    if (options?.status) {
      where.status = options.status;
    }

    const include: any = {
      project: { select: { id: true, name: true } },
      _count: {
        select: {
          kanbanCards: true,
          tasks: true
        }
      }
    };

    if (options?.includeItems) {
      include.kanbanCards = {
        select: {
          id: true,
          title: true,
          status: true,
          storyPoints: true,
          priority: true
        },
        take: 50
      };
    }

    const epics = await this.prisma.epic.findMany({
      where,
      include,
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }]
    });

    // Calculate metrics for each epic
    return Promise.all(epics.map(async (epic) => {
      const metrics = await this.calculateEpicMetrics(tenantId, epic.id);
      return { ...epic, metrics };
    }));
  }

  /**
   * Get a single epic by ID
   */
  async findOne(tenantId: string, epicId: string) {
    const epic = await this.prisma.epic.findFirst({
      where: { id: epicId, tenantId },
      include: {
        project: { select: { id: true, name: true } },
        kanbanCards: {
          orderBy: { position: 'asc' },
          include: {
            sprint: { select: { id: true, name: true, status: true } }
          }
        },
        tasks: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!epic) {
      throw new NotFoundException('Epic not found');
    }

    const metrics = await this.calculateEpicMetrics(tenantId, epicId);
    return { ...epic, metrics };
  }

  /**
   * Update an epic
   */
  async update(tenantId: string, epicId: string, data: Partial<{
    name: string;
    description: string;
    status: string;
    color: string;
    priority: string;
    startDate: Date;
    targetDate: Date;
    businessValue: number;
  }>) {
    const existing = await this.prisma.epic.findFirst({
      where: { id: epicId, tenantId }
    });

    if (!existing) {
      throw new NotFoundException('Epic not found');
    }

    // Validate status
    if (data.status && !['open', 'in_progress', 'done'].includes(data.status)) {
      throw new BadRequestException('Invalid epic status');
    }

    // Recalculate progress if status changed to done
    let progress = existing.progress;
    if (data.status === 'done') {
      progress = 100;
    } else if (data.status === 'open' && existing.status === 'done') {
      progress = 0;
    }

    const epic = await this.prisma.epic.update({
      where: { id: epicId },
      data: {
        ...data,
        progress
      },
      include: {
        project: { select: { id: true, name: true } }
      }
    });

    this.logger.log(`[EPIC] Updated epic "${epic.name}"`);
    return epic;
  }

  /**
   * Delete an epic
   */
  async delete(tenantId: string, epicId: string) {
    const existing = await this.prisma.epic.findFirst({
      where: { id: epicId, tenantId }
    });

    if (!existing) {
      throw new NotFoundException('Epic not found');
    }

    // Remove epic reference from cards and tasks before deleting
    await this.prisma.$transaction([
      this.prisma.kanbanCard.updateMany({
        where: { epicId, tenantId },
        data: { epicId: null }
      }),
      this.prisma.task.updateMany({
        where: { epicId, tenantId },
        data: { epicId: null }
      }),
      this.prisma.epic.delete({
        where: { id: epicId }
      })
    ]);

    this.logger.log(`[EPIC] Deleted epic "${existing.name}"`);
    return { success: true, message: 'Epic deleted' };
  }

  /**
   * Add items to an epic
   */
  async addItems(tenantId: string, epicId: string, itemIds: string[], itemType: 'card' | 'task') {
    const epic = await this.prisma.epic.findFirst({
      where: { id: epicId, tenantId }
    });

    if (!epic) {
      throw new NotFoundException('Epic not found');
    }

    if (itemType === 'card') {
      await this.prisma.kanbanCard.updateMany({
        where: {
          id: { in: itemIds },
          tenantId,
          projectId: epic.projectId
        },
        data: { epicId }
      });
    } else {
      await this.prisma.task.updateMany({
        where: {
          id: { in: itemIds },
          tenantId,
          projectId: epic.projectId
        },
        data: { epicId }
      });
    }

    // Update epic progress
    await this.updateEpicProgress(tenantId, epicId);

    this.logger.log(`[EPIC] Added ${itemIds.length} ${itemType}s to epic "${epic.name}"`);
    return { success: true, count: itemIds.length };
  }

  /**
   * Remove items from an epic
   */
  async removeItems(tenantId: string, epicId: string, itemIds: string[], itemType: 'card' | 'task') {
    if (itemType === 'card') {
      await this.prisma.kanbanCard.updateMany({
        where: {
          id: { in: itemIds },
          epicId,
          tenantId
        },
        data: { epicId: null }
      });
    } else {
      await this.prisma.task.updateMany({
        where: {
          id: { in: itemIds },
          epicId,
          tenantId
        },
        data: { epicId: null }
      });
    }

    // Update epic progress
    await this.updateEpicProgress(tenantId, epicId);

    return { success: true, count: itemIds.length };
  }

  /**
   * Get epic roadmap view (all epics with timeline)
   */
  async getRoadmap(tenantId: string, projectId: string) {
    const epics = await this.prisma.epic.findMany({
      where: {
        tenantId,
        projectId,
        status: { not: 'done' }
      },
      orderBy: [{ startDate: 'asc' }, { priority: 'asc' }],
      include: {
        _count: {
          select: {
            kanbanCards: true,
            tasks: true
          }
        }
      }
    });

    // Calculate metrics for each epic
    const epicsWithMetrics = await Promise.all(
      epics.map(async (epic) => {
        const metrics = await this.calculateEpicMetrics(tenantId, epic.id);
        return { ...epic, metrics };
      })
    );

    // Group by quarter for roadmap view
    const now = new Date();
    const quarters = this.groupByQuarter(epicsWithMetrics, now);

    return {
      epics: epicsWithMetrics,
      quarters,
      summary: {
        total: epics.length,
        open: epics.filter(e => e.status === 'open').length,
        inProgress: epics.filter(e => e.status === 'in_progress').length
      }
    };
  }

  // ===========================
  // Epic Risk Detection
  // ===========================

  async checkEpicRisk(tenantId: string, epicId: string) {
    const epic = await this.prisma.epic.findFirst({
      where: { id: epicId, tenantId },
    });
    if (!epic) throw new NotFoundException('Epic not found');

    if (!epic.targetDate || !epic.startDate) {
      return { riskLevel: null, riskReason: 'No timeline set' };
    }

    const now = new Date();
    const totalDuration = epic.targetDate.getTime() - epic.startDate.getTime();
    const elapsed = now.getTime() - epic.startDate.getTime();

    if (totalDuration <= 0 || elapsed < 0) {
      return { riskLevel: 'on_track', riskReason: null };
    }

    const expectedProgress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
    const actualProgress = epic.progress || 0;
    const gap = expectedProgress - actualProgress;

    let riskLevel = 'on_track';
    let riskReason: string | null = null;

    if (gap >= 40) {
      riskLevel = 'critical';
      riskReason = `Progress is ${actualProgress}% but should be ~${expectedProgress}% based on timeline. ${gap}% behind schedule.`;
    } else if (gap >= 20) {
      riskLevel = 'at_risk';
      riskReason = `Progress is ${actualProgress}% but should be ~${expectedProgress}% based on timeline. ${gap}% behind schedule.`;
    }

    if (now > epic.targetDate && actualProgress < 100) {
      riskLevel = 'critical';
      riskReason = `Epic is past its target date (${epic.targetDate.toISOString().split('T')[0]}) with only ${actualProgress}% complete.`;
    }

    await this.prisma.epic.update({
      where: { id: epicId },
      data: { riskLevel, riskReason, lastRiskCheck: now },
    });

    return { riskLevel, riskReason };
  }

  async checkAllEpicRisks(tenantId: string, projectId: string) {
    const epics = await this.prisma.epic.findMany({
      where: { tenantId, projectId, status: { not: 'done' } },
      select: { id: true },
    });

    const results = await Promise.all(
      epics.map(e => this.checkEpicRisk(tenantId, e.id))
    );

    const atRisk = results.filter(r => r.riskLevel === 'at_risk').length;
    const critical = results.filter(r => r.riskLevel === 'critical').length;

    return { total: epics.length, onTrack: epics.length - atRisk - critical, atRisk, critical };
  }

  // ===========================
  // Private Helper Methods
  // ===========================

  private async calculateEpicMetrics(tenantId: string, epicId: string) {
    const cards = await this.prisma.kanbanCard.findMany({
      where: { epicId, tenantId },
      select: { status: true, storyPoints: true }
    });

    const totalItems = cards.length;
    const totalPoints = cards.reduce((sum, c) => sum + (c.storyPoints || 0), 0);
    const completedItems = cards.filter(c => c.status === 'done').length;
    const completedPoints = cards
      .filter(c => c.status === 'done')
      .reduce((sum, c) => sum + (c.storyPoints || 0), 0);
    const inProgressItems = cards.filter(c => 
      ['working', 'in_progress', 'review'].includes(c.status)
    ).length;

    const progress = totalItems > 0 
      ? Math.round((completedItems / totalItems) * 100) 
      : 0;

    return {
      totalItems,
      totalPoints,
      completedItems,
      completedPoints,
      inProgressItems,
      remainingItems: totalItems - completedItems,
      remainingPoints: totalPoints - completedPoints,
      progress
    };
  }

  private async updateEpicProgress(tenantId: string, epicId: string) {
    const metrics = await this.calculateEpicMetrics(tenantId, epicId);
    
    // Determine status based on progress
    let status = 'open';
    if (metrics.progress === 100) {
      status = 'done';
    } else if (metrics.inProgressItems > 0 || metrics.completedItems > 0) {
      status = 'in_progress';
    }

    await this.prisma.epic.update({
      where: { id: epicId },
      data: {
        progress: metrics.progress,
        storyPoints: metrics.totalPoints,
        status
      }
    });
  }

  private groupByQuarter(epics: any[], referenceDate: Date): Record<string, any[]> {
    const quarters: Record<string, any[]> = {};

    for (const epic of epics) {
      const date = epic.targetDate || epic.startDate || referenceDate;
      const quarter = `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`;
      
      if (!quarters[quarter]) {
        quarters[quarter] = [];
      }
      quarters[quarter].push(epic);
    }

    return quarters;
  }
}

