-- Upgrade Issue Tracker: Add enums, new statuses, componentId, and migrate existing data

-- Step 1: Create new enums (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IssueStatus') THEN
    CREATE TYPE "IssueStatus" AS ENUM (
      'INBOX',
      'NEEDS_INFO',
      'TRIAGED',
      'PLANNED',
      'READY_FOR_DEV',
      'IN_PROGRESS',
      'IN_REVIEW',
      'IN_QA',
      'DONE',
      'WONT_DO',
      'DUPLICATE',
      'ON_HOLD'
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IssueType') THEN
    CREATE TYPE "IssueType" AS ENUM (
      'BUG',
      'STORY',
      'TASK',
      'INCIDENT',
      'SUPPORT'
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IssueSeverity') THEN
    CREATE TYPE "IssueSeverity" AS ENUM (
      'CRITICAL',
      'MAJOR',
      'MINOR'
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IssuePriority') THEN
    CREATE TYPE "IssuePriority" AS ENUM (
      'P0',
      'P1',
      'P2',
      'P3'
    );
  END IF;
END $$;

-- Step 2: Add componentId column (nullable) - only if table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'issues') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'issues' AND column_name = 'componentId') THEN
      ALTER TABLE "issues" ADD COLUMN "componentId" TEXT;
    END IF;
  END IF;
END $$;

-- Step 3: Add indexes - only if table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'issues') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'issues_componentId_idx') THEN
      CREATE INDEX "issues_componentId_idx" ON "issues"("componentId");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'issues_type_idx') THEN
      CREATE INDEX "issues_type_idx" ON "issues"("type");
    END IF;
  END IF;
END $$;

-- Step 4: Migrate existing data - only if table exists and has data
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'issues') THEN
    -- Status mapping
    UPDATE "issues" SET "status" = 'INBOX' WHERE "status" = 'backlog';
    UPDATE "issues" SET "status" = 'READY_FOR_DEV' WHERE "status" = 'todo';
    UPDATE "issues" SET "status" = 'IN_PROGRESS' WHERE "status" = 'in-progress';
    UPDATE "issues" SET "status" = 'IN_REVIEW' WHERE "status" = 'review';
    UPDATE "issues" SET "status" = 'DONE' WHERE "status" = 'done';
    UPDATE "issues" SET "status" = 'WONT_DO' WHERE "status" = 'closed';

    -- Priority mapping: low -> P3, medium -> P2, high -> P1, critical -> P0
    UPDATE "issues" SET "priority" = 'P3' WHERE "priority" = 'low';
    UPDATE "issues" SET "priority" = 'P2' WHERE "priority" = 'medium';
    UPDATE "issues" SET "priority" = 'P1' WHERE "priority" = 'high';
    UPDATE "issues" SET "priority" = 'P0' WHERE "priority" = 'critical';

    -- Type mapping: bug -> BUG, feature -> STORY, task -> TASK, improvement -> TASK
    UPDATE "issues" SET "type" = 'BUG' WHERE "type" = 'bug';
    UPDATE "issues" SET "type" = 'STORY' WHERE "type" = 'feature';
    UPDATE "issues" SET "type" = 'TASK' WHERE "type" = 'task' OR "type" = 'improvement';

    -- Severity mapping: minor -> MINOR, major -> MAJOR, critical -> CRITICAL, blocker -> CRITICAL
    UPDATE "issues" SET "severity" = 'MINOR' WHERE "severity" = 'minor';
    UPDATE "issues" SET "severity" = 'MAJOR' WHERE "severity" = 'major';
    UPDATE "issues" SET "severity" = 'CRITICAL' WHERE "severity" = 'critical' OR "severity" = 'blocker';

    -- Ensure all values are valid enum values (set defaults for any invalid)
    UPDATE "issues" SET "status" = 'INBOX' WHERE "status" NOT IN ('INBOX', 'NEEDS_INFO', 'TRIAGED', 'PLANNED', 'READY_FOR_DEV', 'IN_PROGRESS', 'IN_REVIEW', 'IN_QA', 'DONE', 'WONT_DO', 'DUPLICATE', 'ON_HOLD');
    UPDATE "issues" SET "priority" = 'P2' WHERE "priority" NOT IN ('P0', 'P1', 'P2', 'P3');
    UPDATE "issues" SET "type" = 'TASK' WHERE "type" NOT IN ('BUG', 'STORY', 'TASK', 'INCIDENT', 'SUPPORT');
    UPDATE "issues" SET "severity" = NULL WHERE "severity" IS NOT NULL AND "severity" NOT IN ('CRITICAL', 'MAJOR', 'MINOR');
  END IF;
END $$;

-- Step 5: Convert columns to use enum types - only if table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'issues') THEN
    -- Check if columns are still TEXT type before converting
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'issues' AND column_name = 'status' AND data_type = 'text'
    ) THEN
      -- Drop default, convert type, then set new default
      ALTER TABLE "issues" ALTER COLUMN "status" DROP DEFAULT;
      ALTER TABLE "issues" ALTER COLUMN "status" TYPE "IssueStatus" USING "status"::"IssueStatus";
      ALTER TABLE "issues" ALTER COLUMN "status" SET DEFAULT 'INBOX'::"IssueStatus";
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'issues' AND column_name = 'priority' AND data_type = 'text'
    ) THEN
      -- Drop default, convert type, then set new default
      ALTER TABLE "issues" ALTER COLUMN "priority" DROP DEFAULT;
      ALTER TABLE "issues" ALTER COLUMN "priority" TYPE "IssuePriority" USING "priority"::"IssuePriority";
      ALTER TABLE "issues" ALTER COLUMN "priority" SET DEFAULT 'P2'::"IssuePriority";
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'issues' AND column_name = 'type' AND data_type = 'text'
    ) THEN
      -- Drop default, convert type, then set new default
      ALTER TABLE "issues" ALTER COLUMN "type" DROP DEFAULT;
      ALTER TABLE "issues" ALTER COLUMN "type" TYPE "IssueType" USING "type"::"IssueType";
      ALTER TABLE "issues" ALTER COLUMN "type" SET DEFAULT 'TASK'::"IssueType";
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'issues' AND column_name = 'severity' AND data_type = 'text'
    ) THEN
      -- Convert severity (no default to drop)
      ALTER TABLE "issues" ALTER COLUMN "severity" TYPE "IssueSeverity" USING "severity"::"IssueSeverity";
    END IF;

    -- Set default values (with proper enum casting)
    ALTER TABLE "issues" ALTER COLUMN "status" SET DEFAULT 'INBOX'::"IssueStatus";
    ALTER TABLE "issues" ALTER COLUMN "priority" SET DEFAULT 'P2'::"IssuePriority";
    ALTER TABLE "issues" ALTER COLUMN "type" SET DEFAULT 'TASK'::"IssueType";
  END IF;
END $$;

