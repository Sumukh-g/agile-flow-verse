"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const correlation_id_middleware_1 = require("./common/http/correlation-id.middleware");
const error_filter_1 = require("./common/http/error.filter");
const idempotency_interceptor_1 = require("./common/http/idempotency.interceptor");
const rate_limit_middleware_1 = require("./common/http/rate-limit.middleware");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { cors: true });
    // Security
    app.use((0, helmet_1.default)());
    // Global validation
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    // Correlation ID + Rate-limit
    app.use(correlation_id_middleware_1.CorrelationIdMiddleware);
    app.use(rate_limit_middleware_1.RateLimitMiddleware);
    // Error envelope
    app.useGlobalFilters(new error_filter_1.ErrorFilter());
    // Idempotency for mutating requests
    app.useGlobalInterceptors(app.get(idempotency_interceptor_1.IdempotencyInterceptor));
    // Swagger docs (dev only)
    if (process.env.NODE_ENV !== 'production') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('Agile Flow Verse API')
            .setDescription('Jira-style multi-tenant backend')
            .setVersion('1.0')
            .addBearerAuth()
            .setExternalDoc('OpenAPI JSON', '/v1/docs-json')
            .build();
        const documentFactory = () => swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('/v1/docs', app, documentFactory, {
            jsonDocumentUrl: '/v1/docs-json',
        });
    }
    await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
    common_1.Logger.log(`API listening on http://localhost:${process.env.PORT || 3000}`);
}
bootstrap();
