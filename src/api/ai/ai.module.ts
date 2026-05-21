import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AgentsController } from './agents.controller';
import { ScrumAiController } from './scrum-ai.controller';
import { SprintPlannerService } from './sprint-planner.service';
import { EstimationService } from './estimation.service';
import { BurndownRiskService } from './burndown-risk.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AiController, AgentsController, ScrumAiController],
  providers: [AiService, SprintPlannerService, EstimationService, BurndownRiskService],
  exports: [AiService, SprintPlannerService, EstimationService, BurndownRiskService],
})
export class AiModule {} 