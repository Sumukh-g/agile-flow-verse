-- ──────────────────────────────────────────────────────────────────────────────
-- Migration: add_automation_engine_v2
-- Adds AutomationRule, AutomationExecution, AutomationStepLog models
-- with full idempotency, circuit-breaker, and audit-trail support.
-- ──────────────────────────────────────────────────────────────────────────────

-- Enums
CREATE TYPE "AutomationExecutionStatus" AS ENUM (
  'PENDING',
  'RUNNING',
  'SUCCESS',
  'FAILED',
  'SKIPPED',
  'DRY_RUN'
);

CREATE TYPE "AutomationStepType" AS ENUM (
  'CONDITION',
  'ACTION',
  'BRANCH'
);

CREATE TYPE "AutomationStepStatus" AS ENUM (
  'SUCCESS',
  'FAILED',
  'SKIPPED',
  'DRY_RUN'
);

-- AutomationRule
CREATE TABLE "automation_rules" (
  "id"            TEXT NOT NULL,
  "tenantId"      TEXT NOT NULL,
  "projectId"     TEXT,
  "name"          TEXT NOT NULL,
  "description"   TEXT,
  "isActive"      BOOLEAN NOT NULL DEFAULT true,
  "triggerKey"    TEXT NOT NULL,
  "triggerParams" JSONB NOT NULL DEFAULT '{}',
  "conditions"    JSONB,
  "steps"         JSONB NOT NULL,
  "version"       INTEGER NOT NULL DEFAULT 1,
  "createdById"   TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,

  CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "automation_rules_tenantId_isActive_idx" ON "automation_rules"("tenantId", "isActive");
CREATE INDEX "automation_rules_triggerKey_idx" ON "automation_rules"("triggerKey");
CREATE INDEX "automation_rules_projectId_idx" ON "automation_rules"("projectId");

ALTER TABLE "automation_rules"
  ADD CONSTRAINT "automation_rules_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "automation_rules_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "automation_rules_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AutomationExecution
CREATE TABLE "automation_executions" (
  "id"              TEXT NOT NULL,
  "ruleId"          TEXT NOT NULL,
  "tenantId"        TEXT NOT NULL,
  "status"          "AutomationExecutionStatus" NOT NULL DEFAULT 'PENDING',
  "isDryRun"        BOOLEAN NOT NULL DEFAULT false,
  "triggerPayload"  JSONB NOT NULL,
  "context"         JSONB,
  "errorMessage"    TEXT,
  "startedAt"       TIMESTAMP(3),
  "completedAt"     TIMESTAMP(3),
  "durationMs"      INTEGER,
  "idempotencyKey"  TEXT NOT NULL,
  "chainDepth"      INTEGER NOT NULL DEFAULT 0,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "automation_executions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "automation_executions_idempotencyKey_key" ON "automation_executions"("idempotencyKey");
CREATE INDEX "automation_executions_ruleId_status_idx" ON "automation_executions"("ruleId", "status");
CREATE INDEX "automation_executions_tenantId_createdAt_idx" ON "automation_executions"("tenantId", "createdAt");
CREATE INDEX "automation_executions_idempotencyKey_idx" ON "automation_executions"("idempotencyKey");

ALTER TABLE "automation_executions"
  ADD CONSTRAINT "automation_executions_ruleId_fkey"
    FOREIGN KEY ("ruleId") REFERENCES "automation_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "automation_executions_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AutomationStepLog
CREATE TABLE "automation_step_logs" (
  "id"            TEXT NOT NULL,
  "executionId"   TEXT NOT NULL,
  "stepIndex"     INTEGER NOT NULL,
  "stepType"      "AutomationStepType" NOT NULL,
  "stepKey"       TEXT NOT NULL,
  "status"        "AutomationStepStatus" NOT NULL,
  "inputPayload"  JSONB NOT NULL,
  "outputPayload" JSONB,
  "errorMessage"  TEXT,
  "errorStack"    TEXT,
  "durationMs"    INTEGER,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "automation_step_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "automation_step_logs_executionId_idx" ON "automation_step_logs"("executionId");

ALTER TABLE "automation_step_logs"
  ADD CONSTRAINT "automation_step_logs_executionId_fkey"
    FOREIGN KEY ("executionId") REFERENCES "automation_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
