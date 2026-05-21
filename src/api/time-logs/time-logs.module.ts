/**
 * Time Logs Module
 * 
 * Provides time tracking functionality for tasks.
 * 
 * Features:
 * - Start/stop timer for tasks
 * - Manual time log entries
 * - Time log history per task
 * - Total time calculation
 * 
 * Dependencies:
 * - AuthModule: For JWT authentication and guards
 * - PrismaModule: For database access
 * - RealtimeModule: For real-time updates
 * - CommonModule: For shared services
 */
import { Module } from '@nestjs/common';
import { TimeLogsController } from './time-logs.controller';
import { TimeLogsService } from './time-logs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  // AuthModule must be imported first to ensure JwtAuthGuard has access to AuthService
  // CacheModule is now @Global() so it doesn't need explicit import
  imports: [AuthModule, PrismaModule, RealtimeModule, CommonModule],
  controllers: [TimeLogsController],
  providers: [TimeLogsService],
  exports: [TimeLogsService],
})
export class TimeLogsModule {}

