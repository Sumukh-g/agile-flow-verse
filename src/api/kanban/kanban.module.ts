import { Module } from '@nestjs/common';
import { KanbanController } from './kanban.controller';
import { KanbanService } from './kanban.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Kanban Module
 * Handles all Kanban board functionality
 */
@Module({
  imports: [PrismaModule, RealtimeModule, CommonModule, AuthModule],
  controllers: [KanbanController],
  providers: [KanbanService],
  exports: [KanbanService],
})
export class KanbanModule {}

