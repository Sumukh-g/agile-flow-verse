const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Creating test user...\n');

  // Create or get tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo',
      sku: 'enterprise'
    }
  });
  
  console.log('✅ Tenant:', tenant.name, '(', tenant.id, ')');

  // Hash password
  const hash = await bcrypt.hash('demo123', 10);
  
  // Create or update user
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: { password: hash },
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      password: hash,
      tenantId: tenant.id
    }
  });
  
  console.log('✅ User:', user.email);
  console.log('\n📝 Login Credentials:');
  console.log('   Email: demo@example.com');
  console.log('   Password: demo123');
  console.log('\n🎉 You can now login!');
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  });

