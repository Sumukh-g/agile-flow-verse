import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {} 