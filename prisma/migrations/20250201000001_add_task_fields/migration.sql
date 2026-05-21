-- Add missing task fields: tags, isBlocked, blockReason

-- Add tags array column
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add isBlocked boolean column
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "isBlocked" BOOLEAN DEFAULT false;

-- Add blockReason text column
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "blockReason" TEXT;

