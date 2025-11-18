const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Creating test user with VERIFIED credentials...\n');
  
  // First, create or get tenant
  let tenant = await prisma.tenant.upsert({
    where: { slug: 'testcompany' },
    update: {},
    create: {
      name: 'Test Company',
      slug: 'testcompany',
      sku: 'enterprise',
    },
  });
  
  console.log('✅ Tenant:', tenant.name, '(' + tenant.id + ')');
  
  // Hash the password
  const password = 'Test123!';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create user
  const user = await prisma.user.upsert({
    where: { email: 'test@test.com' },
    update: {
      password: hashedPassword,
      tenantId: tenant.id,
    },
    create: {
      email: 'test@test.com',
      name: 'Test User',
      password: hashedPassword,
      tenantId: tenant.id,
    },
  });
  
  console.log('✅ User:', user.email);
  console.log('\n📝 LOGIN WITH:');
  console.log('   Email: test@test.com');
  console.log('   Password: Test123!');
  console.log('\n🎉 Ready to login!');
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

