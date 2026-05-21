# Quick Fix: Database Connection Error

## ✅ PostgreSQL is Running
Your PostgreSQL server is running on port 5432. The issue is authentication.

## Solution 1: Create the Database User (Recommended)

Run this command in PowerShell or Command Prompt:

```powershell
# Connect to PostgreSQL as the postgres superuser
psql -U postgres
```

Then run this SQL (or use the setup-database.sql file):

```sql
-- Create user
CREATE USER agileflow WITH PASSWORD 'agileflow_password';

-- Create database
CREATE DATABASE agileflow_db;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE agileflow_db TO agileflow;

-- Connect to the database
\c agileflow_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO agileflow;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO agileflow;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO agileflow;
```

**Or use the SQL file:**
```powershell
psql -U postgres -f setup-database.sql
```

## Solution 2: Use Default Postgres User

If you know your `postgres` user password, update your `.env` file:

```env
DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/agileflow_db"
```

Replace `YOUR_POSTGRES_PASSWORD` with your actual PostgreSQL password.

## Solution 3: Test Connection First

Test if you can connect with the postgres user:

```powershell
psql -U postgres -h localhost -d postgres
```

If this works, you can either:
- Use Solution 2 (update .env with postgres user)
- Or create the agileflow user using Solution 1

## After Fixing

1. **Restart your backend server**
2. **Run migrations** (if needed):
   ```bash
   npx prisma migrate dev
   ```

## Still Having Issues?

Check:
1. Is PostgreSQL password correct?
2. Does the database `agileflow_db` exist?
3. Does the user `agileflow` exist?
4. Are firewall rules blocking port 5432?

Run the diagnostic script:
```powershell
.\test-db-connection.ps1
```

