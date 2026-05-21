# Issue Tracker Migration Instructions

## Problem
The migration failed because Prisma's shadow database validation couldn't find the `issues` table. This has been fixed by making the migration more defensive.

## Solution
The migration file has been updated to:
- Check if the `issues` table exists before trying to modify it
- Check if enums exist before creating them
- Check if columns exist before adding them
- Only convert columns if they're still TEXT type

## How to Apply the Migration

### Option 1: Using Prisma Migrate (Recommended)
Run this in your terminal (interactive mode required):

```bash
npx prisma migrate dev
```

This will:
1. Apply the migration to your database
2. Generate the Prisma client with new types
3. Update the migration history

### Option 2: Manual Application
If you prefer to apply it manually:

```bash
# 1. Apply the migration
npx prisma migrate deploy

# 2. Generate Prisma client
npx prisma generate

# 3. Restart your backend server
```

### Option 3: Direct SQL (If migrate commands fail)
You can also run the SQL directly in your PostgreSQL database:

```bash
psql -U your_user -d agileflow_db -f prisma/migrations/20250125120000_upgrade_issue_tracker/migration.sql
```

## Verification

After applying the migration, verify it worked:

1. **Check enums exist:**
   ```sql
   SELECT typname FROM pg_type WHERE typname IN ('IssueStatus', 'IssueType', 'IssuePriority', 'IssueSeverity');
   ```

2. **Check componentId column exists:**
   ```sql
   SELECT column_name FROM information_schema.columns WHERE table_name = 'issues' AND column_name = 'componentId';
   ```

3. **Check column types:**
   ```sql
   SELECT column_name, data_type, udt_name 
   FROM information_schema.columns 
   WHERE table_name = 'issues' 
   AND column_name IN ('status', 'priority', 'type', 'severity');
   ```

## What the Migration Does

1. ✅ Creates 4 new enum types (IssueStatus, IssueType, IssuePriority, IssueSeverity)
2. ✅ Adds `componentId` column to issues table
3. ✅ Creates indexes for componentId and type
4. ✅ Migrates existing data from old string values to new enum values
5. ✅ Converts TEXT columns to use the new enum types
6. ✅ Sets default values for new columns

## Rollback (If Needed)

If you need to rollback, you can create a reverse migration, but the data will have been converted to enum values, so you'd need to map them back to strings.

