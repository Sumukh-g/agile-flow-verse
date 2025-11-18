# 🔧 Fix and Run Guide - Step by Step

## ⚠️ CRITICAL: Application Cannot Run Yet

Several fixes are required before testing can begin.

---

## 🔴 Step 1: Install Missing Dependencies (REQUIRED)

```bash
cd "C:\Users\cenas\.cursor\worktrees\agile-flow-verse\DhuBE"

# Install Socket.IO packages
npm install @nestjs/platform-socket.io@^10.0.0 socket.io@^4.7.0 --legacy-peer-deps

# Install Event Emitter for automation
npm install @nestjs/event-emitter --save

# Install additional dependencies if needed
npm install
```

**WHY**: The real-time and automation modules require these packages.

---

## 🔴 Step 2: Fix app.module.ts (REQUIRED)

Replace the contents of `src/api/app.module.ts` with the contents of `src/api/app.module.FIXED.ts`

```bash
# On Windows (PowerShell):
Copy-Item "src/api/app.module.FIXED.ts" "src/api/app.module.ts" -Force

# Or manually copy/paste the content
```

**WHY**: The current app.module.ts is missing imports for the new modules we created.

---

## 🔴 Step 3: Update Prisma Schema (REQUIRED)

### Add these models to `prisma/schema.prisma`:

```prisma
// Add to Tenant model (find the existing Tenant model and add these lines):
model Tenant {
  // ... existing fields ...
  workflows          Workflow[]
  workflowExecutions WorkflowExecution[]
}

// Add to Project model:
model Project {
  // ... existing fields ...
  workflows Workflow[]
}

// Add these NEW models at the end of the file:

model Workflow {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  description String?
  enabled     Boolean  @default(true)
  trigger     Json
  conditions  Json
  actions     Json
  projectId   String?
  
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  project     Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  executions  WorkflowExecution[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
  @@index([projectId])
  @@index([enabled])
  @@map("workflows")
}

model WorkflowExecution {
  id         String   @id @default(cuid())
  tenantId   String
  workflowId String
  status     String
  data       Json
  error      String?
  
  tenant     Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  workflow   Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  
  createdAt  DateTime @default(now())

  @@index([tenantId])
  @@index([workflowId])
  @@index([createdAt])
  @@map("workflow_executions")
}
```

**WHY**: The automation module needs these database tables.

---

## 🔴 Step 4: Generate Prisma Client and Run Migrations (REQUIRED)

```bash
# Generate the Prisma client with new models
npx prisma generate

# Create and run the migration
npx prisma migrate dev --name add_workflows_and_enhancements

# Apply performance indexes
psql -d your_database_name -f prisma/migrations/add_performance_indexes.sql

# Or if you have different credentials:
psql -U your_username -d your_database_name -f prisma/migrations/add_performance_indexes.sql
```

**WHY**: Database needs to have the new tables and indexes.

---

## 🟡 Step 5: Configure Environment Variables (OPTIONAL but recommended)

Create/update `.env` file:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/agile_flow_verse"
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL="redis://localhost:6379"

# Kafka (optional)
KAFKA_BROKERS="localhost:9092"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRATION="15m"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_REFRESH_EXPIRATION="7d"

# API
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info
PRISMA_QUERY_LOG=0

# CORS (optional)
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"
```

---

## ✅ Step 6: Start the Application

### Terminal 1 - Start Backend:
```bash
cd "C:\Users\cenas\.cursor\worktrees\agile-flow-verse\DhuBE"
npm run api:dev
```

**Expected output**:
```
[Nest] ... LOG [NestFactory] Starting Nest application...
[Nest] ... LOG [InstanceLoader] LoggingModule dependencies initialized
[Nest] ... LOG [InstanceLoader] PrismaModule dependencies initialized
[Nest] ... LOG [PrismaService] Database connected successfully
[Nest] ... LOG [PrismaService] Database connection verified
[Nest] ... LOG [NestApplication] Nest application successfully started
[Nest] ... LOG API listening on http://localhost:3000
[Nest] ... LOG WebSocket Gateway available at ws://localhost:3000/realtime
```

### Terminal 2 - Test Health Check:
```bash
curl http://localhost:3000/v1/health
```

**Expected response**:
```json
{
  "ok": true,
  "ts": "2024-01-01T00:00:00.000Z"
}
```

### Browser - Check API Docs:
Open: `http://localhost:3000/v1/docs`

You should see the Swagger UI with all endpoints.

---

## ✅ Step 7: Basic Testing

### Test 1: Health Check
```bash
curl http://localhost:3000/v1/health/detailed
```

**Should return**:
```json
{
  "status": "ok",
  "timestamp": "...",
  "services": {
    "database": { "status": "healthy", "latency": 5 },
    "redis": { "status": "healthy", "latency": 2 }
  }
}
```

### Test 2: WebSocket Connection
Open browser console and run:
```javascript
const socket = io('http://localhost:3000/realtime');
socket.on('connect', () => console.log('Connected!'));
```

### Test 3: Create a Test User (if auth is set up)
```bash
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User",
    "tenantId": "test-tenant"
  }'
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module '@nestjs/platform-socket.io'"
**Fix**: Run Step 1 again

### Issue: "Cannot find module './automation/automation.module'"
**Fix**: Run Step 2 again (replace app.module.ts)

### Issue: "Cannot find module './realtime/realtime.module'"
**Fix**: Check if `src/api/realtime` directory exists. If not, the module files need to be created.

### Issue: "Table 'workflows' does not exist"
**Fix**: Run Step 4 again (Prisma migrations)

### Issue: "Port 3000 already in use"
**Fix**: 
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Issue: "Database connection failed"
**Fix**: 
1. Make sure PostgreSQL is running
2. Check DATABASE_URL in .env file
3. Test connection: `psql -U your_user -d agile_flow_verse -c "SELECT 1;"`

### Issue: "Redis connection failed"
**Fix**:
1. Make sure Redis is running
2. Test connection: `redis-cli ping` (should return PONG)
3. Check REDIS_URL in .env file

---

## 📊 Success Criteria

When everything is working, you should see:

✅ Backend starts without errors
✅ All modules load successfully
✅ Database connection healthy
✅ Redis connection healthy
✅ WebSocket gateway active
✅ API docs accessible at `/v1/docs`
✅ Health check returns `{ "ok": true }`
✅ 60+ endpoints visible in Swagger
✅ No TypeScript compilation errors
✅ No linter errors

---

## 🎯 Next Steps After Success

1. Run full test suite: `npm test`
2. Test real-time features
3. Test data synchronization
4. Test all CRUD operations
5. Test automation workflows
6. Generate reports
7. Check performance metrics

---

## 🆘 If Still Blocked

If you're still encountering issues after following all steps:

1. Check all error messages carefully
2. Verify all dependencies are installed: `npm list`
3. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
4. Check TypeScript compilation: `npx tsc --noEmit`
5. Check for any console errors

---

## Current Status

After completing ALL steps above:
- **Step 1**: ⏳ Pending
- **Step 2**: ⏳ Pending  
- **Step 3**: ⏳ Pending
- **Step 4**: ⏳ Pending
- **Step 5**: ⏳ Optional
- **Step 6**: ⏳ Blocked until 1-4 complete
- **Step 7**: ⏳ Blocked until Step 6

**YOU MUST COMPLETE STEPS 1-4 BEFORE THE APPLICATION CAN RUN** ⚠️

