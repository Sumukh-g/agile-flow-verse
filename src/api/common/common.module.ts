import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectPermissionsService } from './project-permissions.service';
import { TenantAdminGuard } from './guards/tenant-admin.guard';

@Module({
  imports: [PrismaModule],
  providers: [ProjectPermissionsService, TenantAdminGuard],
  exports: [ProjectPermissionsService, TenantAdminGuard],
})
export class CommonModule {}

