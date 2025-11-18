/**
 * Seed Default AI Agents
 * 
 * Run with: tsx scripts/seed-agents.ts
 * Or: npm run seed-agents
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🤖 Seeding default AI agents...');

  // Get all tenants
  const tenants = await prisma.tenant.findMany();

  if (tenants.length === 0) {
    console.warn('⚠️  No tenants found. Please create a tenant first.');
    return;
  }

  for (const tenant of tenants) {
    console.log(`\n📦 Seeding agents for tenant: ${tenant.name} (${tenant.id})`);

    // Check if agents already exist
    const existingAgents = await prisma.agent.findMany({
      where: { tenantId: tenant.id },
    });

    if (existingAgents.length > 0) {
      console.log(`   ℹ️  Tenant already has ${existingAgents.length} agent(s), skipping...`);
      continue;
    }

    // Create default agents
    const agents = [
      {
        name: 'Intake Specialist',
        role: 'Intake',
        tools: ['normalize', 'structure'],
        description: 'Normalizes and structures project descriptions into clear requirements',
      },
      {
        name: 'Project Planner',
        role: 'Planner',
        tools: ['breakdown', 'estimate', 'schedule'],
        description: 'Breaks down projects into tasks, milestones, and phases',
      },
      {
        name: 'Communications Manager',
        role: 'Comms',
        tools: ['generate_update', 'format_message'],
        description: 'Generates professional status updates and stakeholder messages',
      },
      {
        name: 'Content Summarizer',
        role: 'Summarizer',
        tools: ['summarize', 'extract'],
        description: 'Summarizes notes, tasks, and project activity',
      },
    ];

    for (const agentData of agents) {
      const agent = await prisma.agent.create({
        data: {
          tenantId: tenant.id,
          name: agentData.name,
          role: agentData.role as any,
          tools: agentData.tools,
        },
      });

      console.log(`   ✅ Created agent: ${agent.name} (${agent.role})`);
    }
  }

  console.log('\n✨ Agent seeding complete!');
}

main()
  .catch((error) => {
    console.error('❌ Error seeding agents:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

