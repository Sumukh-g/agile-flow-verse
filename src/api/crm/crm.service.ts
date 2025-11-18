import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(private readonly prisma: PrismaService, private readonly ai: AiService) {}

  // --- Clients ---
  async listClients(tenantId: string) {
    return this.prisma.tx.crmClient.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getClient(tenantId: string, id: string) {
    const client = await this.prisma.tx.crmClient.findFirst({ where: { id, tenantId } });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async createClient(tenantId: string, userId: string, data: any) {
    return this.prisma.tx.crmClient.create({
      data: {
        ...data,
        tenantId,
        createdBy: userId,
      },
    });
  }

  async updateClient(tenantId: string, id: string, data: any) {
    const exists = await this.prisma.tx.crmClient.findFirst({ where: { id, tenantId } });
    if (!exists) throw new NotFoundException('Client not found');
    return this.prisma.tx.crmClient.update({ where: { id }, data });
  }

  async deleteClient(tenantId: string, id: string) {
    const exists = await this.prisma.tx.crmClient.findFirst({ where: { id, tenantId } });
    if (!exists) throw new NotFoundException('Client not found');
    await this.prisma.tx.crmClient.delete({ where: { id } });
    return { ok: true };
  }

  // --- CRM Projects ---
  async listCrmProjects(tenantId: string) {
    return this.prisma.tx.crmProject.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { id: true, name: true, company: true } } },
    });
  }

  async getCrmProject(tenantId: string, id: string) {
    const proj = await this.prisma.tx.crmProject.findFirst({
      where: { id, tenantId },
      include: {
        client: { select: { id: true, name: true, company: true, email: true, phone: true } },
      },
    });
    if (!proj) throw new NotFoundException('CRM project not found');
    
    // Get related deals for this project's client
    const deals = proj.clientId
      ? await this.prisma.tx.crmDeal.findMany({
          where: { tenantId, clientId: proj.clientId },
          orderBy: { createdAt: 'desc' },
        })
      : [];
    
    return { ...proj, deals };
  }

  async createCrmProject(tenantId: string, userId: string, data: any) {
    // Optional: validate client belongs to tenant
    if (data.clientId) {
      const client = await this.prisma.tx.crmClient.findFirst({ where: { id: data.clientId, tenantId } });
      if (!client) throw new ForbiddenException('Invalid client');
    }
    return this.prisma.tx.crmProject.create({
      data: {
        ...data,
        tenantId,
        createdBy: userId,
      },
    });
  }

  async updateCrmProject(tenantId: string, id: string, data: any) {
    const exists = await this.prisma.tx.crmProject.findFirst({ where: { id, tenantId } });
    if (!exists) throw new NotFoundException('CRM project not found');
    return this.prisma.tx.crmProject.update({ where: { id }, data });
  }

  async deleteCrmProject(tenantId: string, id: string) {
    const exists = await this.prisma.tx.crmProject.findFirst({ where: { id, tenantId } });
    if (!exists) throw new NotFoundException('CRM project not found');
    await this.prisma.tx.crmProject.delete({ where: { id } });
    return { ok: true };
  }

  // --- Deals ---
  async listDeals(tenantId: string) {
    return this.prisma.tx.crmDeal.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { id: true, name: true, company: true } } },
    });
  }

  async getDeal(tenantId: string, id: string) {
    const deal = await this.prisma.tx.crmDeal.findFirst({
      where: { id, tenantId },
      include: { client: { select: { id: true, name: true, company: true } } },
    });
    if (!deal) throw new NotFoundException('Deal not found');
    return deal;
  }

  async createDeal(tenantId: string, userId: string, data: any) {
    const client = await this.prisma.tx.crmClient.findFirst({ where: { id: data.clientId, tenantId } });
    if (!client) throw new ForbiddenException('Invalid client');
    return this.prisma.tx.crmDeal.create({
      data: {
        ...data,
        tenantId,
        createdBy: userId,
      },
    });
  }

  async updateDeal(tenantId: string, id: string, data: any) {
    const exists = await this.prisma.tx.crmDeal.findFirst({ where: { id, tenantId } });
    if (!exists) throw new NotFoundException('Deal not found');
    return this.prisma.tx.crmDeal.update({ where: { id }, data });
  }

  async deleteDeal(tenantId: string, id: string) {
    const exists = await this.prisma.tx.crmDeal.findFirst({ where: { id, tenantId } });
    if (!exists) throw new NotFoundException('Deal not found');
    await this.prisma.tx.crmDeal.delete({ where: { id } });
    return { ok: true };
  }

  // --- Summary (for CRM dashboard cards) ---
  async summary(tenantId: string) {
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
  async scheduleMeeting(tenantId: string, userId: string, payload: { clientId: string; start: string; title?: string; notes?: string }) {
    const client = await this.prisma.tx.crmClient.findFirst({ where: { id: payload.clientId, tenantId } });
    if (!client) throw new NotFoundException('Client not found');
    if (!client.email) throw new ForbiddenException('Client has no email address');

    // Generate meeting link (Jitsi for simplicity)
    const meetingId = uuidv4();
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
      const aiText = await this.ai?.summarizeText?.(
        `Create a friendly meeting invitation email for a client named ${client.name || 'there'} for ${friendlyDate}. Include this link: ${meetingLink}. Use a professional and concise tone.`,
      );
      if (aiText) {
        body = `${aiText}\n\nLink: ${meetingLink}`;
      }
    } catch (_) {
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
        } as any,
      });
    } catch (err) {
      this.logger.warn(`Failed to create notification: ${(err as Error).message}`);
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
}

