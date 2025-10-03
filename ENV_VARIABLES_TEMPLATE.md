# Environment Variables Template

## Development Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Application
NODE_ENV=development
PORT=4000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agile_flow_verse?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# Kafka (Optional)
KAFKA_BROKERS=localhost:9092

# Keycloak Authentication
KEYCLOAK_JWKS_URI=http://localhost:8080/realms/master/protocol/openid-connect/certs
KEYCLOAK_CLIENT_ID=agile-flow-verse
KEYCLOAK_ISSUER=http://localhost:8080/realms/master

# Frontend (Vite)
VITE_API_URL=http://localhost:4000
```

## Production Environment Variables

For production deployment, update the following:

```env
# Application
NODE_ENV=production
PORT=4000

# Database (use SSL in production)
DATABASE_URL=postgresql://user:password@your-db-host:5432/production_db?schema=public&sslmode=require

# Redis (use TLS in production)
REDIS_URL=rediss://your-redis-host:6379

# Kafka
KAFKA_BROKERS=your-kafka-host:9092

# Keycloak Authentication
KEYCLOAK_JWKS_URI=https://your-keycloak.com/realms/your-realm/protocol/openid-connect/certs
KEYCLOAK_CLIENT_ID=your-production-client-id
KEYCLOAK_ISSUER=https://your-keycloak.com/realms/your-realm

# Frontend
VITE_API_URL=https://api.your-domain.com
```

## Optional Environment Variables

### Storage Configuration
```env
STORAGE_PROVIDER=s3  # Options: local, s3, azure, gcs
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=us-east-1
```

### Email Configuration
```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@your-domain.com
```

### Monitoring
```env
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-license-key
```

### Security
```env
JWT_SECRET=your-secret-key-here
CORS_ORIGINS=https://your-domain.com
```

### Feature Flags
```env
ENABLE_AI_FEATURES=true
ENABLE_ANALYTICS=true
ENABLE_NOTIFICATIONS=true
```

## Quick Setup

1. Copy the development environment variables above
2. Create a `.env` file in the project root
3. Paste the variables
4. Update values as needed
5. Never commit `.env` to version control

