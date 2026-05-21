-- Note scope and ownership foundation
-- Assumption: all existing notes are project notes and can be attributed to the parent project's creator.

-- 1) Add enum and columns
CREATE TYPE "NoteScope" AS ENUM ('PERSONAL', 'PROJECT');

ALTER TABLE "notes"
ADD COLUMN "scope" "NoteScope",
ADD COLUMN "createdById" TEXT,
ADD COLUMN "updatedById" TEXT,
ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "deletedAt" TIMESTAMP(3);

-- 2) Backfill existing rows as project-scoped
UPDATE "notes"
SET "scope" = 'PROJECT'
WHERE "scope" IS NULL;

UPDATE "notes" n
SET "createdById" = p."createdBy"
FROM "projects" p
WHERE n."projectId" = p."id"
  AND n."createdById" IS NULL;

-- Fail fast if assumption is violated.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "notes" WHERE "createdById" IS NULL) THEN
    RAISE EXCEPTION 'Backfill failed: notes.createdById contains NULL values after project creator backfill';
  END IF;
END $$;

-- 3) Tighten constraints for new model
ALTER TABLE "notes"
ALTER COLUMN "scope" SET NOT NULL,
ALTER COLUMN "scope" SET DEFAULT 'PERSONAL',
ALTER COLUMN "createdById" SET NOT NULL,
ALTER COLUMN "projectId" DROP NOT NULL;

ALTER TABLE "notes"
ADD CONSTRAINT "notes_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notes"
ADD CONSTRAINT "notes_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notes"
ADD CONSTRAINT "notes_scope_project_constraint"
CHECK (
  ("scope" = 'PROJECT' AND "projectId" IS NOT NULL)
  OR ("scope" = 'PERSONAL' AND "projectId" IS NULL)
);

-- 4) Indexes for scoped listings and soft deletes
CREATE INDEX "notes_tenantId_scope_createdById_idx" ON "notes"("tenantId", "scope", "createdById");
CREATE INDEX "notes_tenantId_projectId_idx" ON "notes"("tenantId", "projectId");
CREATE INDEX "notes_tenantId_parentId_idx" ON "notes"("tenantId", "parentId");
CREATE INDEX "notes_tenantId_deletedAt_idx" ON "notes"("tenantId", "deletedAt");
CREATE INDEX "notes_tenantId_updatedAt_idx" ON "notes"("tenantId", "updatedAt");
