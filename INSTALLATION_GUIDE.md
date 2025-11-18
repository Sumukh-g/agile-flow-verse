# 🚀 Installation & Setup Guide

Complete guide to get your world-class project management application running in production.

---

## 📋 Prerequisites

- Node.js 18+ or 20+
- PostgreSQL 14+
- Redis 6+
- npm or yarn

---

## 🔧 Step 1: Install Dependencies

### Backend Dependencies
```bash
cd src/api

# Install base dependencies
npm install

# Install Socket.IO for real-time features
npm install @nestjs/platform-socket.io@^10.0.0 socket.io@^4.7.0 --legacy-peer-deps

# Install Event Emitter for automation
npm install @nestjs/event-emitter --save

# Install testing framework (optional but recommended)
npm install --save-dev jest @types/jest ts-jest @nestjs/testing
```

### Frontend Dependencies
```bash
# Frontend dependencies should already be installed
npm install
```

---

## 🗄️ Step 2: Database Setup

### 1. Create PostgreSQL Database
```bash
# Create database
createdb agile_flow_verse

# Or using psql
psql -U postgres -c "CREATE DATABASE agile_flow_verse;"
```

### 2. Update Prisma Schema
Add the Workflow models to your `prisma/schema.prisma`:

```prisma
// Add to Tenant model relations:
model Tenant {
  // ... existing fields ...
  workflows          Workflow[]
  workflowExecutions WorkflowExecution[]
}

// Add to Project model relations:
model Project {
  // ... existing fields ...
  workflows Workflow[]
}

// Add these new models at the end of the file:
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

### 3. Run Prisma Migrations
```bash
# Generate Prisma client
npx prisma generate

# Create and run migration
npx prisma migrate dev --name add_workflows

# Or for production
npx prisma migrate deploy
```

### 4. Apply Performance Indexes
```bash
# Apply the performance indexes migration
psql -d agile_flow_verse -f prisma/migrations/add_performance_indexes.sql

# Or if using a different user
psql -U your_user -d agile_flow_verse -f prisma/migrations/add_performance_indexes.sql
```

---

## 🔐 Step 3: Environment Configuration

### 1. Create Environment File
```bash
cp env.example .env
```

### 2. Configure Environment Variables

Edit `.env` with your values:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/agile_flow_verse?schema=public"
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL="redis://localhost:6379"

# Kafka (optional for event-driven features)
KAFKA_BROKERS="localhost:9092"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRATION="15m"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-too"
JWT_REFRESH_EXPIRATION="7d"

# API
PORT=3000
NODE_ENV=development  # Change to 'production' for production

# Frontend
VITE_API_URL=http://localhost:3000

# Logging
LOG_LEVEL=info  # debug, info, warn, error
PRISMA_QUERY_LOG=0  # Set to 1 to enable query logging

# Error Tracking (Optional - for Sentry)
# SENTRY_DSN=your-sentry-dsn
# SENTRY_ENVIRONMENT=production

# Monitoring (Optional - for Datadog)
# DATADOG_API_KEY=your-datadog-api-key
# DATADOG_SITE=datadoghq.com
```

---

## ▶️ Step 4: Start Application

### Development Mode

#### Start Backend
```bash
cd src/api
npm run api:dev
```

Backend will run on `http://localhost:3000`

#### Start Frontend
```bash
# In a new terminal
npm run dev
```

Frontend will run on `http://localhost:5173` (or similar)

### Production Mode

#### Build Backend
```bash
cd src/api
npm run build
```

#### Start Backend
```bash
npm run api:start:prod
```

#### Build Frontend
```bash
npm run build
```

#### Serve Frontend
```bash
npm run preview
# Or use a static server like nginx, Apache, or Vercel
```

---

## 📚 Step 5: Verify Installation

### 1. Check API Health
```bash
curl http://localhost:3000/v1/health
```

Expected response:
```json
{
  "ok": true,
  "ts": "2024-01-01T00:00:00.000Z"
}
```

### 2. Check Detailed Health
```bash
curl http://localhost:3000/v1/health/detailed
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": { "status": "healthy", "latency": 5 },
    "redis": { "status": "healthy", "latency": 2 }
  }
}
```

### 3. Access API Documentation
Open your browser and navigate to:
- Swagger UI: `http://localhost:3000/v1/docs`
- OpenAPI JSON: `http://localhost:3000/v1/docs-json`

### 4. Access Frontend
Open your browser and navigate to:
- `http://localhost:5173` (or your frontend URL)

---

## 🧪 Step 6: Run Tests (Optional)

### Unit Tests
```bash
cd src/api
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage
```bash
npm run test:cov
```

---

## 🐳 Step 7: Docker Setup (Optional)

### 1. Create docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: agileflow
      POSTGRES_PASSWORD: agileflow
      POSTGRES_DB: agile_flow_verse
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://agileflow:agileflow@postgres:5432/agile_flow_verse
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
  redis_data:
```

### 2. Start with Docker
```bash
docker-compose up -d
```

---

## 🚀 Step 8: Production Deployment

### Database
1. Use managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
2. Enable connection pooling (PgBouncer)
3. Set up automated backups
4. Apply performance indexes

### Redis
1. Use managed Redis (AWS ElastiCache, Redis Cloud, etc.)
2. Enable persistence (AOF or RDB)
3. Set up replication for high availability

### Backend
1. Build production bundle: `npm run build`
2. Use process manager (PM2, systemd)
3. Enable HTTPS
4. Set up load balancer
5. Configure rate limiting
6. Enable monitoring (Datadog, New Relic)
7. Enable error tracking (Sentry)

#### PM2 Example
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/main.js --name agile-flow-api

# Save PM2 config
pm2 save

# Set up PM2 to start on boot
pm2 startup
```

### Frontend
1. Build: `npm run build`
2. Deploy to CDN (Vercel, Netlify, Cloudflare Pages)
3. Or serve with nginx/Apache

#### Nginx Example
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/agile-flow/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📊 Step 9: Monitoring Setup

### Application Monitoring
```bash
# Install Datadog (optional)
npm install dd-trace --save

# Add to main.ts
import tracer from 'dd-trace';
tracer.init();
```

### Error Tracking
```bash
# Install Sentry
npm install @sentry/node @sentry/nestjs

# Add to main.ts
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

---

## ✅ Verification Checklist

- [ ] PostgreSQL database created and accessible
- [ ] Redis server running and accessible
- [ ] Prisma migrations applied successfully
- [ ] Performance indexes applied
- [ ] Environment variables configured
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Health check endpoints responding
- [ ] API documentation accessible
- [ ] WebSocket connections working
- [ ] Real-time updates functioning
- [ ] Database queries optimized
- [ ] Redis caching working
- [ ] All tests passing (if implemented)

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql -U your_user -d agile_flow_verse -c "SELECT 1;"

# Check PostgreSQL logs
tail -f /var/log/postgresql/postgresql.log
```

### Redis Connection Issues
```bash
# Test Redis connection
redis-cli ping

# Should return: PONG
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Prisma Issues
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Force regenerate client
npx prisma generate --force
```

---

## 📞 Support

If you encounter issues:
1. Check the logs: `pm2 logs` or `docker-compose logs`
2. Review error messages in browser console
3. Check API documentation: `/v1/docs`
4. Verify environment variables are correct
5. Ensure all services (PostgreSQL, Redis) are running

---

## 🎉 Success!

Your world-class project management application is now running!

### Next Steps:
1. Create your first tenant/organization
2. Add team members
3. Create a project
4. Set up workflows
5. Generate your first report

Enjoy your production-ready application! 🚀

