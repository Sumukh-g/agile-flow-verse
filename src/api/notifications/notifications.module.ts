import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { KafkaModule } from '../common/kafka/kafka.module';
import { RedisModule } from '../common/redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [AuthModule, PrismaModule, KafkaModule, RedisModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}




