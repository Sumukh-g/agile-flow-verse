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
exports.FormsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const dto_1 = require("./dto");
const uuid_1 = require("uuid");
let FormsService = class FormsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(tenantId, projectId, userId) {
        const where = { tenantId };
        if (projectId) {
            where.projectId = projectId;
        }
        // If userId provided, show forms user created or has access to
        if (userId) {
            where.OR = [
                { createdBy: userId },
                { shares: { some: { userId } } },
                { isPublic: true },
            ];
        }
        const forms = await this.prisma.tx.form.findMany({
            where,
            include: {
                creator: { select: { id: true, name: true, email: true } },
                project: { select: { id: true, name: true } },
                _count: { select: { responses: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return forms.map(form => ({
            ...form,
            responses: form._count.responses,
            views: form.views,
        }));
    }
    async get(tenantId, id, userId) {
        const form = await this.prisma.tx.form.findFirst({
            where: { id, tenantId },
            include: {
                creator: { select: { id: true, name: true, email: true } },
                project: { select: { id: true, name: true } },
                _count: { select: { responses: true } },
                shares: userId ? {
                    where: { userId },
                    select: { id: true, access: true },
                } : false,
            },
        });
        if (!form)
            throw new common_1.NotFoundException('Form not found');
        // Check access
        if (userId && form.createdBy !== userId) {
            const hasShare = form.shares && form.shares.length > 0;
            if (!hasShare && !form.isPublic) {
                throw new common_1.ForbiddenException('You do not have access to this form');
            }
        }
        return {
            ...form,
            responses: form._count.responses,
        };
    }
    async create(tenantId, userId, data) {
        // Validate project access if projectId provided
        if (data.projectId) {
            const project = await this.prisma.tx.project.findFirst({
                where: { id: data.projectId, tenantId },
                include: { members: { where: { userId } } },
            });
            if (!project)
                throw new common_1.NotFoundException('Project not found');
            if (project.createdBy !== userId && project.members.length === 0) {
                throw new common_1.ForbiddenException('You do not have access to this project');
            }
        }
        return this.prisma.tx.form.create({
            data: {
                tenantId,
                createdBy: userId,
                projectId: data.projectId,
                title: data.title,
                description: data.description,
                fields: data.fields,
                status: data.status || dto_1.FormStatus.Draft,
                type: data.type,
                settings: data.settings || {},
                isPublic: data.isPublic || false,
            },
            include: {
                creator: { select: { id: true, name: true, email: true } },
                project: { select: { id: true, name: true } },
            },
        });
    }
    async update(tenantId, id, userId, data) {
        const form = await this.prisma.tx.form.findFirst({
            where: { id, tenantId },
        });
        if (!form)
            throw new common_1.NotFoundException('Form not found');
        if (form.createdBy !== userId) {
            throw new common_1.ForbiddenException('Only the form creator can update it');
        }
        return this.prisma.tx.form.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                fields: data.fields,
                status: data.status,
                type: data.type,
                settings: data.settings,
                isPublic: data.isPublic,
            },
            include: {
                creator: { select: { id: true, name: true, email: true } },
                project: { select: { id: true, name: true } },
            },
        });
    }
    async delete(tenantId, id, userId) {
        const form = await this.prisma.tx.form.findFirst({
            where: { id, tenantId },
        });
        if (!form)
            throw new common_1.NotFoundException('Form not found');
        if (form.createdBy !== userId) {
            throw new common_1.ForbiddenException('Only the form creator can delete it');
        }
        await this.prisma.tx.form.delete({ where: { id } });
        return { ok: true };
    }
    async submitResponse(tenantId, formId, userId, data) {
        const form = await this.prisma.tx.form.findFirst({
            where: { id: formId, tenantId },
        });
        if (!form)
            throw new common_1.NotFoundException('Form not found');
        if (form.status !== dto_1.FormStatus.Active) {
            throw new common_1.BadRequestException('Form is not accepting responses');
        }
        // Check settings
        const settings = form.settings || {};
        if (!settings.allowAnonymous && !userId) {
            throw new common_1.ForbiddenException('This form requires authentication');
        }
        // Check response limit
        if (settings.limitResponses && settings.maxResponses) {
            const responseCount = await this.prisma.tx.formResponse.count({
                where: { formId },
            });
            if (responseCount >= settings.maxResponses) {
                throw new common_1.BadRequestException('Form has reached maximum number of responses');
            }
        }
        return this.prisma.tx.formResponse.create({
            data: {
                tenantId,
                formId,
                submittedBy: userId,
                data: data.data,
            },
        });
    }
    async listResponses(tenantId, formId, userId) {
        const form = await this.prisma.tx.form.findFirst({
            where: { id: formId, tenantId },
        });
        if (!form)
            throw new common_1.NotFoundException('Form not found');
        if (form.createdBy !== userId) {
            throw new common_1.ForbiddenException('Only the form creator can view responses');
        }
        return this.prisma.tx.formResponse.findMany({
            where: { formId, tenantId },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { submittedAt: 'desc' },
        });
    }
    async share(tenantId, formId, userId, data) {
        const form = await this.prisma.tx.form.findFirst({
            where: { id: formId, tenantId },
        });
        if (!form)
            throw new common_1.NotFoundException('Form not found');
        if (form.createdBy !== userId) {
            throw new common_1.ForbiddenException('Only the form creator can share it');
        }
        // Generate share link if public
        const shareLink = !data.userId ? `form-${(0, uuid_1.v4)()}` : null;
        return this.prisma.tx.formShare.create({
            data: {
                tenantId,
                formId,
                userId: data.userId,
                access: data.access,
                shareLink,
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            },
        });
    }
    async listShares(tenantId, formId, userId) {
        const form = await this.prisma.tx.form.findFirst({
            where: { id: formId, tenantId },
        });
        if (!form)
            throw new common_1.NotFoundException('Form not found');
        if (form.createdBy !== userId) {
            throw new common_1.ForbiddenException('Only the form creator can view shares');
        }
        return this.prisma.tx.formShare.findMany({
            where: { formId, tenantId },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });
    }
    async deleteShare(tenantId, shareId, userId) {
        const share = await this.prisma.tx.formShare.findFirst({
            where: { id: shareId, tenantId },
            include: { form: true },
        });
        if (!share)
            throw new common_1.NotFoundException('Share not found');
        if (share.form.createdBy !== userId) {
            throw new common_1.ForbiddenException('Only the form creator can delete shares');
        }
        await this.prisma.tx.formShare.delete({ where: { id: shareId } });
        return { ok: true };
    }
    async incrementViews(tenantId, formId) {
        await this.prisma.tx.form.update({
            where: { id: formId, tenantId },
            data: { views: { increment: 1 } },
        });
    }
};
exports.FormsService = FormsService;
exports.FormsService = FormsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FormsService);
