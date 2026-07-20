import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { EpicsController } from './epics.controller';
import { EpicsService } from './epics.service';

@Module({
  imports: [PrismaModule, AuthModule, CommonModule],
  controllers: [EpicsController],
  providers: [EpicsService],
  exports: [EpicsService]
})
export class EpicsModule {}

