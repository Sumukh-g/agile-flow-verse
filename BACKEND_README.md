# Agile Flow Verse Backend

Enterprise-grade NestJS 10 backend with multi-tenant architecture, feature flags, and event-driven design.

## 🏗️ Architecture

### Tech Stack
- **Runtime**: Node.js 20
- **Framework**: NestJS 10
- **Database**: PostgreSQL 16 with Row-Level Security
- **ORM**: Prisma
- **Cache**: Redis 7
- **Message Queue**: Apache Kafka
- **Authentication**: Keycloak
- **Event Pattern**: Outbox Pattern

### Multi-Tenant Design
- Row-Level Security (RLS) on all tenant-scoped tables
- Tenant context middleware sets PostgreSQL session variables
- Feature flags per tenant with SKU-based defaults
- Audit logging for compliance

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- pnpm (recommended)

### 1. Start Infrastructure
```bash
# Start all services (Postgres, Redis, Kafka, Keycloak)
docker-compose up -d

# Wait for services to be ready (check logs)
docker-compose logs -f
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Database Setup
```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Seed database with feature flags and default tenant
pnpm seed
```

### 4. Start Development Server
```bash
pnpm start:dev
```

The API will be available at `http://localhost:3000`

## 📋 API Endpoints

### Projects (Feature: `wbs_gantt`)
```
GET    /projects              # List all projects
GET    /projects/:id          # Get project details
POST   /projects              # Create new project
PUT    /projects/:id          # Update project
DELETE /projects/:id          # Delete project
GET    /projects/:id/tasks    # Get project tasks
```

### Timesheets
```
POST   /timesheets            # Create timesheet entry (emits Kafka event)
```

### Headers Required
```
Authorization: Bearer <jwt-token>
x-tenant-id: <tenant-id>
```

## 🔧 Feature Flags

### Available Features
| Key | Name | Description | Category |
|-----|------|-------------|----------|
| `wbs_gantt` | WBS & Gantt Charts | Project planning features | basic |
| `risk_register` | Risk Register | Risk management tools | pro |
| `ai_insights` | AI Insights | AI-powered insights | enterprise |
| `advanced_analytics` | Advanced Analytics | Custom dashboards | enterprise |
| `custom_integrations` | Custom Integrations | API integrations | enterprise |
| `priority_support` | Priority Support | Dedicated support | enterprise |

### SKU Mapping
- **Basic**: `wbs_gantt` only
- **Pro**: `wbs_gantt` + `risk_register`
- **Enterprise**: All features enabled

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:cov

# Watch mode
pnpm test:watch
```

### Feature Flag Tests
```bash
# Test project endpoints with disabled feature
pnpm test src/project/project.controller.spec.ts
```

## 🔄 Event Outbox Pattern

The backend uses the Outbox Pattern for reliable event publishing:

1. **Domain Event**: Timesheet created
2. **Outbox Entry**: Event stored in `outbox` table within same transaction
3. **Scheduled Processor**: Runs every 10 seconds, publishes to Kafka
4. **Reliability**: Events are never lost, even if Kafka is down

### Kafka Topics
- `timesheet.recorded` - When timesheet entries are created

## 🔒 Security

### Row-Level Security
All tenant-scoped tables have RLS policies:
```sql
CREATE POLICY projects_by_tenant ON projects
  USING (tenant_id = current_setting('app.current_tenant')::text);
```

### Authentication
- JWT tokens issued by Keycloak
- `AuthGuard` validates tokens and populates `req.user`
- `TenantContextMiddleware` sets tenant context in PostgreSQL session

## 📊 Database Schema

### Core Tables
- `tenants` - Multi-tenant organizations
- `users` - System users (scoped to tenant)
- `projects` - Project management (scoped to tenant)
- `tasks` - Project tasks (scoped to tenant)
- `timesheets` - Time tracking (scoped to tenant)
- `feature_flags` - Available features
- `tenant_features` - Feature enablement per tenant
- `audit_logs` - Compliance logging
- `outbox` - Event publishing queue

### Relationships
- All tenant-scoped tables have `tenantId` foreign key
- Cascade deletes ensure data consistency
- Audit logs track all changes

## 🐳 Docker Services

### Infrastructure Stack
- **PostgreSQL 16**: Main database with pg_cron extension
- **Redis 7**: Caching and session storage
- **Apache Kafka**: Event streaming platform
- **Zookeeper**: Kafka coordination
- **Keycloak**: Identity and access management

### Development Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f postgres

# Stop all services
docker-compose down

# Reset volumes (careful!)
docker-compose down -v
```

## 🔧 Development

### Prisma Commands
```bash
# Generate client after schema changes
pnpm prisma:generate

# Create and apply migration
pnpm prisma:migrate

# Open Prisma Studio
pnpm prisma:studio

# Reset database (careful!)
pnpm prisma migrate reset
```

### Environment Variables
Copy `env.example` to `.env` and configure:
```bash
cp env.example .env
```

### Keycloak Setup
1. Access Keycloak at `http://localhost:8080`
2. Login with `admin/admin`
3. Create realm: `agile-flow-verse`
4. Create client: `agile-flow-verse-backend`
5. Configure client secret and redirect URIs

## 📈 Monitoring

### Health Checks
- Database connectivity
- Redis connectivity
- Kafka connectivity
- Feature flag status

### Logging
- Structured logging with NestJS Logger
- Audit trail for all data changes
- Kafka event publishing logs

## 🚀 Production Deployment

### Checklist
- [ ] Configure production database
- [ ] Set up Redis cluster
- [ ] Configure Kafka cluster
- [ ] Set up Keycloak production instance
- [ ] Configure environment variables
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline

### Environment Variables
```bash
# Production database
DATABASE_URL="postgresql://user:pass@prod-db:5432/agile_flow_verse"

# Production services
REDIS_URL="redis://prod-redis:6379"
KAFKA_BROKERS="prod-kafka:9092"

# Security
KEYCLOAK_URL="https://auth.company.com"
KEYCLOAK_CLIENT_SECRET="prod-secret"

# Application
NODE_ENV=production
PORT=3000
```

## 🤝 Contributing

1. Follow NestJS style guide
2. Write unit tests for new features
3. Update documentation
4. Use conventional commits
5. Test with multiple tenants

## 📞 Support

For backend issues:
1. Check logs: `docker-compose logs -f`
2. Verify database: `pnpm prisma studio`
3. Test endpoints with Postman/curl
4. Check feature flag status
5. Verify tenant context is set

---

**Note**: This is the first slice of the backend. Additional modules (users, roles, advanced analytics) will be added incrementally. 