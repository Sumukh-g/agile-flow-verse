import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../common/redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { EnhancedAnalyticsService } from './enhanced-analytics.service';

@Module({
  imports: [AuthModule, PrismaModule, RedisModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, EnhancedAnalyticsService],
  exports: [AnalyticsService, EnhancedAnalyticsService],
})
export class AnalyticsModule {}




