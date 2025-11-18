"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const ai_module_1 = require("./ai/ai.module");
const analytics_module_1 = require("./analytics/analytics.module");
const auth_module_1 = require("./auth/auth.module");
const automation_module_1 = require("./automation/automation.module");
const calendar_module_1 = require("./calendar/calendar.module");
const comments_module_1 = require("./comments/comments.module");
const database_optimization_module_1 = require("./common/database/database-optimization.module");
const idempotency_interceptor_1 = require("./common/http/idempotency.interceptor");
const kafka_module_1 = require("./common/kafka/kafka.module");
const logging_module_1 = require("./common/logging/logging.module");
const https_redirect_middleware_1 = require("./common/middleware/https-redirect.middleware");
const redis_module_1 = require("./common/redis/redis.module");
const tenant_context_interceptor_1 = require("./common/tenant/tenant-context.interceptor");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const health_module_1 = require("./health/health.module");
const monitoring_module_1 = require("./monitoring/monitoring.module");
const notes_module_1 = require("./notes/notes.module");
const notifications_module_1 = require("./notifications/notifications.module");
const outbox_module_1 = require("./outbox/outbox.module");
const prisma_module_1 = require("./prisma/prisma.module");
const projects_module_1 = require("./projects/projects.module");
const project_management_module_1 = require("./project-management/project-management.module");
const realtime_module_1 = require("./realtime/realtime.module");
const reports_module_1 = require("./reports/reports.module");
const search_module_1 = require("./search/search.module");
const storage_module_1 = require("./storage/storage.module");
const tasks_module_1 = require("./tasks/tasks.module");
const test_module_1 = require("./test/test.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(https_redirect_middleware_1.HttpsRedirectMiddleware)
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            logging_module_1.LoggingModule,
            redis_module_1.RedisModule,
            kafka_module_1.KafkaModule,
            prisma_module_1.PrismaModule,
            database_optimization_module_1.DatabaseOptimizationModule,
            auth_module_1.AuthModule,
            health_module_1.HealthModule,
            dashboard_module_1.DashboardModule,
            calendar_module_1.CalendarModule,
            realtime_module_1.RealtimeModule,
            projects_module_1.ProjectsModule,
            project_management_module_1.ProjectManagementModule,
            tasks_module_1.TasksModule,
            notes_module_1.NotesModule,
            comments_module_1.CommentsModule,
            outbox_module_1.OutboxModule,
            ai_module_1.AiModule,
            notifications_module_1.NotificationsModule,
            analytics_module_1.AnalyticsModule,
            automation_module_1.AutomationModule,
            storage_module_1.StorageModule,
            search_module_1.SearchModule,
            monitoring_module_1.MonitoringModule,
            reports_module_1.ReportsModule,
            test_module_1.TestModule,
        ],
        providers: [
            idempotency_interceptor_1.IdempotencyInterceptor,
            tenant_context_interceptor_1.TenantContextInterceptor,
            https_redirect_middleware_1.HttpsRedirectMiddleware,
        ],
    })
], AppModule);
