const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('📋 Checking existing users...\n');

  const users = await prisma.user.findMany({
    include: { tenant: true }
  });

  if (users.length === 0) {
    console.log('❌ No users found in database!');
  } else {
    console.log(`✅ Found ${users.length} user(s):\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Tenant: ${user.tenant.name} (${user.tenant.slug})`);
      console.log(`   Has Password: ${user.password ? 'YES' : 'NO'}`);
      console.log('');
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  });

