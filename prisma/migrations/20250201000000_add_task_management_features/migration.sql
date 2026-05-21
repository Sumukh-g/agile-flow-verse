-- Add task management features: subtasks, custom fields, and time logs

-- Add parentId and customFields to tasks table
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "parentId" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "customFields" JSONB;

-- Add foreign key for parentId (self-referential)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_parentId_fkey'
  ) THEN
    ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parentId_fkey" 
      FOREIGN KEY ("parentId") REFERENCES "tasks"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for parentId
CREATE INDEX IF NOT EXISTS "tasks_parentId_idx" ON "tasks"("parentId");

-- Create TimeLog table for time tracking entries
CREATE TABLE IF NOT EXISTS "time_logs" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "duration" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "time_logs_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys for time_logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'time_logs_taskId_fkey'
  ) THEN
    ALTER TABLE "time_logs" ADD CONSTRAINT "time_logs_taskId_fkey" 
      FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'time_logs_userId_fkey'
  ) THEN
    ALTER TABLE "time_logs" ADD CONSTRAINT "time_logs_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'time_logs_tenantId_fkey'
  ) THEN
    ALTER TABLE "time_logs" ADD CONSTRAINT "time_logs_tenantId_fkey" 
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes for time_logs
CREATE INDEX IF NOT EXISTS "time_logs_taskId_idx" ON "time_logs"("taskId");
CREATE INDEX IF NOT EXISTS "time_logs_userId_idx" ON "time_logs"("userId");
CREATE INDEX IF NOT EXISTS "time_logs_tenantId_idx" ON "time_logs"("tenantId");
CREATE INDEX IF NOT EXISTS "time_logs_startedAt_idx" ON "time_logs"("startedAt");

