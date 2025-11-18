/**
 * Create a test user for development
 * Run with: tsx scripts/create-test-user.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Creating test user...\n');

  // Create or get tenant
  let tenant = await prisma.tenant.findFirst({
    where: { slug: 'demo' },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Demo Company',
        slug: 'demo',
        sku: 'enterprise',
      },
    });
    console.log('✅ Created tenant:', tenant.name);
  } else {
    console.log('📦 Using existing tenant:', tenant.name);
  }

  // Create or update test user
  const email = 'demo@example.com';
  const password = 'demo123';
  const hashedPassword = await bcrypt.hash(password, 10);

  let user = await prisma.user.findFirst({
    where: { email, tenantId: tenant.id },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: 'Demo User',
        password: hashedPassword,
        tenantId: tenant.id,
      },
    });
    console.log('✅ Created user:', user.email);
  } else {
    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    console.log('✅ Updated user:', user.email);
  }

  console.log('\n📝 Test Credentials:');
  console.log('   Email:', email);
  console.log('   Password:', password);
  console.log('\n🎉 You can now log in with these credentials!');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

