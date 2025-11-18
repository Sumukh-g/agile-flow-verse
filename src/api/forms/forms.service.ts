import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormDto, UpdateFormDto, SubmitFormResponseDto, ShareFormDto, FormStatus } from './dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FormsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, projectId?: string, userId?: string) {
    const where: any = { tenantId };
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

  async get(tenantId: string, id: string, userId?: string) {
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

    if (!form) throw new NotFoundException('Form not found');

    // Check access
    if (userId && form.createdBy !== userId) {
      const hasShare = form.shares && form.shares.length > 0;
      if (!hasShare && !form.isPublic) {
        throw new ForbiddenException('You do not have access to this form');
      }
    }

    return {
      ...form,
      responses: form._count.responses,
    };
  }

  async create(tenantId: string, userId: string, data: CreateFormDto) {
    // Validate project access if projectId provided
    if (data.projectId) {
      const project = await this.prisma.tx.project.findFirst({
        where: { id: data.projectId, tenantId },
        include: { members: { where: { userId } } },
      });
      if (!project) throw new NotFoundException('Project not found');
      if (project.createdBy !== userId && project.members.length === 0) {
        throw new ForbiddenException('You do not have access to this project');
      }
    }

    return this.prisma.tx.form.create({
      data: {
        tenantId,
        createdBy: userId,
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        fields: data.fields as any,
        status: data.status || FormStatus.Draft,
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

  async update(tenantId: string, id: string, userId: string, data: UpdateFormDto) {
    const form = await this.prisma.tx.form.findFirst({
      where: { id, tenantId },
    });

    if (!form) throw new NotFoundException('Form not found');
    if (form.createdBy !== userId) {
      throw new ForbiddenException('Only the form creator can update it');
    }

    return this.prisma.tx.form.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        fields: data.fields as any,
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

  async delete(tenantId: string, id: string, userId: string) {
    const form = await this.prisma.tx.form.findFirst({
      where: { id, tenantId },
    });

    if (!form) throw new NotFoundException('Form not found');
    if (form.createdBy !== userId) {
      throw new ForbiddenException('Only the form creator can delete it');
    }

    await this.prisma.tx.form.delete({ where: { id } });
    return { ok: true };
  }

  async submitResponse(tenantId: string, formId: string, userId: string | null, data: SubmitFormResponseDto) {
    const form = await this.prisma.tx.form.findFirst({
      where: { id: formId, tenantId },
    });

    if (!form) throw new NotFoundException('Form not found');
    if (form.status !== FormStatus.Active) {
      throw new BadRequestException('Form is not accepting responses');
    }

    // Check settings
    const settings = (form.settings as any) || {};
    if (!settings.allowAnonymous && !userId) {
      throw new ForbiddenException('This form requires authentication');
    }

    // Check response limit
    if (settings.limitResponses && settings.maxResponses) {
      const responseCount = await this.prisma.tx.formResponse.count({
        where: { formId },
      });
      if (responseCount >= settings.maxResponses) {
        throw new BadRequestException('Form has reached maximum number of responses');
      }
    }

    return this.prisma.tx.formResponse.create({
      data: {
        tenantId,
        formId,
        submittedBy: userId,
        data: data.data as any,
      },
    });
  }

  async listResponses(tenantId: string, formId: string, userId: string) {
    const form = await this.prisma.tx.form.findFirst({
      where: { id: formId, tenantId },
    });

    if (!form) throw new NotFoundException('Form not found');
    if (form.createdBy !== userId) {
      throw new ForbiddenException('Only the form creator can view responses');
    }

    return this.prisma.tx.formResponse.findMany({
      where: { formId, tenantId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async share(tenantId: string, formId: string, userId: string, data: ShareFormDto) {
    const form = await this.prisma.tx.form.findFirst({
      where: { id: formId, tenantId },
    });

    if (!form) throw new NotFoundException('Form not found');
    if (form.createdBy !== userId) {
      throw new ForbiddenException('Only the form creator can share it');
    }

    // Generate share link if public
    const shareLink = !data.userId ? `form-${uuidv4()}` : null;

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

  async listShares(tenantId: string, formId: string, userId: string) {
    const form = await this.prisma.tx.form.findFirst({
      where: { id: formId, tenantId },
    });

    if (!form) throw new NotFoundException('Form not found');
    if (form.createdBy !== userId) {
      throw new ForbiddenException('Only the form creator can view shares');
    }

    return this.prisma.tx.formShare.findMany({
      where: { formId, tenantId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async deleteShare(tenantId: string, shareId: string, userId: string) {
    const share = await this.prisma.tx.formShare.findFirst({
      where: { id: shareId, tenantId },
      include: { form: true },
    });

    if (!share) throw new NotFoundException('Share not found');
    if (share.form.createdBy !== userId) {
      throw new ForbiddenException('Only the form creator can delete shares');
    }

    await this.prisma.tx.formShare.delete({ where: { id: shareId } });
    return { ok: true };
  }

  async incrementViews(tenantId: string, formId: string) {
    await this.prisma.tx.form.update({
      where: { id: formId, tenantId },
      data: { views: { increment: 1 } },
    });
  }
}

