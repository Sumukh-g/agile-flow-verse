# Complete Setup Guide - Agile Flow Verse

## ✅ What I Fixed
I found and fixed the main backend error:
- **Problem**: 14 modules were using `JwtAuthGuard` but didn't import `AuthModule`
- **Fixed**: Added `AuthModule` to all affected modules
- **Status**: Backend code compiles successfully ✅

## 🚀 Manual Steps to Run the Application

### Step 1: Check Docker Services (Already Running ✅)
Your Docker containers are already running:
- ✅ PostgreSQL (agile-postgres) on port 5432
- ✅ Redis (agile-redis) on port 6379

### Step 2: Setup Database Schema
Open a **NEW terminal** in the project folder and run:
```bash
npx prisma db push --skip-generate
```
This will create all the database tables. Wait for it to complete.

### Step 3: Start the Backend
In the **SAME terminal**, run:
```bash
npm run api:start
```

**Expected Output:**
```
[Nest] LOG Environment validation passed ✓
[Nest] LOG Starting Nest application...
[Nest] LOG Nest application successfully started
API listening on http://localhost:3000
WebSocket Gateway available at ws://localhost:3000/realtime
```

**If you see an error:**
- Take a screenshot or copy the error message
- The error will likely be about database connection
- Keep this terminal window open

### Step 4: Test the Backend
Open **ANOTHER NEW terminal** and run:
```bash
curl http://localhost:3000/v1/health
```

**Expected Response:**
```json
{"status":"ok","database":"connected","redis":"connected"}
```

Or open in your browser: http://localhost:3000/v1/health

### Step 5: Start the Frontend
Open **ANOTHER NEW terminal** and run:
```bash
npm run dev
```

**Expected Output:**
```
VITE v6.x.x ready in xxx ms
➜  Local:   http://localhost:5173/
```

### Step 6: Access the Application
Open your browser and go to:
```
http://localhost:5173
```

---

## 🔧 If Backend Fails to Start

### Most Common Issues:

#### Issue 1: Database Connection Error
**Error:** `Authentication failed` or `Can't connect to database`

**Fix:**
```bash
# Reset PostgreSQL password
docker exec -it agile-postgres psql -U postgres -c "ALTER USER agileflow WITH PASSWORD 'agileflow_password';"

# Restart the container
docker restart agile-postgres

# Wait 5 seconds, then try starting backend again
```

#### Issue 2: Port 3000 Already in Use
**Error:** `Port 3000 is already in use`

**Fix:**
```bash
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace XXXXX with the PID from above)
taskkill /PID XXXXX /F

# Try starting backend again
```

#### Issue 3: Redis Connection Error
**Error:** `Can't connect to Redis`

**Fix:**
```bash
# Check if Redis is running
docker ps | findstr redis

# If not running, start it
docker start agile-redis

# Try starting backend again
```

---

## 📋 Current System Status

### ✅ Completed:
1. Fixed all module dependency issues (14 modules)
2. Backend compiles successfully
3. Docker services running (PostgreSQL, Redis)

### ⏳ Need to Complete:
1. Run database migrations (Step 2)
2. Start backend successfully (Step 3)
3. Verify backend is working (Step 4)
4. Start frontend (Step 5)
5. Test the full application (Step 6)

---

## 🎯 What to Do Next

### Option A: Follow Steps Above Manually
1. Open 3 separate terminal windows
2. Follow Step 2 → Step 3 → Step 5
3. Test the application

### Option B: Tell Me What Error You Get
1. Try running: `npm run api:start`
2. Copy the **ENTIRE error message** (including stack trace)
3. Paste it back to me
4. I'll fix the specific issue

---

## 📞 Quick Commands Reference

**Check if backend is running:**
```bash
netstat -ano | findstr :3000
```

**Check Docker services:**
```bash
docker ps
```

**View backend logs** (if you need to debug):
```bash
# While backend is running in another terminal, do:
curl http://localhost:3000/v1/health
```

**Stop backend:**
Press `Ctrl+C` in the terminal where it's running

---

## 🎉 Success Indicators

✅ Backend started successfully when you see:
- "Nest application successfully started"
- "API listening on http://localhost:3000"
- No errors in the terminal

✅ Frontend started successfully when you see:
- "VITE ready"
- "Local: http://localhost:5173"

✅ Application is working when:
- You can access http://localhost:5173
- Login page loads without errors
- You can sign up/login

---

**Current Status:** Ready to start backend ✨
**Estimated Time:** 5-10 minutes to get fully running


