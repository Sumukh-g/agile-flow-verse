@echo off
echo Creating test user...
echo.

REM Use node to hash password and create user
node -e "const bcrypt = require('bcrypt'); const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function main() { const tenant = await prisma.tenant.upsert({ where: { slug: 'demo' }, update: {}, create: { name: 'Demo Company', slug: 'demo', sku: 'enterprise' } }); console.log('Tenant:', tenant.name); const hash = await bcrypt.hash('demo123', 10); const user = await prisma.user.upsert({ where: { email: 'demo@example.com' }, update: { password: hash }, create: { email: 'demo@example.com', name: 'Demo User', password: hash, tenantId: tenant.id } }); console.log('User created:', user.email); console.log('Password: demo123'); } main().then(() => prisma.$disconnect()).catch(e => { console.error(e); process.exit(1); });"

echo.
echo Done! Login with: demo@example.com / demo123
pause

