#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { Command } from 'commander';

const prisma = new PrismaClient();

interface FeatureUpdate {
  key: string;
  enabled: boolean;
}

const SKU_FEATURES: Record<string, FeatureUpdate[]> = {
  enterprise: [
    { key: 'risk_register', enabled: true },
    { key: 'ai_insights', enabled: true },
    { key: 'wbs_gantt', enabled: true },
    { key: 'advanced_analytics', enabled: true },
    { key: 'custom_integrations', enabled: true },
    { key: 'priority_support', enabled: true }
  ],
  pro: [
    { key: 'risk_register', enabled: true },
    { key: 'wbs_gantt', enabled: true },
    { key: 'ai_insights', enabled: false },
    { key: 'advanced_analytics', enabled: false },
    { key: 'custom_integrations', enabled: false },
    { key: 'priority_support', enabled: false }
  ],
  basic: [
    { key: 'wbs_gantt', enabled: true },
    { key: 'risk_register', enabled: false },
    { key: 'ai_insights', enabled: false },
    { key: 'advanced_analytics', enabled: false },
    { key: 'custom_integrations', enabled: false },
    { key: 'priority_support', enabled: false }
  ]
};

async function upgradeTenant(tenantIdOrSlug: string, sku: string): Promise<void> {
  try {
    // Validate SKU
    if (!SKU_FEATURES[sku]) {
      throw new Error(`Invalid SKU: ${sku}. Must be one of: ${Object.keys(SKU_FEATURES).join(', ')}`);
    }

    // Find tenant by ID or slug
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { id: tenantIdOrSlug },
          { slug: tenantIdOrSlug }
        ]
      }
    });

    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantIdOrSlug}`);
    }

    console.log(`\n🔄 Upgrading tenant: ${tenant.name} (${tenant.id})`);
    console.log(`📦 Current SKU: ${tenant.sku} → New SKU: ${sku}`);

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update tenant SKU
      const updatedTenant = await tx.tenant.update({
        where: { id: tenant.id },
        data: { sku }
      });

      // Upsert feature flags
      const featureUpdates = SKU_FEATURES[sku];
      const upsertPromises = featureUpdates.map(feature => 
        tx.tenantFeature.upsert({
          where: {
            tenantId_featureKey: {
              tenantId: tenant.id,
              featureKey: feature.key
            }
          },
          update: {
            enabled: feature.enabled,
            updatedAt: new Date()
          },
          create: {
            tenantId: tenant.id,
            featureKey: feature.key,
            enabled: feature.enabled,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      );

      const updatedFeatures = await Promise.all(upsertPromises);

      return { tenant: updatedTenant, features: updatedFeatures };
    });

    // Log summary
    console.log('\n✅ Upgrade completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Tenant: ${result.tenant.name} (${result.tenant.id})`);
    console.log(`   SKU: ${result.tenant.sku}`);
    console.log(`   Features updated: ${result.features.length}`);
    
    console.log('\n🔧 Feature Flags:');
    const enabledFeatures = result.features.filter(f => f.enabled);
    const disabledFeatures = result.features.filter(f => !f.enabled);
    
    if (enabledFeatures.length > 0) {
      console.log('   ✅ Enabled:');
      enabledFeatures.forEach(f => console.log(`      - ${f.featureKey}`));
    }
    
    if (disabledFeatures.length > 0) {
      console.log('   ❌ Disabled:');
      disabledFeatures.forEach(f => console.log(`      - ${f.featureKey}`));
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// CLI setup
const program = new Command();

program
  .name('upgrade-tenant')
  .description('Upgrade tenant SKU and automatically configure feature flags')
  .version('1.0.0');

program
  .command('upgrade')
  .description('Upgrade a tenant to a new SKU')
  .requiredOption('--tenant <tenant>', 'Tenant ID or slug')
  .requiredOption('--sku <sku>', 'Target SKU (basic|pro|enterprise)')
  .action(async (options) => {
    await upgradeTenant(options.tenant, options.sku);
  });

program.parse(); 