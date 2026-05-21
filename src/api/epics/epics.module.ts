import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EpicsController } from './epics.controller';
import { EpicsService } from './epics.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [EpicsController],
  providers: [EpicsService],
  exports: [EpicsService]
})
export class EpicsModule {}

