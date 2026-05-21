-- AlterTable: Make projectId nullable to support personal tasks
ALTER TABLE "tasks" ALTER COLUMN "projectId" DROP NOT NULL;

-- CreateIndex: Add index for projectId (including null values for personal tasks)
CREATE INDEX IF NOT EXISTS "tasks_projectId_idx" ON "tasks"("projectId");

