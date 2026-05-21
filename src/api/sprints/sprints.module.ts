import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { SprintsController } from './sprints.controller';
import { SprintsService } from './sprints.service';
import { DoDService } from './dod.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SprintsController],
  providers: [SprintsService, DoDService],
  exports: [SprintsService, DoDService]
})
export class SprintsModule {}

