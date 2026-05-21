# 🚀 Complete Migration Fix - Run These Commands

## Step 1: Fix Database Permissions (REQUIRED)

Open PowerShell or Command Prompt and run:

```powershell
psql -U postgres -d agileflow_db -c "GRANT ALL ON SCHEMA public TO agileflow; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO agileflow; CREATE EXTENSION IF NOT EXISTS pg_stat_statements; CREATE EXTENSION IF NOT EXISTS vector;"
```

**Enter your postgres password when prompted.**

## Step 2: Run Migrations

After Step 1 succeeds, run:

```powershell
npx prisma migrate deploy
```

## Step 3: Generate Prisma Client

```powershell
npx prisma generate
```

## Step 4: Restart Backend

Stop and restart your backend server.

---

## ✅ That's It!

All tables (including `users`, `outbox`, etc.) will be created and your app will work.

