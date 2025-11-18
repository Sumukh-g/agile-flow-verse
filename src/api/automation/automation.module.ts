import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { AutomationController } from './automation.controller';
import { WorkflowService } from './workflow.service';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    AiModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [AutomationController],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class AutomationModule {}

