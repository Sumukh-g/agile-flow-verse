import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TenantFeatureView {
  key: string;
  name: string;
  description: string | null;
  category: string;
  enabled: boolean;
}

/**
 * Features Service
 *
 * Resolves the effective feature entitlements for a tenant by merging the
 * global FeatureFlag catalog with the tenant's TenantFeature overrides.
 * Flags without a tenant override default to disabled.
 */
@Injectable()
export class FeaturesService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenantFeatures(tenantId: string): Promise<TenantFeatureView[]> {
    const [flags, tenantFeatures] = await Promise.all([
      this.prisma.featureFlag.findMany({ orderBy: { category: 'asc' } }),
      this.prisma.tenantFeature.findMany({ where: { tenantId } }),
    ]);

    const enabledByKey = new Map(tenantFeatures.map((tf) => [tf.featureKey, tf.enabled]));

    return flags.map((flag) => ({
      key: flag.key,
      name: flag.name,
      description: flag.description,
      category: flag.category,
      enabled: enabledByKey.get(flag.key) ?? false,
    }));
  }

  async hasFeature(tenantId: string, featureKey: string): Promise<boolean> {
    const tenantFeature = await this.prisma.tenantFeature.findUnique({
      where: { tenantId_featureKey: { tenantId, featureKey } },
    });
    return tenantFeature?.enabled ?? false;
  }
}
