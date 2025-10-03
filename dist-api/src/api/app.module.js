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
const auth_module_1 = require("./auth/auth.module");
const calendar_module_1 = require("./calendar/calendar.module");
const comments_module_1 = require("./comments/comments.module");
const idempotency_interceptor_1 = require("./common/http/idempotency.interceptor");
const kafka_module_1 = require("./common/kafka/kafka.module");
const redis_module_1 = require("./common/redis/redis.module");
const tenant_context_interceptor_1 = require("./common/tenant/tenant-context.interceptor");
const health_module_1 = require("./health/health.module");
const notes_module_1 = require("./notes/notes.module");
const outbox_module_1 = require("./outbox/outbox.module");
const prisma_module_1 = require("./prisma/prisma.module");
const projects_module_1 = require("./projects/projects.module");
const tasks_module_1 = require("./tasks/tasks.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            redis_module_1.RedisModule,
            kafka_module_1.KafkaModule,
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            health_module_1.HealthModule,
            projects_module_1.ProjectsModule,
            tasks_module_1.TasksModule,
            notes_module_1.NotesModule,
            comments_module_1.CommentsModule,
            outbox_module_1.OutboxModule,
            ai_module_1.AiModule,
            calendar_module_1.CalendarModule,
        ],
        providers: [
            idempotency_interceptor_1.IdempotencyInterceptor,
            tenant_context_interceptor_1.TenantContextInterceptor,
        ],
    })
], AppModule);
