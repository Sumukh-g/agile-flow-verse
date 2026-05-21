-- AlterTable
ALTER TABLE "projects" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "projects" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "projects_deletedAt_idx" ON "projects"("deletedAt");
CREATE INDEX "projects_archived_idx" ON "projects"("archived");

