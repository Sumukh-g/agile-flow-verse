# 🔧 Migration Fix - Complete Instructions

## Current Status
- ✅ 9 migrations ready to apply
- ❌ Permissions not granted to `agileflow` user
- ❌ Extensions not created
- ✅ Outbox service now handles missing tables gracefully

## What I Fixed
1. ✅ Made outbox relay service handle missing table errors (won't crash backend)
2. ✅ Created migration scripts and guides
3. ✅ Modified initial migration to handle extension errors gracefully

## What You Need to Do

### Step 1: Fix Permissions (REQUIRED - Run This First!)

Open PowerShell or Command Prompt and run:

```powershell
psql -U postgres -d agileflow_db -c "GRANT ALL ON SCHEMA public TO agileflow; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO agileflow; CREATE EXTENSION IF NOT EXISTS pg_stat_statements; CREATE EXTENSION IF NOT EXISTS vector;"
```

**Enter your postgres password when prompted.**

### Step 2: Run Migrations

After Step 1 succeeds, run:

```powershell
npx prisma migrate deploy
```

This will apply all 9 migrations and create all tables.

### Step 3: Generate Prisma Client

Stop your backend server, then run:

```powershell
npx prisma generate
```

### Step 4: Restart Backend

Restart your backend server. All errors should be gone!

---

## Quick Scripts Available

- `FIX_AND_RUN.ps1` - Interactive script (guides you through)
- `RUN_MIGRATIONS_NOW.bat` - Batch file version
- `RUN_MIGRATIONS_NOW.sql` - SQL file for permissions

---

## What Will Be Created

After migrations run, these tables will be created:
- ✅ `users` - User accounts
- ✅ `outbox` - Event outbox (stops the errors!)
- ✅ `projects` - Projects
- ✅ `tasks` - Tasks
- ✅ `tenants` - Tenants
- ✅ And 20+ more tables...

---

## After Migrations

Your backend will:
- ✅ Stop showing "table does not exist" errors
- ✅ Work with all features
- ✅ Have proper database schema

**Run Step 1 first, then Steps 2-4!**

