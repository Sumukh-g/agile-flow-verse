/**
 * Migration script to migrate existing users to UserTenant table
 * 
 * This script should be run AFTER creating the Prisma migration:
 * 1. Run: npx prisma migrate dev --name add_multi_tenant_support
 * 2. Then run this script to migrate existing data
 * 
 * Usage: npx tsx scripts/migrate-to-multi-tenant.ts
 * Or: npm run migrate:multi-tenant (if added to package.json)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting migration to multi-tenant support...\n');

  // Get all users with tenantId
  const users = await prisma.user.findMany({
    where: {
      tenantId: { not: null },
    },
    include: {
      tenant: true,
    },
  });

  console.log(`📊 Found ${users.length} users to migrate\n`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const user of users) {
    if (!user.tenantId) {
      skipped++;
      console.log(`⏭️  Skipping user ${user.email} (no tenantId)`);
      continue;
    }

    try {
      // Check if UserTenant record already exists
      const existing = await prisma.userTenant.findUnique({
        where: {
          userId_tenantId: {
            userId: user.id,
            tenantId: user.tenantId,
          },
        },
      });

      if (existing) {
        skipped++;
        console.log(`⏭️  User ${user.email} already has UserTenant record`);
        continue;
      }

      // Create UserTenant record with owner role (first tenant = owner)
      await prisma.userTenant.create({
        data: {
          userId: user.id,
          tenantId: user.tenantId,
          role: 'owner', // First tenant is owner
          joinedAt: user.createdAt,
        },
      });

      migrated++;
      console.log(`✅ Migrated user ${user.email} to tenant ${user.tenant?.name || user.tenantId}`);
    } catch (error: any) {
      errors++;
      console.error(`❌ Error migrating user ${user.email}:`, error.message);
    }
  }

  console.log('\n📈 Migration Summary:');
  console.log(`   ✅ Migrated: ${migrated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log('\n✨ Migration complete!');
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

