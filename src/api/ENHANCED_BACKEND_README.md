# Enhanced Agile Flow Verse Backend

A comprehensive, enterprise-grade backend system built with NestJS, featuring multi-tenancy, real-time notifications, analytics, file storage, search, and comprehensive monitoring.

## 🚀 Features

### Core Features
- **Multi-tenant Architecture**: Complete tenant isolation with Row Level Security (RLS)
- **Authentication & Authorization**: JWT-based auth with refresh tokens and role-based access control
- **Project Management**: Full CRUD operations with member management
- **Task Management**: Advanced task tracking with dependencies, assignees, and time tracking
- **Notes System**: Rich text notes with attachments and comments
- **Real-time Notifications**: In-app, email, and webhook notifications
- **Analytics & Reporting**: Comprehensive analytics for projects, tasks, and users
- **File Storage**: Secure file upload and management system
- **Full-text Search**: Advanced search across all entities
- **Monitoring & Logging**: Comprehensive system monitoring and audit logging

### Technical Features
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for performance optimization
- **Message Queue**: Kafka for event-driven architecture
- **API Documentation**: Swagger/OpenAPI documentation
- **Validation**: Comprehensive DTO validation with class-validator
- **Error Handling**: Global error handling with custom error filters
- **Rate Limiting**: Built-in rate limiting middleware
- **Idempotency**: Request idempotency for safe retries
- **Health Checks**: System health monitoring
- **Testing**: Comprehensive test suite

## 📁 Project Structure

```
src/api/
├── auth/                    # Authentication & Authorization
│   ├── auth.module.ts
│   ├── auth.service.ts
│   └── jwt-auth.guard.ts
├── projects/                # Project Management
│   ├── projects.module.ts
│   ├── projects.controller.ts
│   ├── projects.service.ts
│   └── dto.ts
├── tasks/                   # Task Management
│   ├── tasks.module.ts
│   ├── tasks.controller.ts
│   ├── tasks.service.ts
│   └── dto.ts
├── notes/                   # Notes System
│   ├── notes.module.ts
│   ├── notes.controller.ts
│   ├── notes.service.ts
│   └── dto.ts
├── notifications/            # Notification System
│   ├── notifications.module.ts
│   ├── notifications.controller.ts
│   ├── notifications.service.ts
│   └── dto.ts
├── analytics/              # Analytics & Reporting
│   ├── analytics.module.ts
│   ├── analytics.controller.ts
│   ├── analytics.service.ts
│   └── dto.ts
├── storage/                # File Storage
│   ├── storage.module.ts
│   ├── storage.controller.ts
│   ├── storage.service.ts
│   └── dto.ts
├── search/                 # Search System
│   ├── search.module.ts
│   ├── search.controller.ts
│   ├── search.service.ts
│   └── dto.ts
├── monitoring/             # Monitoring & Logging
│   ├── monitoring.module.ts
│   ├── monitoring.controller.ts
│   └── monitoring.service.ts
├── test/                   # Testing Suite
│   ├── test.module.ts
│   ├── test.controller.ts
│   └── test.service.ts
├── common/                 # Shared Components
│   ├── http/              # HTTP middleware & filters
│   ├── kafka/             # Kafka integration
│   ├── redis/             # Redis integration
│   └── tenant/            # Tenant context
├── prisma/                # Database
│   ├── prisma.module.ts
│   └── prisma.service.ts
└── app.module.ts          # Main application module
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Kafka 2.8+

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/agile_flow_verse"

# Redis
REDIS_URL="redis://localhost:6379"

# Kafka
KAFKA_BROKERS="localhost:9092"

# JWT
JWT_SECRET="your-jwt-secret-key"

# Keycloak (Optional)
KEYCLOAK_JWKS_URI="http://localhost:8080/realms/master/protocol/openid-connect/certs"
KEYCLOAK_CLIENT_ID="agile-flow-verse"
KEYCLOAK_ISSUER="http://localhost:8080/realms/master"

# File Storage
UPLOAD_DIR="./uploads"

# Application
PORT=3000
NODE_ENV=development
```

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```

3. **Start Services**
   ```bash
   # Start Redis
   redis-server

   # Start Kafka
   kafka-server-start.sh config/server.properties

   # Start PostgreSQL
   pg_ctl start
   ```

4. **Run Application**
   ```bash
   npm run api:dev
   ```

## 📚 API Documentation

### Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

### Core Endpoints

#### Projects
- `GET /v1/projects` - List projects
- `POST /v1/projects` - Create project
- `GET /v1/projects/:id` - Get project
- `PUT /v1/projects/:id` - Update project
- `DELETE /v1/projects/:id` - Delete project

#### Tasks
- `GET /v1/tasks` - List tasks
- `POST /v1/tasks` - Create task
- `GET /v1/tasks/:id` - Get task
- `PUT /v1/tasks/:id` - Update task
- `DELETE /v1/tasks/:id` - Delete task

#### Notifications
- `GET /v1/notifications` - List notifications
- `POST /v1/notifications` - Create notification
- `PUT /v1/notifications/mark-read` - Mark as read
- `GET /v1/notifications/unread-count` - Get unread count

#### Analytics
- `GET /v1/analytics/projects/:id` - Project analytics
- `GET /v1/analytics/tasks` - Task analytics
- `GET /v1/analytics/users/:id` - User analytics
- `GET /v1/analytics/tenant` - Tenant analytics

#### Storage
- `POST /v1/storage/upload` - Upload file
- `GET /v1/storage/attachments/:id` - Get attachment
- `GET /v1/storage/attachments/:id/download` - Download file
- `DELETE /v1/storage/attachments/:id` - Delete attachment

#### Search
- `GET /v1/search` - Search across all entities
- `GET /v1/search/suggestions` - Get search suggestions
- `GET /v1/search/recent` - Get recent searches

#### Monitoring
- `GET /v1/monitoring/system` - System metrics
- `GET /v1/monitoring/health` - Health status
- `GET /v1/monitoring/audit-logs` - Audit logs

### Swagger Documentation
Visit `http://localhost:3000/v1/docs` for interactive API documentation.

