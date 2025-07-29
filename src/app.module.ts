import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthGuard } from './common/guards/auth.guard';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { FeatureModule } from './feature/feature.module';
import { OutboxModule } from './outbox/outbox.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectModule } from './project/project.module';
import { TimesheetModule } from './timesheet/timesheet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    FeatureModule,
    ProjectModule,
    TimesheetModule,
    OutboxModule,
  ],
  providers: [
    TenantContextMiddleware,
    AuthGuard,
  ],
})
export class AppModule {} 