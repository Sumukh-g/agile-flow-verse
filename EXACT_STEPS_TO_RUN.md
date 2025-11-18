# 🎯 EXACT STEPS TO GET EVERYTHING WORKING

## Run these commands EXACTLY in this order:

### STEP 1: Install Missing Dependencies

Open terminal in your project folder and run:

```bash
npm install socket.io-client bcrypt @types/bcrypt @types/node
```

Wait for it to complete.

### STEP 2: Install All Dependencies

```bash
npm install
```

### STEP 3: Generate Prisma Client

```bash
npx prisma generate
```

### STEP 4: Start Docker Containers

**Make sure Docker Desktop is running first!**

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Wait 10 seconds for containers to start.

###STEP 5: Run Database Migrations

```bash
npx prisma migrate deploy
```

If this fails, run:

```bash
npx prisma migrate dev --name init
```

### STEP 6: Start the Backend

Open a NEW terminal and run:

```bash
npm run api:dev
```

**DO NOT CLOSE THIS TERMINAL**

You should see:
```
[Nest] INFO [NestApplication] Nest application successfully started
Application is running on: http://localhost:3000
```

### STEP 7: Test Backend

Open a NEW terminal (keep backend running) and test:

```bash
curl http://localhost:3000/v1/health
```

You should see: `{"status":"ok"}`

Or open in browser: http://localhost:3000/v1/health

### STEP 8: Start the Frontend

In another NEW terminal (keep backend running):

```bash
npm run dev
```

You should see:
```
VITE ready in xxx ms
➜  Local:   http://localhost:5173/
```

### STEP 9: Access the Application

Open browser: **http://localhost:5173**

---

## If You Get Errors:

### Error: "socket.io-client not found"
**Fix**: Run `npm install socket.io-client`

### Error: "bcrypt not found"
**Fix**: Run `npm install bcrypt @types/bcrypt`

### Error: "Cannot connect to database"
**Fixes**:
1. Check Docker is running: `docker ps`
2. Restart containers: `docker-compose -f docker-compose.dev.yml restart`
3. Check .env file has: `DATABASE_URL="postgresql://agileflow:agileflow_password@localhost:5432/agileflow_db"`

### Error: "Prisma Client not generated"
**Fix**: Run `npx prisma generate`

### Error: "Port 3000 already in use"
**Fixes**:
Windows:
```cmd
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

Mac/Linux:
```bash
lsof -ti:3000 | xargs kill -9
```

### Frontend shows "Failed to fetch"
**Fixes**:
1. Make sure backend is running
2. Check backend logs for errors
3. Try: http://localhost:3000/v1/health in browser

---

## To Test Everything:

### 1. Test Backend Health
```bash
curl http://localhost:3000/v1/health
```

### 2. View API Documentation
Open: http://localhost:3000/v1/docs

### 3. Test Signup
Open: http://localhost:5173/signup

Fill in:
- Name: Test User
- Email: test@example.com
- Password: Test1234!

Click "Sign Up"

### 4. Test Login
Open: http://localhost:5173/login

Use the credentials you just created.

### 5. Test Dashboard
After logging in, you should see the dashboard.

### 6. Test Notifications
Go to: http://localhost:5173/notifications

You should see the notifications center (even if empty).

---

## Quick Commands Reference

**Start everything:**
```bash
# Terminal 1: Databases
docker-compose -f docker-compose.dev.yml up -d

# Terminal 2: Backend
npm run api:dev

# Terminal 3: Frontend
npm run dev
```

**Stop everything:**
```bash
# Stop frontend: Ctrl+C in terminal 3
# Stop backend: Ctrl+C in terminal 2
# Stop databases:
docker-compose -f docker-compose.dev.yml down
```

**Restart everything:**
```bash
docker-compose -f docker-compose.dev.yml restart
# Then restart backend and frontend (Ctrl+C and rerun commands)
```

---

## OR Just Run The Fix Script:

**Windows:**
```cmd
FIX_EVERYTHING.bat
```

Then follow the instructions to start backend and frontend.

---

**Current Status**: Ready to run  
**Estimated Setup Time**: 5-10 minutes  
**Success Criteria**: Frontend loads at http://localhost:5173 without errors

