import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'dotenv/config';
import helmet from 'helmet';
import 'reflect-metadata';
import { AppModule } from './app.module';
import { validateEnvironment } from './common/config/env.validation';
import { CorrelationIdMiddleware } from './common/http/correlation-id.middleware';
import { ErrorFilter } from './common/http/error.filter';
import { IdempotencyInterceptor } from './common/http/idempotency.interceptor';
import { RateLimitMiddleware } from './common/http/rate-limit.middleware';
import { TenantContextInterceptor } from './common/tenant/tenant-context.interceptor';

async function bootstrap() {
  // Validate environment variables before starting
  validateEnvironment();
  
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'];
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: corsOrigins.length > 0 ? corsOrigins : true, // Allow all in development
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Request-Id', 'Idempotency-Key'],
    },
  });

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
  }));

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Correlation ID + Rate-limit
  app.use(CorrelationIdMiddleware);
  app.use(RateLimitMiddleware);

  // Error envelope
  app.useGlobalFilters(new ErrorFilter());

  // Idempotency for mutating requests
  app.useGlobalInterceptors(app.get(IdempotencyInterceptor));
  
  // Tenant context interceptor for multi-tenant support
  app.useGlobalInterceptors(app.get(TenantContextInterceptor));

  // Enhanced Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Agile Flow Verse API')
    .setDescription(`
      Enterprise-grade project management API with multi-tenant architecture.
      
      ## Features
      - **Real-time Updates**: WebSocket-based real-time synchronization
      - **Multi-tenant**: Complete tenant isolation with Row-Level Security
      - **Authentication**: JWT-based authentication with refresh tokens
      - **Project Management**: Full CRUD operations for projects and tasks
      - **Notes System**: Rich text notes with attachments
      - **Analytics**: Comprehensive analytics and reporting
      - **Search**: Full-text search across all entities
      
      ## Authentication
      All endpoints (except /v1/health) require Bearer token authentication.
      Include the token in the Authorization header: \`Authorization: Bearer <token>\`
      
      ## Multi-tenancy
      Requests are automatically scoped to the tenant based on the JWT token.
      No need to manually specify tenant ID in most cases.
      
      ## Rate Limiting
      - Production: 100 requests per 15 minutes per tenant
      - Development: 1000 requests per minute per tenant
      
      ## Error Handling
      All errors follow a consistent format:
      \`\`\`json
      {
        "traceId": "uuid",
        "code": "ErrorCode",
        "message": "Human-readable message",
        "details": {}
      }
      \`\`\`
      
      ## Idempotency
      Mutating requests (POST, PUT, PATCH, DELETE) support idempotency.
      Include an \`Idempotency-Key\` header with a unique value.
    `)
    .setVersion('1.0.0')
    .setContact('Agile Flow Verse', 'https://agileflowverse.com', 'support@agileflowverse.com')
    .setLicense('Proprietary', 'https://agileflowverse.com/license')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
      'bearer',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('projects', 'Project management')
    .addTag('tasks', 'Task management')
    .addTag('notes', 'Notes and documentation')
    .addTag('dashboard', 'Dashboard and analytics')
    .addTag('calendar', 'Calendar and scheduling')
    .addTag('notifications', 'Notifications')
    .addTag('search', 'Search functionality')
    .addTag('storage', 'File storage and attachments')
    .addTag('monitoring', 'System monitoring and metrics')
    .addTag('health', 'Health checks')
    .addServer('http://localhost:3000', 'Development server')
    .addServer('https://api.agileflowverse.com', 'Production server')
    .setExternalDoc('OpenAPI JSON', '/v1/docs-json')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  // Only serve Swagger UI in non-production
  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('/v1/docs', app, document, {
      jsonDocumentUrl: '/v1/docs-json',
      customSiteTitle: 'Agile Flow Verse API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  } else {
    // In production, only expose JSON (for API consumers)
    app.getHttpAdapter().get('/v1/docs-json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(document);
    });
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  Logger.log(`API listening on http://localhost:${port}`);
  Logger.log(`WebSocket Gateway available at ws://localhost:${port}/realtime`);
}
bootstrap(); 