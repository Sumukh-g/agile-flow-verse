import { Module } from '@nestjs/common';
import { GanttController } from './gantt.controller';
import { GanttService } from './gantt.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Gantt Module
 * Handles all Gantt chart functionality
 */
@Module({
  imports: [PrismaModule, RealtimeModule, CommonModule, AuthModule],
  controllers: [GanttController],
  providers: [GanttService],
  exports: [GanttService],
})
export class GanttModule {}

