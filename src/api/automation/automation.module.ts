import { Module, OnModuleInit } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../common/redis/redis.module';

// ─── Registries ─────────────────────────────────────────────────────────────
import { TriggerRegistry } from './registry/trigger.registry';
import { ConditionRegistry } from './registry/condition.registry';
import { ActionRegistry } from './registry/action.registry';

// ─── Trigger handlers ────────────────────────────────────────────────────────
import {
  TaskStatusChangedTrigger,
  TaskCreatedTrigger,
  TaskAssignedTrigger,
  IssueStatusChangedTrigger,
  ProjectCreatedTrigger,
} from './registry/triggers/index';

// ─── Condition handlers ──────────────────────────────────────────────────────
import {
  FieldEqualsCondition,
  FieldNotEqualsCondition,
  FieldContainsCondition,
  FieldNotContainsCondition,
  FieldGreaterThanCondition,
  FieldLessThanCondition,
  FieldIsEmptyCondition,
  FieldIsNotEmptyCondition,
  UserHasRoleCondition,
} from './registry/conditions/index';

// ─── Action handlers ─────────────────────────────────────────────────────────
import { UpdateTaskAction, CreateTaskAction, AssignTaskAction } from './registry/actions/task.actions';
import { CreateNotificationAction } from './registry/actions/notification.action';
import { SendWebhookAction } from './registry/actions/webhook.action';
import { SendEmailAction } from './registry/actions/email.action';
import { CreateCommentAction } from './registry/actions/comment.action';

// ─── Engine ──────────────────────────────────────────────────────────────────
import { ConditionEvaluator } from './engine/condition.evaluator';
import { CircuitBreaker } from './engine/circuit-breaker';
import { AutomationRunner } from './engine/automation.runner';

// ─── Queue ───────────────────────────────────────────────────────────────────
import { AUTOMATION_QUEUE } from './queue/automation.queue';
import { AutomationProducer } from './queue/automation.producer';
import { AutomationProcessor } from './queue/automation.processor';

// ─── API ─────────────────────────────────────────────────────────────────────
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';

const TRIGGER_HANDLERS = [
  TaskStatusChangedTrigger,
  TaskCreatedTrigger,
  TaskAssignedTrigger,
  IssueStatusChangedTrigger,
  ProjectCreatedTrigger,
];

const CONDITION_HANDLERS = [
  FieldEqualsCondition,
  FieldNotEqualsCondition,
  FieldContainsCondition,
  FieldNotContainsCondition,
  FieldGreaterThanCondition,
  FieldLessThanCondition,
  FieldIsEmptyCondition,
  FieldIsNotEmptyCondition,
  UserHasRoleCondition,
];

const ACTION_HANDLERS = [
  UpdateTaskAction,
  CreateTaskAction,
  AssignTaskAction,
  CreateNotificationAction,
  SendWebhookAction,
  SendEmailAction,
  CreateCommentAction,
];

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    RedisModule,
    EventEmitterModule.forRoot(),
    // BullMQ queue registration — conditional on REDIS_URL
    ...(process.env.REDIS_URL
      ? [
          BullModule.forRoot({
            connection: { url: process.env.REDIS_URL },
          }),
          BullModule.registerQueue({ name: AUTOMATION_QUEUE }),
        ]
      : []),
  ],
  controllers: [AutomationController],
  providers: [
    // Registries
    TriggerRegistry,
    ConditionRegistry,
    ActionRegistry,

    // Handlers (all are Injectable NestJS services)
    ...TRIGGER_HANDLERS,
    ...CONDITION_HANDLERS,
    ...ACTION_HANDLERS,

    // Engine
    ConditionEvaluator,
    CircuitBreaker,
    AutomationRunner,

    // Queue
    AutomationProducer,
    ...(process.env.REDIS_URL ? [AutomationProcessor] : []),

    // API
    AutomationService,
  ],
  exports: [AutomationService],
})
export class AutomationModule implements OnModuleInit {
  constructor(
    private readonly triggerRegistry: TriggerRegistry,
    private readonly conditionRegistry: ConditionRegistry,
    private readonly actionRegistry: ActionRegistry,
    // Trigger handlers
    private readonly taskStatusChanged: TaskStatusChangedTrigger,
    private readonly taskCreated: TaskCreatedTrigger,
    private readonly taskAssigned: TaskAssignedTrigger,
    private readonly issueStatusChanged: IssueStatusChangedTrigger,
    private readonly projectCreated: ProjectCreatedTrigger,
    // Condition handlers
    private readonly fieldEquals: FieldEqualsCondition,
    private readonly fieldNotEquals: FieldNotEqualsCondition,
    private readonly fieldContains: FieldContainsCondition,
    private readonly fieldNotContains: FieldNotContainsCondition,
    private readonly fieldGreaterThan: FieldGreaterThanCondition,
    private readonly fieldLessThan: FieldLessThanCondition,
    private readonly fieldIsEmpty: FieldIsEmptyCondition,
    private readonly fieldIsNotEmpty: FieldIsNotEmptyCondition,
    private readonly userHasRole: UserHasRoleCondition,
    // Action handlers
    private readonly updateTask: UpdateTaskAction,
    private readonly createTask: CreateTaskAction,
    private readonly assignTask: AssignTaskAction,
    private readonly createNotification: CreateNotificationAction,
    private readonly sendWebhook: SendWebhookAction,
    private readonly sendEmail: SendEmailAction,
    private readonly createComment: CreateCommentAction,
  ) {}

  /** Register all handlers with their respective registries at startup */
  onModuleInit() {
    // Triggers
    this.triggerRegistry.register(this.taskStatusChanged);
    this.triggerRegistry.register(this.taskCreated);
    this.triggerRegistry.register(this.taskAssigned);
    this.triggerRegistry.register(this.issueStatusChanged);
    this.triggerRegistry.register(this.projectCreated);

    // Conditions
    this.conditionRegistry.register(this.fieldEquals);
    this.conditionRegistry.register(this.fieldNotEquals);
    this.conditionRegistry.register(this.fieldContains);
    this.conditionRegistry.register(this.fieldNotContains);
    this.conditionRegistry.register(this.fieldGreaterThan);
    this.conditionRegistry.register(this.fieldLessThan);
    this.conditionRegistry.register(this.fieldIsEmpty);
    this.conditionRegistry.register(this.fieldIsNotEmpty);
    this.conditionRegistry.register(this.userHasRole);    // Actions
    this.actionRegistry.register(this.updateTask);
    this.actionRegistry.register(this.createTask);
    this.actionRegistry.register(this.assignTask);
    this.actionRegistry.register(this.createNotification);
    this.actionRegistry.register(this.sendWebhook);
    this.actionRegistry.register(this.sendEmail);
    this.actionRegistry.register(this.createComment);
  }
}
