import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectManagementController } from './project-management.controller';
import { GanttService } from './gantt.service';
import { ResourceManagementService } from './resource-management.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ProjectManagementController],
  providers: [GanttService, ResourceManagementService],
  exports: [GanttService, ResourceManagementService],
})
export class ProjectManagementModule {}

