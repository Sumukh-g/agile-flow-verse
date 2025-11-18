# 🐘 PostgreSQL Setup Guide

## Important: Port 5432 is NOT for Web Browsers

The error you see in the browser is **normal and expected**. Port 5432 is for PostgreSQL database connections, not HTTP/web traffic.

- ❌ Port 5432: PostgreSQL database (can't browse)
- ✅ Port 3000: Backend API (can browse)
- ✅ Port 5173: Frontend app (can browse)

---

## How to Start PostgreSQL

### Option 1: Windows Service (If PostgreSQL is installed)

```bash
# Check if PostgreSQL service exists
sc query | findstr postgresql

# Start the service (replace with your actual service name)
net start postgresql-x64-14
# or
net start postgresql-x64-15
# or
net start postgresql-x64-16
```

### Option 2: Start Manually (If installed via installer)

1. Open **Services** app (press Win + R, type `services.msc`)
2. Find "PostgreSQL" service
3. Right-click → Start

### Option 3: pgAdmin

If you have pgAdmin installed:
1. Open pgAdmin
2. Connect to your server (will start PostgreSQL automatically)

### Option 4: Docker (Recommended for Development)

If you don't have PostgreSQL installed:

```bash
# Pull and run PostgreSQL in Docker
docker run --name agile-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=agile_flow_verse -p 5432:5432 -d postgres:14

# Verify it's running
docker ps
```

---

## Verify PostgreSQL is Running

```bash
# Test connection
psql -U postgres -c "SELECT version();"

# Or check if port is listening
netstat -an | findstr :5432
```

If PostgreSQL is running, you should see output like:
```
TCP    0.0.0.0:5432    0.0.0.0:0    LISTENING
```

---

## If You Don't Have PostgreSQL Installed

### Quick Install Options:

#### Option 1: Official Installer
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer
3. Set password for postgres user
4. Port: 5432 (default)
5. Start service

#### Option 2: Docker (Fastest)
```bash
docker run --name agile-postgres ^
  -e POSTGRES_PASSWORD=postgres ^
  -e POSTGRES_DB=agile_flow_verse ^
  -e POSTGRES_USER=postgres ^
  -p 5432:5432 ^
  -d postgres:14
```

---

## After PostgreSQL is Running

### 1. Update your .env file
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/agile_flow_verse"
```

### 2. Create the database (if needed)
```bash
createdb -U postgres agile_flow_verse
# or
psql -U postgres -c "CREATE DATABASE agile_flow_verse;"
```

### 3. Run migrations
```bash
npx prisma migrate dev --name add_workflows
```

### 4. Start the backend
```bash
npm run api:dev
```

The backend will run on **http://localhost:3000** (THIS is what you browse to, not port 5432!)

---

## Access Points

Once everything is running:

- ✅ **Frontend**: http://localhost:5173
- ✅ **Backend API**: http://localhost:3000
- ✅ **API Docs**: http://localhost:3000/v1/docs
- ✅ **Health Check**: http://localhost:3000/v1/health
- ❌ **Database**: localhost:5432 (not browseable - database only)

---

## Quick Troubleshooting

### "Connection refused" on 5432
- PostgreSQL is not running
- Start it using one of the methods above

### "Database does not exist"
```bash
createdb -U postgres agile_flow_verse
```

### "Authentication failed"
- Wrong password in DATABASE_URL
- Check your .env file

---

**Bottom line**: You need to start PostgreSQL first, then run migrations, then start the backend on port 3000 (not 5432). Let me know when PostgreSQL is running!
