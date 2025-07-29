import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create feature flags
  const featureFlags = [
    {
      key: 'wbs_gantt',
      name: 'WBS & Gantt Charts',
      description: 'Create work breakdown structures and Gantt charts for project planning',
      category: 'basic',
    },
    {
      key: 'risk_register',
      name: 'Risk Register',
      description: 'Track and manage project risks with advanced risk assessment tools',
      category: 'pro',
    },
    {
      key: 'ai_insights',
      name: 'AI Insights',
      description: 'Get AI-powered project insights and recommendations',
      category: 'enterprise',
    },
    {
      key: 'advanced_analytics',
      name: 'Advanced Analytics',
      description: 'Deep dive analytics with custom dashboards and reporting',
      category: 'enterprise',
    },
    {
      key: 'custom_integrations',
      name: 'Custom Integrations',
      description: 'Build custom integrations with your existing tools and APIs',
      category: 'enterprise',
    },
    {
      key: 'priority_support',
      name: 'Priority Support',
      description: 'Get priority support with dedicated account management',
      category: 'enterprise',
    },
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: flag,
      create: flag,
    });
  }

  console.log('✅ Feature flags created');

  // Create default tenant
  const defaultTenant = await prisma.tenant.upsert({
    where: { slug: 'default-tenant' },
    update: {},
    create: {
      name: 'Default Tenant',
      slug: 'default-tenant',
      sku: 'basic',
    },
  });

  console.log('✅ Default tenant created');

  // Enable only wbs_gantt for default tenant
  await prisma.tenantFeature.upsert({
    where: {
      tenantId_featureKey: {
        tenantId: defaultTenant.id,
        featureKey: 'wbs_gantt',
      },
    },
    update: { enabled: true },
    create: {
      tenantId: defaultTenant.id,
      featureKey: 'wbs_gantt',
      enabled: true,
    },
  });

  console.log('✅ Default tenant features configured');

  // Create default user
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      tenantId: defaultTenant.id,
    },
  });

  console.log('✅ Default user created');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 