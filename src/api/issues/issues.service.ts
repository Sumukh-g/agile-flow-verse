import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectPermissionsService } from '../common/project-permissions.service';
import { CreateIssueDto, UpdateIssueDto, IssueQueryDto, CreateIssueCommentDto, CreateIssueLinkDto } from './dto';

@Injectable()
export class IssuesService {
  private readonly logger = new Logger(IssuesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: ProjectPermissionsService,
  ) {}

  /**
   * Validate status transition (basic rules - can be extended later)
   * For now, we allow any transition but log it for future automation
   */
  private validateStatusTransition(oldStatus: string, newStatus: string): boolean {
    // Basic validation: prevent invalid transitions
    // For v1, we allow all transitions but can add rules later
    const validStatuses = [
      'INBOX', 'NEEDS_INFO', 'TRIAGED', 'PLANNED', 'READY_FOR_DEV',
      'IN_PROGRESS', 'IN_REVIEW', 'IN_QA', 'DONE', 'WONT_DO', 'DUPLICATE', 'ON_HOLD'
    ];
    
    return validStatuses.includes(newStatus);
  }

  /**
   * Update issue status (with optional transition validation)
   */
  async updateStatus(tenantId: string, userId: string, id: string, newStatus: string, assigneeId?: string) {
    const issue = await this.get(tenantId, userId, id);
    
    // Check write permissions
    await this.permissions.ensureCanWriteProject(tenantId, userId, issue.projectId);

    if (!this.validateStatusTransition(issue.status as string, newStatus)) {
      throw new BadRequestException(`Invalid status transition from ${issue.status} to ${newStatus}`);
    }

    const updateData: any = {
      status: newStatus as any,
    };

    if (assigneeId !== undefined) {
      updateData.assigneeId = assigneeId;
    }

    const updated = await this.prisma.tx.issue.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        },
        reporter: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true }
        },
        _count: {
          select: { comments: true, attachments: true }
        }
      }
    });

    // Track status change in changelog (async, non-blocking)
    this.recordChange(tenantId, id, userId, 'status', issue.status, newStatus).catch(err => {
      this.logger.warn(`Failed to record status change: ${err.message}`);
    });

    if (assigneeId !== undefined && assigneeId !== issue.assigneeId) {
      this.recordChange(tenantId, id, userId, 'assigneeId', issue.assigneeId, assigneeId).catch(err => {
        this.logger.warn(`Failed to record assignee change: ${err.message}`);
      });
    }

    return updated;
  }

  async create(tenantId: string, userId: string, data: CreateIssueDto) {
    // Check write permissions (viewers cannot create issues)
    await this.permissions.ensureCanWriteProject(tenantId, userId, data.projectId);

    const issue = await this.prisma.tx.issue.create({
      data: {
        tenantId,
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        status: (data.status as any) || 'INBOX',
        priority: (data.priority as any) || 'P2',
        type: (data.type as any) || 'TASK',
        severity: data.severity as any,
        assigneeId: data.assigneeId,
        reporterId: userId,
        componentId: data.componentId,
        tags: data.tags || [],
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        },
        reporter: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true }
        },
        _count: {
          select: { comments: true, attachments: true }
        }
      }
    });

    // Sync to calendar if due date is set
    if (issue.dueDate) {
      await this.syncIssueToCalendar(tenantId, userId, issue);
    }

    return issue;
  }

  async list(tenantId: string, userId: string, query: IssueQueryDto) {
    const where: any = {
      tenantId,
    };

    // Filter by project
    if (query.projectId) {
      // Verify user has access to this project
      const project = await this.prisma.tx.project.findFirst({
        where: {
          id: query.projectId,
          tenantId,
          OR: [
            { createdBy: userId },
            { members: { some: { userId } } }
          ]
        }
      });

      if (!project) {
        throw new NotFoundException('Project not found or access denied');
      }

      where.projectId = query.projectId;
    } else {
      // If no projectId, only show issues from projects user has access to
      const userProjects = await this.prisma.tx.project.findMany({
        where: {
          tenantId,
          OR: [
            { createdBy: userId },
            { members: { some: { userId } } }
          ]
        },
        select: { id: true }
      });

      where.projectId = {
        in: userProjects.map(p => p.id)
      };
    }

    // Apply filters
    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.assigneeId) {
      where.assigneeId = query.assigneeId;
    }

    if (query.tags && query.tags.length > 0) {
      where.tags = {
        hasSome: query.tags
      };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    // Sorting
    const orderBy: any = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const limit = Math.min(query.limit || 25, 100);
    const offset = query.offset || 0;

    const [items, total] = await Promise.all([
      this.prisma.tx.issue.findMany({
        where,
        include: {
          assignee: {
            select: { id: true, name: true, email: true }
          },
          reporter: {
            select: { id: true, name: true, email: true }
          },
          project: {
            select: { id: true, name: true }
          },
          _count: {
            select: { comments: true, attachments: true }
          }
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      this.prisma.tx.issue.count({ where })
    ]);

    return {
      items,
      total,
      hasMore: items.length === limit && (offset + limit) < total
    };
  }

  async get(tenantId: string, userId: string, id: string) {
    const issue = await this.prisma.tx.issue.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        },
        reporter: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true }
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { comments: true, attachments: true }
        }
      }
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    // Check read permissions (viewers can read)
    await this.permissions.ensureCanReadProject(tenantId, userId, issue.projectId);

    return issue;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateIssueDto) {
    const issue = await this.get(tenantId, userId, id);

    // Check write permissions (viewers cannot update issues)
    await this.permissions.ensureCanWriteProject(tenantId, userId, issue.projectId);

    // Additional check: Only reporter or project creator can update
    const project = await this.prisma.tx.project.findFirst({
      where: { id: issue.projectId, tenantId }
    });

    if (issue.reporterId !== userId && project?.createdBy !== userId) {
      throw new ForbiddenException('Only the reporter or project creator can update this issue');
    }

    const updated = await this.prisma.tx.issue.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status as any }),
        ...(data.priority !== undefined && { priority: data.priority as any }),
        ...(data.type !== undefined && { type: data.type as any }),
        ...(data.severity !== undefined && { severity: data.severity as any }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
        ...(data.componentId !== undefined && { componentId: data.componentId }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        },
        reporter: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true }
        },
        _count: {
          select: { comments: true, attachments: true }
        }
      }
    });

    // Track changes in changelog (async, non-blocking)
    this.trackChanges(tenantId, id, userId, issue, data).catch(err => {
      this.logger.warn(`Failed to track changes: ${err.message}`);
    });

    // Sync to calendar - update or create/delete based on due date
    const oldDueDate = issue.dueDate;
    await this.syncIssueToCalendar(tenantId, userId, updated, oldDueDate);

    return updated;
  }

  async delete(tenantId: string, userId: string, id: string) {
    const issue = await this.get(tenantId, userId, id);

    // Check write permissions (viewers cannot delete issues)
    await this.permissions.ensureCanWriteProject(tenantId, userId, issue.projectId);

    // Additional check: Only reporter or project creator can delete
    const project = await this.prisma.tx.project.findFirst({
      where: { id: issue.projectId, tenantId }
    });

    if (issue.reporterId !== userId && project?.createdBy !== userId) {
      throw new ForbiddenException('Only the reporter or project creator can delete this issue');
    }

    await this.prisma.tx.issue.delete({
      where: { id }
    });

    // Remove calendar event if it exists
    await this.removeIssueCalendarEvent(tenantId, id);

    return { success: true };
  }

  async addComment(tenantId: string, userId: string, issueId: string, data: CreateIssueCommentDto) {
    const issue = await this.get(tenantId, userId, issueId);

    // Check write permissions (viewers cannot add comments)
    await this.permissions.ensureCanWriteProject(tenantId, userId, issue.projectId);

    const comment = await this.prisma.tx.comment.create({
      data: {
        tenantId,
        issueId,
        content: data.content,
        createdBy: userId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return comment;
  }

  async getComments(tenantId: string, userId: string, issueId: string) {
    await this.get(tenantId, userId, issueId); // Verify access

    const comments = await this.prisma.tx.comment.findMany({
      where: {
        tenantId,
        issueId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return comments;
  }

  /**
   * Sync issue due date to calendar event
   */
  private async syncIssueToCalendar(
    tenantId: string,
    userId: string,
    issue: any,
    oldDueDate?: Date | null,
  ) {
    try {
      // Check if calendar_events table exists (graceful degradation)
      const existingEvent = await this.prisma.tx.calendarEvent.findFirst({
        where: {
          tenantId,
          sourceType: 'ISSUE',
          sourceId: issue.id,
        },
      }).catch(() => null);

      if (issue.dueDate) {
        const dueDate = issue.dueDate instanceof Date ? issue.dueDate : new Date(issue.dueDate);
        const endDate = new Date(dueDate);
        endDate.setHours(endDate.getHours() + 1); // Default 1 hour duration

        if (existingEvent) {
          // Update existing event
          await this.prisma.tx.calendarEvent.update({
            where: { id: existingEvent.id },
            data: {
              title: issue.title,
              description: issue.description || null,
              startAt: dueDate,
              endAt: endDate,
              allDay: false,
            },
          }).catch((err) => {
            this.logger.warn(`Failed to update calendar event: ${err.message}`);
          });
        } else {
          // Create new event
          await this.prisma.tx.calendarEvent.create({
            data: {
              tenantId,
              projectId: issue.projectId,
              title: issue.title,
              description: issue.description || null,
              startAt: dueDate,
              endAt: endDate,
              allDay: false,
              type: 'ISSUE_DUE',
              sourceType: 'ISSUE',
              sourceId: issue.id,
              createdById: userId,
            },
          }).catch((err) => {
            this.logger.warn(`Failed to create calendar event: ${err.message}`);
          });
        }
      } else if (existingEvent && oldDueDate) {
        // Due date was removed, delete the calendar event
        await this.prisma.tx.calendarEvent.delete({
          where: { id: existingEvent.id },
        }).catch((err) => {
          this.logger.warn(`Failed to delete calendar event: ${err.message}`);
        });
      }
    } catch (error: any) {
      // Log but don't fail issue operation if calendar sync fails
      if (error?.code !== 'P2021' && !error?.message?.includes('does not exist')) {
        this.logger.warn(`Failed to sync issue ${issue.id} to calendar: ${error.message}`);
      }
    }
  }

  /**
   * Remove calendar event for a deleted issue
   */
  private async removeIssueCalendarEvent(tenantId: string, issueId: string) {
    try {
      const event = await this.prisma.tx.calendarEvent.findFirst({
        where: {
          tenantId,
          sourceType: 'ISSUE',
          sourceId: issueId,
        },
      }).catch(() => null);

      if (event) {
        await this.prisma.tx.calendarEvent.delete({
          where: { id: event.id },
        }).catch((err) => {
          this.logger.warn(`Failed to remove calendar event: ${err.message}`);
        });
      }
    } catch (error: any) {
      // Silently handle if table doesn't exist
      if (error?.code !== 'P2021' && !error?.message?.includes('does not exist')) {
        this.logger.warn(`Failed to remove calendar event for issue ${issueId}: ${error.message}`);
      }
    }
  }

  // ============================================
  // Phase 8: Issue Links
  // ============================================

  /**
   * Create a link between two issues
   */
  async createLink(tenantId: string, userId: string, issueId: string, data: CreateIssueLinkDto) {
    // Verify source issue exists and user has access
    const sourceIssue = await this.get(tenantId, userId, issueId);
    await this.permissions.ensureCanWriteProject(tenantId, userId, sourceIssue.projectId);

    // Verify target issue exists
    const targetIssue = await this.get(tenantId, userId, data.targetIssueId);

    // Prevent self-linking
    if (issueId === data.targetIssueId) {
      throw new BadRequestException('Cannot link an issue to itself');
    }

    // Check if link already exists
    const existingLink = await this.prisma.tx.issueLink.findFirst({
      where: {
        tenantId,
        sourceIssueId: issueId,
        targetIssueId: data.targetIssueId,
        linkType: data.linkType as any,
      },
    });

    if (existingLink) {
      throw new ConflictException('Link already exists');
    }

    const link = await this.prisma.tx.issueLink.create({
      data: {
        tenantId,
        sourceIssueId: issueId,
        targetIssueId: data.targetIssueId,
        linkType: data.linkType as any,
        createdById: userId,
      },
      include: {
        sourceIssue: { select: { id: true, title: true } },
        targetIssue: { select: { id: true, title: true } },
      },
    });

    return link;
  }

  /**
   * Get all links for an issue
   */
  async getLinks(tenantId: string, userId: string, issueId: string) {
    await this.get(tenantId, userId, issueId); // Verify access

    const [linksFrom, linksTo] = await Promise.all([
      this.prisma.tx.issueLink.findMany({
        where: { tenantId, sourceIssueId: issueId },
        include: {
          targetIssue: { select: { id: true, title: true, status: true, priority: true } },
        },
      }),
      this.prisma.tx.issueLink.findMany({
        where: { tenantId, targetIssueId: issueId },
        include: {
          sourceIssue: { select: { id: true, title: true, status: true, priority: true } },
        },
      }),
    ]);

    return { linksFrom, linksTo };
  }

  /**
   * Delete an issue link
   */
  async deleteLink(tenantId: string, userId: string, issueId: string, linkId: string) {
    const issue = await this.get(tenantId, userId, issueId);
    await this.permissions.ensureCanWriteProject(tenantId, userId, issue.projectId);

    const link = await this.prisma.tx.issueLink.findFirst({
      where: { id: linkId, tenantId },
    });

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    // Verify user can delete (must be linked to this issue)
    if (link.sourceIssueId !== issueId && link.targetIssueId !== issueId) {
      throw new ForbiddenException('Link does not belong to this issue');
    }

    await this.prisma.tx.issueLink.delete({ where: { id: linkId } });

    return { success: true };
  }

  // ============================================
  // Phase 8: Issue Watchers
  // ============================================

  /**
   * Get watchers for an issue
   */
  async getWatchers(tenantId: string, userId: string, issueId: string) {
    await this.get(tenantId, userId, issueId); // Verify access

    const watchers = await this.prisma.tx.issueWatcher.findMany({
      where: { tenantId, issueId },
      include: {
        issue: false,
      },
    });

    // Get user details separately
    const userIds = watchers.map(w => w.userId);
    const users = await this.prisma.tx.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return watchers.map(w => ({
      ...w,
      user: userMap.get(w.userId),
    }));
  }

  /**
   * Watch an issue (current user)
   */
  async watch(tenantId: string, userId: string, issueId: string) {
    const issue = await this.get(tenantId, userId, issueId);

    // Check if already watching
    const existing = await this.prisma.tx.issueWatcher.findUnique({
      where: { issueId_userId: { issueId, userId } },
    });

    if (existing) {
      return { success: true, watching: true };
    }

    await this.prisma.tx.issueWatcher.create({
      data: {
        tenantId,
        issueId,
        userId,
      },
    });

    return { success: true, watching: true };
  }

  /**
   * Unwatch an issue (current user)
   */
  async unwatch(tenantId: string, userId: string, issueId: string) {
    await this.get(tenantId, userId, issueId); // Verify access

    await this.prisma.tx.issueWatcher.deleteMany({
      where: { tenantId, issueId, userId },
    });

    return { success: true, watching: false };
  }

  /**
   * Check if current user is watching
   */
  async isWatching(tenantId: string, userId: string, issueId: string) {
    await this.get(tenantId, userId, issueId); // Verify access

    const watcher = await this.prisma.tx.issueWatcher.findUnique({
      where: { issueId_userId: { issueId, userId } },
    });

    return { watching: !!watcher };
  }

  // ============================================
  // Phase 8: Issue Votes
  // ============================================

  /**
   * Get votes for an issue
   */
  async getVotes(tenantId: string, userId: string, issueId: string) {
    await this.get(tenantId, userId, issueId); // Verify access

    const [votes, count] = await Promise.all([
      this.prisma.tx.issueVote.findMany({
        where: { tenantId, issueId },
      }),
      this.prisma.tx.issueVote.count({
        where: { tenantId, issueId },
      }),
    ]);

    // Get user details
    const userIds = votes.map(v => v.userId);
    const users = await this.prisma.tx.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));
    const hasVoted = votes.some(v => v.userId === userId);

    return {
      count,
      hasVoted,
      voters: votes.map(v => ({
        ...v,
        user: userMap.get(v.userId),
      })),
    };
  }

  /**
   * Vote on an issue (current user)
   */
  async vote(tenantId: string, userId: string, issueId: string) {
    await this.get(tenantId, userId, issueId); // Verify access

    // Check if already voted
    const existing = await this.prisma.tx.issueVote.findUnique({
      where: { issueId_userId: { issueId, userId } },
    });

    if (existing) {
      return { success: true, voted: true };
    }

    await this.prisma.tx.issueVote.create({
      data: {
        tenantId,
        issueId,
        userId,
      },
    });

    const count = await this.prisma.tx.issueVote.count({
      where: { tenantId, issueId },
    });

    return { success: true, voted: true, count };
  }

  /**
   * Remove vote from an issue (current user)
   */
  async unvote(tenantId: string, userId: string, issueId: string) {
    await this.get(tenantId, userId, issueId); // Verify access

    await this.prisma.tx.issueVote.deleteMany({
      where: { tenantId, issueId, userId },
    });

    const count = await this.prisma.tx.issueVote.count({
      where: { tenantId, issueId },
    });

    return { success: true, voted: false, count };
  }

  /**
   * Check if current user has voted
   */
  async hasVoted(tenantId: string, userId: string, issueId: string) {
    await this.get(tenantId, userId, issueId); // Verify access

    const vote = await this.prisma.tx.issueVote.findUnique({
      where: { issueId_userId: { issueId, userId } },
    });

    return { voted: !!vote };
  }

  // ============================================
  // Phase 8: Issue Changelog (Audit Trail)
  // ============================================

  /**
   * Get changelog for an issue
   */
  async getChangelog(tenantId: string, userId: string, issueId: string, limit = 50) {
    await this.get(tenantId, userId, issueId); // Verify access

    const entries = await this.prisma.tx.issueChangelog.findMany({
      where: { tenantId, issueId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get user details for all entries
    const userIds = [...new Set(entries.map(e => e.userId))];
    const users = await this.prisma.tx.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return entries.map(entry => ({
      id: entry.id,
      field: entry.field,
      oldValue: entry.oldValue ? JSON.parse(entry.oldValue) : null,
      newValue: entry.newValue ? JSON.parse(entry.newValue) : null,
      changedBy: userMap.get(entry.userId) || { id: entry.userId, name: 'Unknown', email: '' },
      changedAt: entry.createdAt.toISOString(),
    }));
  }

  /**
   * Record a change to the changelog
   * @internal Used by update methods
   */
  private async recordChange(
    tenantId: string,
    issueId: string,
    userId: string,
    field: string,
    oldValue: any,
    newValue: any,
  ) {
    // Don't record if values are the same
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
      return;
    }

    await this.prisma.tx.issueChangelog.create({
      data: {
        tenantId,
        issueId,
        userId,
        field,
        oldValue: oldValue !== undefined ? JSON.stringify(oldValue) : null,
        newValue: newValue !== undefined ? JSON.stringify(newValue) : null,
      },
    }).catch(err => {
      // Log but don't fail the operation if changelog fails
      this.logger.warn(`Failed to record changelog: ${err.message}`);
    });
  }

  /**
   * Track all changes made to an issue
   * @internal Used after updates to record what changed
   */
  private async trackChanges(
    tenantId: string,
    issueId: string,
    userId: string,
    oldIssue: any,
    newData: any,
  ) {
    const trackableFields = [
      'title', 'description', 'status', 'priority', 'type', 'severity',
      'assigneeId', 'componentId', 'tags', 'dueDate'
    ];

    for (const field of trackableFields) {
      if (newData[field] !== undefined) {
        const oldValue = oldIssue[field];
        const newValue = newData[field];
        await this.recordChange(tenantId, issueId, userId, field, oldValue, newValue);
      }
    }
  }
}