## 🔧 Configuration

### Database Configuration
The system uses PostgreSQL with Prisma ORM. Key configurations:

- **Multi-tenancy**: Row Level Security (RLS) enabled
- **Migrations**: Automatic schema migrations
- **Seeding**: Database seeding for development

### Redis Configuration
Redis is used for:
- Session storage
- Caching
- Rate limiting
- Real-time features

### Kafka Configuration
Kafka is used for:
- Event streaming
- Outbox pattern
- Real-time notifications
- Audit logging

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

### Test Endpoints
- `GET /v1/test/database` - Database tests
- `GET /v1/test/redis` - Redis tests
- `GET /v1/test/performance` - Performance tests
- `GET /v1/test/integration` - Integration tests
- `POST /v1/test/load` - Load tests

## 📊 Monitoring

### Health Checks
- `GET /v1/monitoring/health` - System health status
- `GET /v1/monitoring/system` - System metrics
- `GET /v1/monitoring/performance` - Performance metrics

### Logging
- Structured logging with Winston
- Audit logging for all operations
- Error tracking and monitoring

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Production Considerations
- Environment variables configuration
- Database connection pooling
- Redis clustering
- Kafka partitioning
- Load balancing
- SSL/TLS configuration

## 🔒 Security

### Authentication
- JWT-based authentication
- Refresh token rotation
- Role-based access control (RBAC)
- Multi-factor authentication support

### Authorization
- Tenant-based isolation
- Resource-level permissions
- API rate limiting
- Input validation and sanitization

### Data Protection
- Encryption at rest
- Encryption in transit
- Secure file storage
- Audit logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API documentation at `/v1/docs`

---

**Built with ❤️ using NestJS, Prisma, PostgreSQL, Redis, and Kafka**





