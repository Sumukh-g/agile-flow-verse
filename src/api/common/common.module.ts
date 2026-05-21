import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectPermissionsService } from './project-permissions.service';

@Module({
  imports: [PrismaModule],
  providers: [ProjectPermissionsService],
  exports: [ProjectPermissionsService],
})
export class CommonModule {}

