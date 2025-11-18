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
exports.NotesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let NotesService = class NotesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async ensureProjectAccess(tenantId, userId, projectId) {
        // Check if user is project creator
        const project = await this.prisma.tx.project.findFirst({ where: { id: projectId, tenantId } });
        if (project && project.createdBy === userId) {
            return; // Creator has access
        }
        const isMember = await this.prisma.tx.projectMember.findFirst({ where: { tenantId, userId, projectId } });
        if (!isMember) {
            const hasAdmin = await this.prisma.tx.roleAssignment.findFirst({
                where: { tenantId, userId, role: { permissions: { hasSome: ['tenant.admin', 'tenant.owner'] } } },
            });
            if (!hasAdmin)
                throw new common_1.ForbiddenException('Not authorized for this project');
        }
    }
    async create(tenantId, userId, dto) {
        await this.ensureProjectAccess(tenantId, userId, dto.projectId);
        return this.prisma.tx.note.create({
            data: {
                title: dto.title,
                content: dto.content,
                projectId: dto.projectId,
                parentId: dto.parentId ?? null,
                tenantId,
            },
        });
    }
    async list(tenantId, projectId, cursor, limit = 25) {
        const take = Math.min(Math.max(limit, 1), 100);
        const where = { tenantId };
        if (projectId) {
            where.projectId = projectId;
        }
        const items = await this.prisma.tx.note.findMany({
            where,
            take: take + 1,
            ...(cursor ? { cursor: { id: cursor.id }, skip: 1 } : {}),
            orderBy: { createdAt: 'desc' },
        });
        const nextCursor = items.length > take ? { id: items[take - 1].id } : null;
        return {
            items: items.slice(0, take),
            nextCursor: nextCursor ? Buffer.from(JSON.stringify(nextCursor), 'utf8').toString('base64url') : null,
        };
    }
    async get(tenantId, userId, id) {
        const note = await this.prisma.tx.note.findFirst({ where: { id, tenantId } });
        if (!note)
            throw new common_1.NotFoundException('Note not found');
        if (note.projectId) {
            await this.ensureProjectAccess(tenantId, userId, note.projectId);
        }
        return note;
    }
    async update(tenantId, userId, id, dto) {
        const note = await this.prisma.tx.note.findFirst({ where: { id, tenantId } });
        if (!note)
            throw new common_1.NotFoundException('Note not found');
        if (note.projectId) {
            await this.ensureProjectAccess(tenantId, userId, note.projectId);
        }
        return this.prisma.tx.note.update({
            where: { id },
            data: {
                title: dto.title,
                content: dto.content,
                ...(dto.tags && { tags: dto.tags }),
            },
        });
    }
    async delete(tenantId, userId, id) {
        const note = await this.prisma.tx.note.findFirst({ where: { id, tenantId } });
        if (!note)
            throw new common_1.NotFoundException('Note not found');
        if (note.projectId) {
            await this.ensureProjectAccess(tenantId, userId, note.projectId);
        }
        return this.prisma.tx.note.delete({ where: { id } });
    }
};
exports.NotesService = NotesService;
exports.NotesService = NotesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotesService);
