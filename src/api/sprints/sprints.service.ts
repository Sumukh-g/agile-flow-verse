import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { SprintStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Sprint Service
 * 
 * Handles all sprint-related operations for Scrum/Agile workflow.
 * Optimized for performance with proper indexing and efficient queries.
 * 
 * Features:
 * - Sprint CRUD operations
 * - Sprint planning and velocity tracking
 * - Burndown data calculation
 * - Sprint lifecycle management
 */
@Injectable()
export class SprintsService {
  private readonly logger = new Logger(SprintsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new sprint
   */
  async create(tenantId: string, data: {
    projectId: string;
    name: string;
    goal?: string;
    startDate: Date;
    endDate: Date;
  }) {
    // Validate date range
    if (data.startDate >= data.endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check for overlapping active sprints
    const overlapping = await this.prisma.sprint.findFirst({
      where: {
        tenantId,
        projectId: data.projectId,
        status: { in: ['ACTIVE', 'PLANNING'] },
        OR: [
          {
            AND: [
              { startDate: { lte: data.startDate } },
              { endDate: { gte: data.startDate } }
            ]
          },
          {
            AND: [
              { startDate: { lte: data.endDate } },
              { endDate: { gte: data.endDate } }
            ]
          }
        ]
      }
    });

    if (overlapping) {
      throw new ConflictException(`Sprint dates overlap with "${overlapping.name}"`);
    }

    const sprint = await this.prisma.sprint.create({
      data: {
        tenantId,
        projectId: data.projectId,
        name: data.name,
        goal: data.goal,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'PLANNING'
      },
      include: {
        project: { select: { id: true, name: true } }
      }
    });

    this.logger.log(`[SPRINT] Created sprint "${sprint.name}" for project ${data.projectId}`);
    return sprint;
  }

  /**
   * Get all sprints for a project
   */
  async findAllByProject(tenantId: string, projectId: string, options?: {
    status?: SprintStatus;
    limit?: number;
    includeCards?: boolean;
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

    if (options?.includeCards) {
      include.kanbanCards = {
        select: {
          id: true,
          title: true,
          status: true,
          storyPoints: true,
          priority: true
        },
        take: 100 // Limit for performance
      };
    }

    const sprints = await this.prisma.sprint.findMany({
      where,
      include,
      orderBy: { startDate: 'desc' },
      take: options?.limit
    });

    // Calculate metrics for each sprint
    return Promise.all(sprints.map(async (sprint) => {
      const metrics = await this.calculateSprintMetrics(tenantId, sprint.id);
      return { ...sprint, metrics };
    }));
  }

  /**
   * Get a single sprint by ID
   */
  async findOne(tenantId: string, sprintId: string) {
    const sprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, tenantId },
      include: {
        project: { select: { id: true, name: true } },
        kanbanCards: {
          orderBy: { position: 'asc' },
          include: {
            epic: { select: { id: true, name: true, color: true } }
          }
        },
        tasks: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    const metrics = await this.calculateSprintMetrics(tenantId, sprintId);
    return { ...sprint, metrics };
  }

  /**
   * Update a sprint
   */
  async update(tenantId: string, sprintId: string, data: Partial<{
    name: string;
    goal: string;
    startDate: Date;
    endDate: Date;
    status: SprintStatus;
    wentWell: string;
    needsImprovement: string;
    actionItems: string;
  }>) {
    const existing = await this.prisma.sprint.findFirst({
      where: { id: sprintId, tenantId }
    });

    if (!existing) {
      throw new NotFoundException('Sprint not found');
    }

    // Validate status transitions
    if (data.status) {
      this.validateStatusTransition(existing.status, data.status);
    }

    // If starting a sprint, record committed points
    let committedPoints: number | undefined;
    if (data.status === 'ACTIVE' && existing.status === 'PLANNING') {
      committedPoints = await this.calculateCommittedPoints(tenantId, sprintId);
    }

    // If completing a sprint, calculate velocity
    let velocity: number | undefined;
    if (data.status === 'COMPLETED' && existing.status === 'ACTIVE') {
      velocity = await this.calculateCompletedPoints(tenantId, sprintId);
    }

    const sprint = await this.prisma.sprint.update({
      where: { id: sprintId },
      data: {
        ...data,
        ...(committedPoints !== undefined && { committedPoints }),
        ...(velocity !== undefined && { velocity })
      },
      include: {
        project: { select: { id: true, name: true } }
      }
    });

    this.logger.log(`[SPRINT] Updated sprint "${sprint.name}" - status: ${sprint.status}`);
    return sprint;
  }

  /**
   * Delete a sprint
   */
  async delete(tenantId: string, sprintId: string) {
    const existing = await this.prisma.sprint.findFirst({
      where: { id: sprintId, tenantId }
    });

    if (!existing) {
      throw new NotFoundException('Sprint not found');
    }

    if (existing.status === 'ACTIVE') {
      throw new BadRequestException('Cannot delete an active sprint. Complete or cancel it first.');
    }

    // Remove sprint reference from cards and tasks before deleting
    await this.prisma.$transaction([
      this.prisma.kanbanCard.updateMany({
        where: { sprintId, tenantId },
        data: { sprintId: null }
      }),
      this.prisma.task.updateMany({
        where: { sprintId, tenantId },
        data: { sprintId: null }
      }),
      this.prisma.sprint.delete({
        where: { id: sprintId }
      })
    ]);

    this.logger.log(`[SPRINT] Deleted sprint "${existing.name}"`);
    return { success: true, message: 'Sprint deleted' };
  }

  /**
   * Start a sprint
   */
  async start(tenantId: string, sprintId: string) {
    // Check if there's already an active sprint for the project
    const sprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, tenantId }
    });

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    const activeSprint = await this.prisma.sprint.findFirst({
      where: {
        tenantId,
        projectId: sprint.projectId,
        status: 'ACTIVE',
        id: { not: sprintId }
      }
    });

    if (activeSprint) {
      throw new ConflictException(`Project already has an active sprint: "${activeSprint.name}"`);
    }

    return this.update(tenantId, sprintId, { status: 'ACTIVE' });
  }

  /**
   * Complete a sprint
   */
  async complete(tenantId: string, sprintId: string, retrospective?: {
    wentWell?: string;
    needsImprovement?: string;
    actionItems?: string;
  }) {
    return this.update(tenantId, sprintId, {
      status: 'COMPLETED',
      ...retrospective
    });
  }

  /**
   * Add items to sprint with readiness warnings
   */
  async addItems(tenantId: string, sprintId: string, itemIds: string[], itemType: 'card' | 'task') {
    const sprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, tenantId }
    });

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    const warnings: string[] = [];

    if (itemType === 'card') {
      const cards = await this.prisma.kanbanCard.findMany({
        where: { id: { in: itemIds }, tenantId, projectId: sprint.projectId },
        select: { id: true, title: true, isRefined: true, storyPoints: true },
      });

      const unrefined = cards.filter(c => !c.isRefined);
      const unpointed = cards.filter(c => c.storyPoints == null);

      if (unrefined.length > 0) {
        warnings.push(`${unrefined.length} item(s) not yet refined: ${unrefined.map(c => c.title).join(', ')}`);
      }
      if (unpointed.length > 0) {
        warnings.push(`${unpointed.length} item(s) missing story points: ${unpointed.map(c => c.title).join(', ')}`);
      }

      await this.prisma.kanbanCard.updateMany({
        where: { id: { in: itemIds }, tenantId, projectId: sprint.projectId },
        data: { sprintId }
      });
    } else {
      await this.prisma.task.updateMany({
        where: { id: { in: itemIds }, tenantId, projectId: sprint.projectId },
        data: { sprintId }
      });
    }

    if (sprint.status === 'ACTIVE') {
      await this.prisma.sprint.update({
        where: { id: sprintId },
        data: { scopeChanges: { increment: itemIds.length } },
      });
    }

    this.logger.log(`[SPRINT] Added ${itemIds.length} ${itemType}s to sprint "${sprint.name}"`);
    return { success: true, count: itemIds.length, warnings };
  }

  /**
   * Remove items from sprint
   */
  async removeItems(tenantId: string, sprintId: string, itemIds: string[], itemType: 'card' | 'task') {
    if (itemType === 'card') {
      await this.prisma.kanbanCard.updateMany({
        where: {
          id: { in: itemIds },
          sprintId,
          tenantId
        },
        data: { sprintId: null }
      });
    } else {
      await this.prisma.task.updateMany({
        where: {
          id: { in: itemIds },
          sprintId,
          tenantId
        },
        data: { sprintId: null }
      });
    }

    return { success: true, count: itemIds.length };
  }

  /**
   * Get burndown chart data for a sprint
   */
  async getBurndownData(tenantId: string, sprintId: string) {
    const sprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, tenantId }
    });

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    // Get all cards in the sprint with their completion dates
    const cards = await this.prisma.kanbanCard.findMany({
      where: { sprintId, tenantId },
      select: {
        id: true,
        storyPoints: true,
        status: true,
        updatedAt: true
      }
    });

    const totalPoints = cards.reduce((sum, c) => sum + (c.storyPoints || 0), 0);
    const sprintDays = this.getDateRange(sprint.startDate, sprint.endDate);

    // Calculate ideal burndown line
    const idealLine = sprintDays.map((date, index) => ({
      date: date.toISOString().split('T')[0],
      ideal: Math.max(0, totalPoints - (totalPoints / (sprintDays.length - 1)) * index)
    }));

    // For simplicity, we'll estimate actual burndown based on status
    // In production, you'd track completion dates in a separate table
    const completedPoints = cards
      .filter(c => c.status === 'done')
      .reduce((sum, c) => sum + (c.storyPoints || 0), 0);
    const remainingPoints = totalPoints - completedPoints;

    // Simple actual line (for demo - in production, track daily)
    const actualLine = idealLine.map((point, index) => ({
      ...point,
      actual: index === idealLine.length - 1 ? remainingPoints : undefined
    }));

    return {
      sprint: { id: sprint.id, name: sprint.name },
      totalPoints,
      completedPoints,
      remainingPoints,
      data: actualLine,
      startDate: sprint.startDate,
      endDate: sprint.endDate
    };
  }

  /**
   * Get velocity data for a project
   */
  async getVelocityData(tenantId: string, projectId: string, sprintCount: number = 6) {
    const sprints = await this.prisma.sprint.findMany({
      where: {
        tenantId,
        projectId,
        status: 'COMPLETED'
      },
      orderBy: { endDate: 'desc' },
      take: sprintCount,
      select: {
        id: true,
        name: true,
        velocity: true,
        committedPoints: true,
        startDate: true,
        endDate: true
      }
    });

    // Reverse to show chronologically
    const data = sprints.reverse();
    
    const avgVelocity = data.length > 0
      ? data.reduce((sum, s) => sum + (s.velocity || 0), 0) / data.length
      : 0;

    return {
      sprints: data,
      averageVelocity: Math.round(avgVelocity),
      predictedCapacity: Math.round(avgVelocity * 0.9) // 90% of average for planning
    };
  }

  /**
   * Get active sprint for a project
   */
  async getActiveSprint(tenantId: string, projectId: string) {
    const sprint = await this.prisma.sprint.findFirst({
      where: {
        tenantId,
        projectId,
        status: 'ACTIVE'
      },
      include: {
        kanbanCards: {
          orderBy: { position: 'asc' }
        },
        _count: {
          select: {
            kanbanCards: true,
            tasks: true
          }
        }
      }
    });

    if (!sprint) {
      return null;
    }

    const metrics = await this.calculateSprintMetrics(tenantId, sprint.id);
    return { ...sprint, metrics };
  }

  /**
   * Get backlog items (cards/tasks not in any sprint)
   */
  async getBacklog(tenantId: string, projectId: string) {
    const [cards, tasks] = await Promise.all([
      this.prisma.kanbanCard.findMany({
        where: {
          tenantId,
          projectId,
          sprintId: null,
          archived: false
        },
        orderBy: { position: 'asc' },
        include: {
          epic: { select: { id: true, name: true, color: true } }
        }
      }),
      this.prisma.task.findMany({
        where: {
          tenantId,
          projectId,
          sprintId: null
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const totalPoints = cards.reduce((sum, c) => sum + (c.storyPoints || 0), 0);

    return {
      cards,
      tasks,
      totalItems: cards.length + tasks.length,
      totalPoints
    };
  }

  // ===========================
  // Sprint Review Methods
  // ===========================

  async createReview(tenantId: string, sprintId: string, data: {
    attendees: { userId: string; name: string; role: string }[];
    demonstratedItems: { cardId: string; title: string; accepted: boolean; feedback?: string }[];
    stakeholderNotes?: string;
    reviewDate: Date;
  }) {
    const sprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, tenantId },
    });
    if (!sprint) throw new NotFoundException('Sprint not found');

    return this.prisma.sprintReview.create({
      data: {
        tenantId,
        sprintId,
        attendees: data.attendees,
        demonstratedItems: data.demonstratedItems,
        stakeholderNotes: data.stakeholderNotes,
        reviewDate: data.reviewDate,
      },
    });
  }

  async getReview(tenantId: string, sprintId: string) {
    return this.prisma.sprintReview.findFirst({
      where: { sprintId, tenantId },
    });
  }

  async updateReview(tenantId: string, sprintId: string, data: Partial<{
    attendees: any;
    demonstratedItems: any;
    stakeholderNotes: string;
    reviewDate: Date;
  }>) {
    const review = await this.prisma.sprintReview.findFirst({
      where: { sprintId, tenantId },
    });
    if (!review) throw new NotFoundException('Sprint review not found');

    return this.prisma.sprintReview.update({
      where: { id: review.id },
      data,
    });
  }

  // ===========================
  // Capacity Methods
  // ===========================

  async setCapacity(tenantId: string, sprintId: string, userId: string, data: {
    dailyHours?: number;
    leaveDays?: number;
    skills?: string[];
  }) {
    return this.prisma.sprintCapacity.upsert({
      where: { sprintId_userId: { sprintId, userId } },
      update: { ...data },
      create: { tenantId, sprintId, userId, ...data },
    });
  }

  async getCapacity(tenantId: string, sprintId: string) {
    const sprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, tenantId },
    });
    if (!sprint) throw new NotFoundException('Sprint not found');

    const capacities = await this.prisma.sprintCapacity.findMany({
      where: { sprintId, tenantId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    const sprintDays = Math.ceil(
      (sprint.endDate.getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const totalHours = capacities.reduce((sum, c) => {
      const workDays = Math.max(0, sprintDays - c.leaveDays);
      return sum + workDays * c.dailyHours;
    }, 0);

    return { capacities, sprintDays, totalHours };
  }

  async getCapacityVsLoad(tenantId: string, sprintId: string) {
    const capacity = await this.getCapacity(tenantId, sprintId);
    const metrics = await this.calculateSprintMetrics(tenantId, sprintId);

    const velocityData = await this.prisma.sprint.findFirst({
      where: { id: sprintId, tenantId },
      select: { projectId: true },
    });

    let avgHoursPerPoint = 4;
    if (velocityData) {
      const completedSprints = await this.prisma.sprint.findMany({
        where: { tenantId, projectId: velocityData.projectId, status: 'COMPLETED', velocity: { gt: 0 } },
        select: { velocity: true, startDate: true, endDate: true },
        take: 5,
        orderBy: { endDate: 'desc' },
      });

      if (completedSprints.length > 0) {
        const totalVelocity = completedSprints.reduce((s, sp) => s + (sp.velocity || 0), 0);
        const totalDays = completedSprints.reduce((s, sp) =>
          s + Math.ceil((sp.endDate.getTime() - sp.startDate.getTime()) / (1000 * 60 * 60 * 24)), 0);
        if (totalVelocity > 0) {
          avgHoursPerPoint = (totalDays * 8) / totalVelocity;
        }
      }
    }

    const committedLoad = metrics.totalPoints * avgHoursPerPoint;

    return {
      ...capacity,
      committedPoints: metrics.totalPoints,
      committedLoad: Math.round(committedLoad),
      avgHoursPerPoint: Math.round(avgHoursPerPoint * 10) / 10,
      utilizationPercent: capacity.totalHours > 0
        ? Math.round((committedLoad / capacity.totalHours) * 100)
        : 0,
    };
  }

  // ===========================
  // Enhanced Velocity Methods
  // ===========================

  async getEnhancedVelocityData(tenantId: string, projectId: string, sprintCount: number = 6) {
    const sprints = await this.prisma.sprint.findMany({
      where: { tenantId, projectId, status: 'COMPLETED' },
      orderBy: { endDate: 'desc' },
      take: Math.max(sprintCount, 10),
      select: {
        id: true, name: true, velocity: true, committedPoints: true,
        plannedPoints: true, scopeChanges: true, startDate: true, endDate: true,
      },
    });

    const data = sprints.reverse();

    const recent = data.slice(-sprintCount);
    const avgVelocity = recent.length > 0
      ? recent.reduce((sum, s) => sum + (s.velocity || 0), 0) / recent.length
      : 0;

    const rollingAverages: Record<number, number> = {};
    for (const n of [3, 5]) {
      const slice = data.slice(-n);
      rollingAverages[n] = slice.length > 0
        ? Math.round(slice.reduce((s, sp) => s + (sp.velocity || 0), 0) / slice.length)
        : 0;
    }

    const plannedVsCompleted = data.map(s => ({
      sprintId: s.id,
      name: s.name,
      planned: s.plannedPoints || s.committedPoints || 0,
      committed: s.committedPoints || 0,
      completed: s.velocity || 0,
    }));

    let pointInflationWarning = false;
    const recentWithPlanned = data.filter(s => (s.plannedPoints || s.committedPoints) && s.velocity);
    if (recentWithPlanned.length >= 3) {
      const last3 = recentWithPlanned.slice(-3);
      const allInflated = last3.every(s => {
        const planned = s.plannedPoints || s.committedPoints || 1;
        return (s.velocity || 0) / planned > 1.3;
      });
      pointInflationWarning = allInflated;
    }

    const scopeChangeAvg = data.length > 0
      ? Math.round(data.reduce((s, sp) => s + (sp.scopeChanges || 0), 0) / data.length)
      : 0;

    return {
      sprints: recent,
      averageVelocity: Math.round(avgVelocity),
      predictedCapacity: Math.round(avgVelocity * 0.9),
      rollingAverages,
      plannedVsCompleted,
      pointInflationWarning,
      scopeChangeAvg,
    };
  }

  // ===========================
  // Private Helper Methods
  // ===========================

  private validateStatusTransition(from: SprintStatus, to: SprintStatus): void {
    const validTransitions: Record<SprintStatus, SprintStatus[]> = {
      PLANNING: ['ACTIVE', 'CANCELLED'],
      ACTIVE: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [], // Final state
      CANCELLED: [] // Final state
    };

    if (!validTransitions[from].includes(to)) {
      throw new BadRequestException(`Cannot transition sprint from ${from} to ${to}`);
    }
  }

  private async calculateSprintMetrics(tenantId: string, sprintId: string) {
    const cards = await this.prisma.kanbanCard.findMany({
      where: { sprintId, tenantId },
      select: { status: true, storyPoints: true }
    });

    const totalPoints = cards.reduce((sum, c) => sum + (c.storyPoints || 0), 0);
    const completedPoints = cards
      .filter(c => c.status === 'done')
      .reduce((sum, c) => sum + (c.storyPoints || 0), 0);
    const inProgressPoints = cards
      .filter(c => ['working', 'in_progress', 'review'].includes(c.status))
      .reduce((sum, c) => sum + (c.storyPoints || 0), 0);

    return {
      totalItems: cards.length,
      totalPoints,
      completedPoints,
      inProgressPoints,
      remainingPoints: totalPoints - completedPoints,
      progress: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0
    };
  }

  private async calculateCommittedPoints(tenantId: string, sprintId: string): Promise<number> {
    const cards = await this.prisma.kanbanCard.findMany({
      where: { sprintId, tenantId },
      select: { storyPoints: true }
    });
    return cards.reduce((sum, c) => sum + (c.storyPoints || 0), 0);
  }

  private async calculateCompletedPoints(tenantId: string, sprintId: string): Promise<number> {
    const cards = await this.prisma.kanbanCard.findMany({
      where: { sprintId, tenantId, status: 'done' },
      select: { storyPoints: true }
    });
    return cards.reduce((sum, c) => sum + (c.storyPoints || 0), 0);
  }

  private getDateRange(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }
}

