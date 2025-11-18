import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIssueDto, UpdateIssueDto, IssueQueryDto, CreateIssueCommentDto } from './dto';

@Injectable()
export class IssuesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, userId: string, data: CreateIssueDto) {
    // Verify project exists and user has access
    const project = await this.prisma.tx.project.findFirst({
      where: {
        id: data.projectId,
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

    const issue = await this.prisma.tx.issue.create({
      data: {
        tenantId,
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        status: data.status || 'backlog',
        priority: data.priority || 'medium',
        type: data.type || 'task',
        severity: data.severity,
        assigneeId: data.assigneeId,
        reporterId: userId,
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

    // Verify user has access to the project
    const project = await this.prisma.tx.project.findFirst({
      where: {
        id: issue.projectId,
        tenantId,
        OR: [
          { createdBy: userId },
          { members: { some: { userId } } }
        ]
      }
    });

    if (!project) {
      throw new ForbiddenException('Access denied to this issue');
    }

    return issue;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateIssueDto) {
    const issue = await this.get(tenantId, userId, id);

    // Only reporter or project creator can update
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
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.severity !== undefined && { severity: data.severity }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
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

    return updated;
  }

  async delete(tenantId: string, userId: string, id: string) {
    const issue = await this.get(tenantId, userId, id);

    // Only reporter or project creator can delete
    const project = await this.prisma.tx.project.findFirst({
      where: { id: issue.projectId, tenantId }
    });

    if (issue.reporterId !== userId && project?.createdBy !== userId) {
      throw new ForbiddenException('Only the reporter or project creator can delete this issue');
    }

    await this.prisma.tx.issue.delete({
      where: { id }
    });

    return { success: true };
  }

  async addComment(tenantId: string, userId: string, issueId: string, data: CreateIssueCommentDto) {
    const issue = await this.get(tenantId, userId, issueId);

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
}

