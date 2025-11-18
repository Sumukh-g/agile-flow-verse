"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssuesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let IssuesService = class IssuesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, userId, data) {
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
            throw new common_1.NotFoundException('Project not found or access denied');
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
    async list(tenantId, userId, query) {
        const where = {
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
                throw new common_1.NotFoundException('Project not found or access denied');
            }
            where.projectId = query.projectId;
        }
        else {
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
        const orderBy = {};
        if (query.sortBy) {
            orderBy[query.sortBy] = query.sortOrder || 'desc';
        }
        else {
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
    async get(tenantId, userId, id) {
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
            throw new common_1.NotFoundException('Issue not found');
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
            throw new common_1.ForbiddenException('Access denied to this issue');
        }
        return issue;
    }
    async update(tenantId, userId, id, data) {
        const issue = await this.get(tenantId, userId, id);
        // Only reporter or project creator can update
        const project = await this.prisma.tx.project.findFirst({
            where: { id: issue.projectId, tenantId }
        });
        if (issue.reporterId !== userId && project?.createdBy !== userId) {
            throw new common_1.ForbiddenException('Only the reporter or project creator can update this issue');
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
    async delete(tenantId, userId, id) {
        const issue = await this.get(tenantId, userId, id);
        // Only reporter or project creator can delete
        const project = await this.prisma.tx.project.findFirst({
            where: { id: issue.projectId, tenantId }
        });
        if (issue.reporterId !== userId && project?.createdBy !== userId) {
            throw new common_1.ForbiddenException('Only the reporter or project creator can delete this issue');
        }
        await this.prisma.tx.issue.delete({
            where: { id }
        });
        return { success: true };
    }
    async addComment(tenantId, userId, issueId, data) {
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
    async getComments(tenantId, userId, issueId) {
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
};
exports.IssuesService = IssuesService;
exports.IssuesService = IssuesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IssuesService);
