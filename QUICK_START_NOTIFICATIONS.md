# 🚀 Quick Start Guide - Notifications Center

Get the Notifications Center feature up and running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Access to the codebase
- Terminal/Command prompt

---

## Step 1: Database Setup (2 minutes)

```bash
# 1. Apply the migration
psql -d your_database_name -f prisma/migrations/20250107000000_add_notification_features/migration.sql

# 2. Generate Prisma client
npx prisma generate

# Expected output: ✔ Generated Prisma Client
```

**Verify it worked:**
```bash
psql -d your_database_name -c "\d notifications"
# You should see: archived, source, category columns

psql -d your_database_name -c "\d notification_services"
# You should see the notification_services table
```

---

## Step 2: Start Backend (1 minute)

```bash
# 1. Install dependencies (if not done)
npm install

# 2. Start the backend
npm run api:dev

# Expected output:
# [Nest] INFO  [NestApplication] Nest application successfully started
# Application is running on: http://localhost:3000
```

**Verify it works:**
```bash
# Open in browser or use curl
curl http://localhost:3000/v1/health

# Expected: {"status":"ok"}
```

---

## Step 3: Start Frontend (1 minute)

```bash
# In a new terminal window

# 1. Install dependencies (if not done)
npm install

# 2. Start the frontend
npm run dev

# Expected output:
# VITE v6.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
```

---

## Step 4: Test the Feature (1 minute)

### Option A: Via Browser UI

1. **Open the notifications page:**
   ```
   http://localhost:5173/notifications
   ```

2. **You should see:**
   - Empty notifications list (or existing notifications)
   - Services panel on the left
   - Search and filter controls

3. **Try these actions:**
   - ✅ Click "Add Service" (+) button
   - ✅ Add a service (e.g., "Test Service")
   - ✅ Toggle service on/off
   - ✅ Click refresh button

### Option B: Via API (using cURL)

```bash
# Get your auth token first (from localStorage or login)
TOKEN="your_jwt_token_here"

# 1. Create a test notification
curl -X POST "http://localhost:3000/v1/notifications" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "system",
    "title": "Test Notification",
    "message": "This is a test",
    "priority": "high"
  }'

# 2. Get all notifications
curl -X GET "http://localhost:3000/v1/notifications" \
  -H "Authorization: Bearer $TOKEN"

# 3. Get unread count
curl -X GET "http://localhost:3000/v1/notifications/unread-count" \
  -H "Authorization: Bearer $TOKEN"
```

### Option C: Via Swagger UI

1. **Open Swagger:**
   ```
   http://localhost:3000/v1/docs
   ```

2. **Authorize:**
   - Click "Authorize" button at top
   - Enter: `Bearer YOUR_JWT_TOKEN`

3. **Test endpoints:**
   - Try `POST /v1/notifications` to create
   - Try `GET /v1/notifications` to list
   - Try `PUT /v1/notifications/mark-read` to mark as read

---

## Step 5: Verify Real-time (Optional)

1. **Open two browser windows side by side:**
   - Window 1: `http://localhost:5173/notifications`
   - Window 2: Same URL

2. **Create a notification via API:**
   ```bash
   curl -X POST "http://localhost:3000/v1/notifications" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "system",
       "title": "Real-time Test",
       "message": "Testing WebSocket",
       "priority": "urgent"
     }'
   ```

3. **Expected result:**
   - Notification appears in BOTH windows instantly
   - Unread count updates in BOTH windows
   - Toast notification appears (for high/urgent)

---

## Common Issues & Fixes

### Issue: "Database connection failed"

**Fix:**
```bash
# Check PostgreSQL is running
psql -d your_database_name -c "SELECT 1"

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Should be: postgresql://user:password@localhost:5432/dbname
```

### Issue: "Prisma Client not generated"

**Fix:**
```bash
npx prisma generate
```

### Issue: "Port 3000 already in use"

**Fix:**
```bash
# Kill the process using port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

### Issue: "Cannot GET /v1/notifications - 401 Unauthorized"

**Fix:**
```bash
# You need a valid JWT token
# Option 1: Login via the UI and get token from localStorage
# Option 2: Use the test module to generate a token
# Option 3: Check if JWT_SECRET is set in .env
```

### Issue: "Frontend shows error: Failed to fetch"

**Fix:**
```bash
# 1. Make sure backend is running
curl http://localhost:3000/v1/health

# 2. Check CORS configuration in backend
# 3. Check API_CONFIG.baseURL in src/config/api.config.ts
```

---

## Running Tests

### Backend Tests
```bash
npm test -- src/api/notifications/notifications.service.spec.ts

# Expected: All tests pass
```

### Frontend Tests
```bash
npm test -- src/hooks/useNotifications.test.ts

# Expected: All tests pass
```

---

## API Quick Reference

### Base URL
```
http://localhost:3000/v1/notifications
```

### Key Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List all notifications |
| GET | `/notifications/unread-count` | Get unread count |
| POST | `/notifications` | Create notification |
| PUT | `/notifications/mark-read` | Mark as read |
| PUT | `/notifications/archive` | Archive notifications |
| DELETE | `/notifications/:id` | Delete notification |
| GET | `/notifications/services` | List services |
| POST | `/notifications/services` | Add service |

---

## Next Steps

1. **Read the full documentation:**
   - `NOTIFICATIONS_API_DOCUMENTATION.md` - Complete API reference
   - `NOTIFICATIONS_VERIFICATION_CHECKLIST.md` - Testing guide
   - `NOTIFICATIONS_FEATURE_COMPLETE_SUMMARY.md` - Implementation details

2. **Customize the feature:**
   - Add your own notification types
   - Configure email/Slack integrations
   - Customize UI colors and themes
   - Add notification preferences

3. **Deploy to production:**
   - Follow deployment instructions in the complete summary
   - Run the verification checklist
   - Set up monitoring and alerts
   - Configure backups

---

## Help & Support

- **Swagger UI**: http://localhost:3000/v1/docs
- **API Docs**: `NOTIFICATIONS_API_DOCUMENTATION.md`
- **Testing Guide**: `NOTIFICATIONS_VERIFICATION_CHECKLIST.md`

---

**Status**: ✅ Ready to Use  
**Setup Time**: ~5 minutes  
**Difficulty**: Easy

Happy coding! 🎉

