import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { ProjectManagementController } from './project-management.controller';
import { GanttService } from './gantt.service';
import { ResourceManagementService } from './resource-management.service';

@Module({
  imports: [AuthModule, PrismaModule, CommonModule],
  controllers: [ProjectManagementController],
  providers: [GanttService, ResourceManagementService],
  exports: [GanttService, ResourceManagementService],
})
export class ProjectManagementModule {}

