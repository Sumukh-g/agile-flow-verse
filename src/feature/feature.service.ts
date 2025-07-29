import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeatureService {
  constructor(private prisma: PrismaService) {}

  async hasFeature(tenantId: string, featureKey: string): Promise<boolean> {
    const tenantFeature = await this.prisma.tenantFeature.findUnique({
      where: {
        tenantId_featureKey: {
          tenantId,
          featureKey,
        },
      },
    });

    return tenantFeature?.enabled ?? false;
  }

  async getTenantFeatures(tenantId: string) {
    return this.prisma.tenantFeature.findMany({
      where: { tenantId },
      include: {
        featureFlag: true,
      },
    });
  }
} 