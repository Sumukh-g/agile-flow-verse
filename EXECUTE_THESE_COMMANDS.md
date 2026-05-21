# 🚀 Execute These Commands to Fix and Run Migrations

## ⚡ Quick Fix (Copy & Paste)

### 1. Fix Permissions (Run in PowerShell/CMD)

```powershell
psql -U postgres -d agileflow_db -c "GRANT ALL ON SCHEMA public TO agileflow; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO agileflow; CREATE EXTENSION IF NOT EXISTS pg_stat_statements; CREATE EXTENSION IF NOT EXISTS vector;"
```

**Enter your postgres password when prompted.**

### 2. Run Migrations

```powershell
npx prisma migrate deploy
```

### 3. Generate Prisma Client (Stop backend first!)

```powershell
npx prisma generate
```

### 4. Restart Backend

Stop and restart your backend server.

---

## ✅ Done!

All 9 migrations will be applied, creating:
- `users` table
- `outbox` table  
- All other required tables

Your app will work after restarting the backend!

