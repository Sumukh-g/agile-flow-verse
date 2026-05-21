import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AiModule } from './ai/ai.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { AutomationModule } from './automation/automation.module';
import { CalendarModule } from './calendar/calendar.module';
import { CommentsModule } from './comments/comments.module';
import { IdempotencyInterceptor } from './common/http/idempotency.interceptor';
import { KafkaModule } from './common/kafka/kafka.module';
import { HttpsRedirectMiddleware } from './common/middleware/https-redirect.middleware';
import { RedisModule } from './common/redis/redis.module';
import { CacheModule } from './common/cache/cache.module';
import { TenantContextInterceptor } from './common/tenant/tenant-context.interceptor';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { NotesModule } from './notes/notes.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OutboxModule } from './outbox/outbox.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { ProjectManagementModule } from './project-management/project-management.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ReportsModule } from './reports/reports.module';
import { SearchModule } from './search/search.module';
import { StorageModule } from './storage/storage.module';
import { TasksModule } from './tasks/tasks.module';
import { TimeLogsModule } from './time-logs/time-logs.module';
import { DatabaseOptimizationModule } from './common/database/database-optimization.module';
import { LoggingModule } from './common/logging/logging.module';
import { CrmModule } from './crm/crm.module';
import { FormsModule } from './forms/forms.module';
import { IssuesModule } from './issues/issues.module';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { KanbanModule } from './kanban/kanban.module';
import { GanttModule } from './gantt/gantt.module';
import { FinanceModule } from './finance/finance.module';
import { SprintsModule } from './sprints/sprints.module';
import { EpicsModule } from './epics/epics.module';

const conditionalModules = [];
if (process.env.NODE_ENV !== 'production') {
  try {
    const { TestModule } = require('./test/test.module');
    conditionalModules.push(TestModule);
  } catch (_) {}
}

@Module({
  imports: [
    ScheduleModule.forRoot(),
    LoggingModule,
    RedisModule,
    CacheModule,
    KafkaModule,
    PrismaModule,
    DatabaseOptimizationModule,
    CommonModule,
    AuthModule,
    HealthModule,
    DashboardModule,
    CalendarModule,
    RealtimeModule,
    ProjectsModule,
    ProjectManagementModule,
    TasksModule,
    TimeLogsModule,
    NotesModule,
    CommentsModule,
    OutboxModule,
    AiModule,
    NotificationsModule,
    AnalyticsModule,
    AutomationModule,
    StorageModule,
    SearchModule,
    MonitoringModule,
    ReportsModule,
    CrmModule,
    FormsModule,
    IssuesModule,
    UsersModule,
    KanbanModule,
    GanttModule,
    FinanceModule,
    SprintsModule,
    EpicsModule,
    ...conditionalModules,
  ],
  providers: [
    IdempotencyInterceptor,
    TenantContextInterceptor,
    HttpsRedirectMiddleware,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HttpsRedirectMiddleware)
      .forRoutes('*');
  }
} 