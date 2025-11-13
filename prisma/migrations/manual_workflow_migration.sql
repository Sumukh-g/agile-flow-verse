-- Manual migration for Workflow tables
-- This migration creates the workflows and workflow_executions tables
-- Run this manually if Prisma validation fails

-- CreateTable
CREATE TABLE IF NOT EXISTS "workflows" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "trigger" JSONB NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "workflow_executions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "workflows_tenantId_idx" ON "workflows"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "workflows_projectId_idx" ON "workflows"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "workflows_enabled_idx" ON "workflows"("enabled");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "workflow_executions_tenantId_idx" ON "workflow_executions"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "workflow_executions_workflowId_idx" ON "workflow_executions"("workflowId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "workflow_executions_createdAt_idx" ON "workflow_executions"("createdAt");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'workflows_tenantId_fkey'
    ) THEN
        ALTER TABLE "workflows" ADD CONSTRAINT "workflows_tenantId_fkey" 
            FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'workflows_projectId_fkey'
    ) THEN
        ALTER TABLE "workflows" ADD CONSTRAINT "workflows_projectId_fkey" 
            FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'workflow_executions_tenantId_fkey'
    ) THEN
        ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_tenantId_fkey" 
            FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'workflow_executions_workflowId_fkey'
    ) THEN
        ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflowId_fkey" 
            FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

