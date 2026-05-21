import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { RedisModule } from '../common/redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { CalendarReminderJob } from './calendar-reminder.job';

@Module({
  imports: [AuthModule, PrismaModule, RedisModule, CommonModule, NotificationsModule],
  controllers: [CalendarController],
  providers: [CalendarService, CalendarReminderJob],
  exports: [CalendarService],
})
export class CalendarModule {}




