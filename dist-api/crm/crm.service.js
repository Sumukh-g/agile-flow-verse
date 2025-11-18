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
var CrmService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ai_service_1 = require("../ai/ai.service");
const uuid_1 = require("uuid");
let CrmService = CrmService_1 = class CrmService {
    constructor(prisma, ai) {
        this.prisma = prisma;
        this.ai = ai;
        this.logger = new common_1.Logger(CrmService_1.name);
    }
    // --- Clients ---
    async listClients(tenantId) {
        return this.prisma.tx.crmClient.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getClient(tenantId, id) {
        const client = await this.prisma.tx.crmClient.findFirst({ where: { id, tenantId } });
        if (!client)
            throw new common_1.NotFoundException('Client not found');
        return client;
    }
    async createClient(tenantId, userId, data) {
        return this.prisma.tx.crmClient.create({
            data: {
                ...data,
                tenantId,
                createdBy: userId,
            },
        });
    }
    async updateClient(tenantId, id, data) {
        const exists = await this.prisma.tx.crmClient.findFirst({ where: { id, tenantId } });
        if (!exists)
            throw new common_1.NotFoundException('Client not found');
        return this.prisma.tx.crmClient.update({ where: { id }, data });
    }
    async deleteClient(tenantId, id) {
        const exists = await this.prisma.tx.crmClient.findFirst({ where: { id, tenantId } });
        if (!exists)
            throw new common_1.NotFoundException('Client not found');
        await this.prisma.tx.crmClient.delete({ where: { id } });
        return { ok: true };
    }
    // --- CRM Projects ---
    async listCrmProjects(tenantId) {
        return this.prisma.tx.crmProject.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: { client: { select: { id: true, name: true, company: true } } },
        });
    }
    async getCrmProject(tenantId, id) {
        const proj = await this.prisma.tx.crmProject.findFirst({
            where: { id, tenantId },
            include: {
                client: { select: { id: true, name: true, company: true, email: true, phone: true } },
            },
        });
        if (!proj)
            throw new common_1.NotFoundException('CRM project not found');
        // Get related deals for this project's client
        const deals = proj.clientId
            ? await this.prisma.tx.crmDeal.findMany({
                where: { tenantId, clientId: proj.clientId },
                orderBy: { createdAt: 'desc' },
            })
            : [];
        return { ...proj, deals };
    }
    async createCrmProject(tenantId, userId, data) {
        // Optional: validate client belongs to tenant
        if (data.clientId) {
            const client = await this.prisma.tx.crmClient.findFirst({ where: { id: data.clientId, tenantId } });
            if (!client)
                throw new common_1.ForbiddenException('Invalid client');
        }
        return this.prisma.tx.crmProject.create({
            data: {
                ...data,
                tenantId,
                createdBy: userId,
            },
        });
    }
    async updateCrmProject(tenantId, id, data) {
        const exists = await this.prisma.tx.crmProject.findFirst({ where: { id, tenantId } });
        if (!exists)
            throw new common_1.NotFoundException('CRM project not found');
        return this.prisma.tx.crmProject.update({ where: { id }, data });
    }
    async deleteCrmProject(tenantId, id) {
        const exists = await this.prisma.tx.crmProject.findFirst({ where: { id, tenantId } });
        if (!exists)
            throw new common_1.NotFoundException('CRM project not found');
        await this.prisma.tx.crmProject.delete({ where: { id } });
        return { ok: true };
    }
    // --- Deals ---
    async listDeals(tenantId) {
        return this.prisma.tx.crmDeal.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: { client: { select: { id: true, name: true, company: true } } },
        });
    }
    async getDeal(tenantId, id) {
        const deal = await this.prisma.tx.crmDeal.findFirst({
            where: { id, tenantId },
            include: { client: { select: { id: true, name: true, company: true } } },
        });
        if (!deal)
            throw new common_1.NotFoundException('Deal not found');
        return deal;
    }
    async createDeal(tenantId, userId, data) {
        const client = await this.prisma.tx.crmClient.findFirst({ where: { id: data.clientId, tenantId } });
        if (!client)
            throw new common_1.ForbiddenException('Invalid client');
        return this.prisma.tx.crmDeal.create({
            data: {
                ...data,
                tenantId,
                createdBy: userId,
            },
        });
    }
    async updateDeal(tenantId, id, data) {
        const exists = await this.prisma.tx.crmDeal.findFirst({ where: { id, tenantId } });
        if (!exists)
            throw new common_1.NotFoundException('Deal not found');
        return this.prisma.tx.crmDeal.update({ where: { id }, data });
    }
    async deleteDeal(tenantId, id) {
        const exists = await this.prisma.tx.crmDeal.findFirst({ where: { id, tenantId } });
        if (!exists)
            throw new common_1.NotFoundException('Deal not found');
        await this.prisma.tx.crmDeal.delete({ where: { id } });
        return { ok: true };
    }
    // --- Summary (for CRM dashboard cards) ---
    async summary(tenantId) {
        // Note: Inside our request scope, prisma.tx is already a TransactionClient.
        // Calling $transaction on it throws. Use Promise.all instead.
        const [clients, crmProjects, deals] = await Promise.all([
            this.prisma.tx.crmClient.count({ where: { tenantId } }),
            this.prisma.tx.crmProject.count({ where: { tenantId } }),
            this.prisma.tx.crmDeal.findMany({ where: { tenantId } }),
        ]);
        const totalRevenue = deals
            .filter(d => d.stage === 'closed-won')
            .reduce((sum, d) => sum + (d.value || 0), 0);
        const activeProjects = await this.prisma.tx.crmProject.count({
            where: { tenantId, status: { in: ['in-progress', 'planning', 'review'] } },
        });
        return {
            totalClients: clients,
            totalCrmProjects: crmProjects,
            totalDeals: deals.length,
            totalRevenue,
            activeProjects,
        };
    }
    // --- Meeting Scheduling (returns email subject/body and meeting link) ---
    async scheduleMeeting(tenantId, userId, payload) {
        const client = await this.prisma.tx.crmClient.findFirst({ where: { id: payload.clientId, tenantId } });
        if (!client)
            throw new common_1.NotFoundException('Client not found');
        if (!client.email)
            throw new common_1.ForbiddenException('Client has no email address');
        // Generate meeting link (Jitsi for simplicity)
        const meetingId = (0, uuid_1.v4)();
        const meetingLink = `https://meet.jit.si/${meetingId}`;
        const start = new Date(payload.start);
        const friendlyDate = start.toLocaleString();
        const subject = payload.title || `Meeting Invitation - ${friendlyDate}`;
        const baseBody = `Hi ${client.name || ''},

I'd like to schedule a meeting on ${friendlyDate}.
Here is the meeting link:
${meetingLink}

${payload.notes ? `Notes:\n${payload.notes}\n\n` : ''}Best regards,`;
        // Use AI for a nicer body if configured (falls back to baseBody)
        let body = baseBody;
        try {
            const aiText = await this.ai?.summarizeText?.(`Create a friendly meeting invitation email for a client named ${client.name || 'there'} for ${friendlyDate}. Include this link: ${meetingLink}. Use a professional and concise tone.`);
            if (aiText) {
                body = `${aiText}\n\nLink: ${meetingLink}`;
            }
        }
        catch (_) {
            // ignore AI errors, use base body
        }
        // Create an in-app notification for the organizer (optional)
        try {
            await this.prisma.tx.notification.create({
                data: {
                    tenantId,
                    userId,
                    type: 'SYSTEM',
                    title: 'Meeting Invite Prepared',
                    message: `Invitation for ${client.name || client.email} on ${friendlyDate}`,
                    data: { meetingLink, clientId: client.id, clientEmail: client.email, start: payload.start },
                    channels: ['in_app'],
                    priority: 'medium',
                },
            });
        }
        catch (err) {
            this.logger.warn(`Failed to create notification: ${err.message}`);
        }
        // Return data for frontend to send via mailto (works without SMTP)
        return {
            ok: true,
            meetingLink,
            email: client.email,
            subject,
            body,
        };
    }
};
exports.CrmService = CrmService;
exports.CrmService = CrmService = CrmService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, ai_service_1.AiService])
], CrmService);
