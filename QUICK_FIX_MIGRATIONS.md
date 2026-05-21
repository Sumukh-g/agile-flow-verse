# Quick Fix: Migration Errors

## Problem
1. Migrations fail because PostgreSQL extensions require superuser privileges
2. The `outbox` table doesn't exist because migrations haven't been applied

## Solution

### Step 1: Create Extensions as Superuser

You're already connected as `postgres` superuser. Run these commands:

```sql
-- Connect to your database
\c agileflow_db

-- Create extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS vector;
```

### Step 2: Run Migrations

After creating extensions, run migrations using `migrate deploy` (doesn't use shadow database):

```powershell
npx prisma migrate deploy
```

**OR** if you want to use `migrate dev` (for development):

```powershell
npx prisma migrate dev
```

### Step 3: Generate Prisma Client

```powershell
npx prisma generate
```

## Alternative: If Extensions Still Fail

I've modified the migration file to handle extension creation gracefully. If extensions can't be created, the migration will continue (with a notice) and you can create them manually later.

## What I Fixed

1. ✅ Modified `20250811103941_init/migration.sql` to handle extension creation errors gracefully
2. ✅ Created `setup-extensions.sql` for manual extension setup
3. ✅ Created `fix-migrations.ps1` helper script

## Quick Commands

```powershell
# 1. Create extensions (as postgres superuser)
psql -U postgres -d agileflow_db -f setup-extensions.sql

# 2. Deploy migrations
npx prisma migrate deploy

# 3. Generate client
npx prisma generate
```

