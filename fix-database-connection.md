# Fix Database Connection Issue

## Problem
The backend is failing to connect to PostgreSQL with error:
```
Authentication failed against database server at `localhost`, the provided database credentials for `postgres` are not valid.
```

## Current Configuration
Your `.env` file has:
```
DATABASE_URL="postgresql://agileflow:agileflow_password@localhost:5432/agileflow_db"
```

## Solutions

### Option 1: Use Default PostgreSQL User (Easiest)

If you have PostgreSQL installed with the default `postgres` user, update your `.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/agileflow_db"
```

Replace `YOUR_POSTGRES_PASSWORD` with your actual PostgreSQL password.

### Option 2: Create the User and Database

If you want to use the `agileflow` user, connect to PostgreSQL and run:

```sql
-- Connect as postgres superuser first
-- psql -U postgres

-- Create user
CREATE USER agileflow WITH PASSWORD 'agileflow_password';

-- Create database
CREATE DATABASE agileflow_db;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE agileflow_db TO agileflow;

-- Connect to the database and grant schema privileges
\c agileflow_db
GRANT ALL ON SCHEMA public TO agileflow;
```

### Option 3: Check if PostgreSQL is Running

1. **Check if PostgreSQL service is running:**
   ```powershell
   Get-Service -Name "*postgres*"
   ```

2. **If not running, start it:**
   ```powershell
   # Find the service name first
   Get-Service | Where-Object {$_.Name -like "*postgres*"}
   
   # Then start it (replace SERVICE_NAME with actual name)
   Start-Service SERVICE_NAME
   ```

3. **Or start PostgreSQL manually:**
   - Open Services (services.msc)
   - Find "postgresql" service
   - Right-click → Start

### Option 4: Verify Connection

Test your connection string:

```powershell
# Using psql (if installed)
psql "postgresql://agileflow:agileflow_password@localhost:5432/agileflow_db"
```

Or test with the postgres user:
```powershell
psql -U postgres -h localhost -d postgres
```

## Quick Fix Script

Run this PowerShell script to test and fix:

```powershell
# Test connection
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/agileflow_db"
# Try connecting - if this works, update your .env file
```

## Recommended Next Steps

1. **First, try Option 1** - Use the default `postgres` user
2. **Update your `.env` file** with the correct password
3. **Restart your backend server**
4. **Run migrations** if needed: `npx prisma migrate dev`

