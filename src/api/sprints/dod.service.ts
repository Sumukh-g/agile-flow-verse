import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectPermissionsService } from '../common/project-permissions.service';

@Injectable()
export class DoDService {
  private readonly logger = new Logger(DoDService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: ProjectPermissionsService,
  ) {}

  async getDoD(tenantId: string, projectId: string) {
    const dod = await this.prisma.definitionOfDone.findFirst({
      where: { tenantId, projectId },
    });
    return dod || { items: [], projectId, tenantId };
  }

  async setDoD(tenantId: string, userId: string, projectId: string, items: { id: string; label: string; required: boolean }[]) {
    await this.permissions.ensureCanManageProjectSettings(tenantId, userId, projectId);

    const existing = await this.prisma.definitionOfDone.findFirst({
      where: { tenantId, projectId },
    });

    if (existing) {
      return this.prisma.definitionOfDone.update({
        where: { id: existing.id },
        data: { items },
      });
    }

    return this.prisma.definitionOfDone.create({
      data: { tenantId, projectId, items },
    });
  }

  async getDoDChecks(tenantId: string, cardId: string) {
    return this.prisma.doDCheck.findMany({
      where: { tenantId, cardId },
      orderBy: { itemId: 'asc' },
    });
  }

  async toggleDoDCheck(tenantId: string, cardId: string, itemId: string, userId: string) {
    const card = await this.prisma.kanbanCard.findFirst({
      where: { id: cardId, tenantId },
      select: { projectId: true },
    });
    if (!card) throw new NotFoundException('Card not found');
    await this.permissions.ensureCanWriteProject(tenantId, userId, card.projectId);

    const existing = await this.prisma.doDCheck.findFirst({
      where: { cardId, itemId },
    });

    if (existing) {
      return this.prisma.doDCheck.update({
        where: { id: existing.id },
        data: {
          checked: !existing.checked,
          checkedBy: !existing.checked ? userId : null,
          checkedAt: !existing.checked ? new Date() : null,
        },
      });
    }

    return this.prisma.doDCheck.create({
      data: {
        tenantId,
        cardId,
        itemId,
        checked: true,
        checkedBy: userId,
        checkedAt: new Date(),
      },
    });
  }

  async isCardDoDComplete(tenantId: string, cardId: string): Promise<{ complete: boolean; missing: string[] }> {
    const card = await this.prisma.kanbanCard.findFirst({
      where: { id: cardId, tenantId },
      select: { projectId: true },
    });

    if (!card) throw new NotFoundException('Card not found');

    const dod = await this.prisma.definitionOfDone.findFirst({
      where: { tenantId, projectId: card.projectId },
    });

    if (!dod) return { complete: true, missing: [] };

    const items = dod.items as { id: string; label: string; required: boolean }[];
    const requiredItems = items.filter(i => i.required);

    if (requiredItems.length === 0) return { complete: true, missing: [] };

    const checks = await this.prisma.doDCheck.findMany({
      where: { tenantId, cardId },
    });

    const checkedItemIds = new Set(checks.filter(c => c.checked).map(c => c.itemId));
    const missing = requiredItems
      .filter(item => !checkedItemIds.has(item.id))
      .map(item => item.label);

    return { complete: missing.length === 0, missing };
  }

  async validateCardForDone(tenantId: string, cardId: string): Promise<void> {
    const result = await this.isCardDoDComplete(tenantId, cardId);
    if (!result.complete) {
      throw new BadRequestException(
        `Card does not meet Definition of Done. Missing: ${result.missing.join(', ')}`
      );
    }
  }
}
