import { Module } from '@nestjs/common';
import { DatabaseOptimizationService } from './database-optimization.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DatabaseOptimizationService],
  exports: [DatabaseOptimizationService],
})
export class DatabaseOptimizationModule {}

