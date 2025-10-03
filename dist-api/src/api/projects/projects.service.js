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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProjectsService = class ProjectsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async ensureCanAccessProject(tenantId, userId, projectId) {
        const member = await this.prisma.projectMember.findFirst({
            where: { tenantId, projectId, userId },
            select: { id: true },
        });
        if (!member) {
            // Tenant admins/owners can bypass - check role assignments
            const ra = await this.prisma.roleAssignment.findFirst({
                where: { tenantId, userId, role: { permissions: { hasSome: ['tenant.admin', 'tenant.owner'] } } },
                select: { id: true },
            });
            if (!ra)
                throw new common_1.ForbiddenException('Not a project member');
        }
    }
    async create(tenantId, userId, data) {
        return this.prisma.project.create({
            data: {
                ...data,
                tenantId,
                createdBy: userId,
            },
        });
    }
    async list(tenantId, cursor, limit = 25, sort = { createdAt: 'desc' }) {
        const take = Math.min(Math.max(limit, 1), 100);
        const where = { tenantId };
        const orderBy = sort;
        const items = await this.prisma.project.findMany({
            where,
            take: take + 1,
            ...(cursor ? { cursor: { id: cursor.id }, skip: 1 } : {}),
            orderBy,
        });
        const nextCursor = items.length > take ? { id: items[take - 1].id } : null;
        return {
            items: items.slice(0, take),
            nextCursor: nextCursor ? Buffer.from(JSON.stringify(nextCursor), 'utf8').toString('base64url') : null,
        };
    }
    async get(tenantId, userId, id) {
        await this.ensureCanAccessProject(tenantId, userId, id);
        const proj = await this.prisma.project.findFirst({ where: { id, tenantId } });
        if (!proj)
            throw new common_1.NotFoundException('Project not found');
        return proj;
    }
    async update(tenantId, userId, id, data) {
        await this.ensureCanAccessProject(tenantId, userId, id);
        return this.prisma.project.update({ where: { id }, data });
    }
    async remove(tenantId, userId, id) {
        await this.ensureCanAccessProject(tenantId, userId, id);
        await this.prisma.project.delete({ where: { id } });
        return { ok: true };
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProjectsService);
