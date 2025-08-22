import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'dotenv/config';
import helmet from 'helmet';
import 'reflect-metadata';
import { AppModule } from './app.module';
import { CorrelationIdMiddleware } from './common/http/correlation-id.middleware';
import { ErrorFilter } from './common/http/error.filter';
import { IdempotencyInterceptor } from './common/http/idempotency.interceptor';
import { RateLimitMiddleware } from './common/http/rate-limit.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // Security
  app.use(helmet());

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

  // Swagger docs (dev only)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Agile Flow Verse API')
      .setDescription('Jira-style multi-tenant backend')
      .setVersion('1.0')
      .addBearerAuth()
      .setExternalDoc('OpenAPI JSON', '/v1/docs-json')
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/v1/docs', app, documentFactory, {
      jsonDocumentUrl: '/v1/docs-json',
    });
  }

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
  Logger.log(`API listening on http://localhost:${process.env.PORT || 3000}`);
}
bootstrap(); 