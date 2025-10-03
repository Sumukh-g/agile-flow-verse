import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { CalendarModule } from './calendar/calendar.module';
import { CommentsModule } from './comments/comments.module';
import { IdempotencyInterceptor } from './common/http/idempotency.interceptor';
import { KafkaModule } from './common/kafka/kafka.module';
import { RedisModule } from './common/redis/redis.module';
import { TenantContextInterceptor } from './common/tenant/tenant-context.interceptor';
import { HealthModule } from './health/health.module';
import { NotesModule } from './notes/notes.module';
import { OutboxModule } from './outbox/outbox.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    RedisModule,
    KafkaModule,
    PrismaModule,
    AuthModule,
    HealthModule,
    ProjectsModule,
    TasksModule,
    NotesModule,
    CommentsModule,
    OutboxModule,
    AiModule,
    CalendarModule,
  ],
  providers: [
    IdempotencyInterceptor,
    TenantContextInterceptor,
  ],
})
export class AppModule {} 