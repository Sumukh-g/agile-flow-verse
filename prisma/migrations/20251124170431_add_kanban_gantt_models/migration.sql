-- Note: embedding column skipped - pgvector extension not available
-- The embedding field in the Note model is optional and won't affect functionality

-- CreateTable
CREATE TABLE "kanban_columns" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6b7280',
    "position" INTEGER NOT NULL DEFAULT 0,
    "wipLimit" INTEGER,
    "collapsed" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanban_columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_cards" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "position" INTEGER NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "estimatedHours" DOUBLE PRECISION,
    "actualHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "assignees" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subtasks" JSONB,
    "checklists" JSONB,
    "attachments" JSONB,
    "comments" JSONB,
    "dependencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "blockedBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "blocking" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanban_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gantt_tasks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'task',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'not-started',
    "assignees" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "parentId" TEXT,
    "critical" BOOLEAN NOT NULL DEFAULT false,
    "duration" INTEGER,
    "notes" TEXT,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gantt_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gantt_dependencies" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fromTaskId" TEXT NOT NULL,
    "toTaskId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'finish-to-start',
    "lag" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "gantt_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kanban_columns_projectId_idx" ON "kanban_columns"("projectId");

-- CreateIndex
CREATE INDEX "kanban_columns_tenantId_idx" ON "kanban_columns"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "kanban_columns_projectId_position_key" ON "kanban_columns"("projectId", "position");

-- CreateIndex
CREATE INDEX "kanban_cards_projectId_idx" ON "kanban_cards"("projectId");

-- CreateIndex
CREATE INDEX "kanban_cards_columnId_idx" ON "kanban_cards"("columnId");

-- CreateIndex
CREATE INDEX "kanban_cards_tenantId_idx" ON "kanban_cards"("tenantId");

-- CreateIndex
CREATE INDEX "kanban_cards_status_idx" ON "kanban_cards"("status");

-- CreateIndex
CREATE INDEX "gantt_tasks_projectId_idx" ON "gantt_tasks"("projectId");

-- CreateIndex
CREATE INDEX "gantt_tasks_tenantId_idx" ON "gantt_tasks"("tenantId");

-- CreateIndex
CREATE INDEX "gantt_tasks_parentId_idx" ON "gantt_tasks"("parentId");

-- CreateIndex
CREATE INDEX "gantt_tasks_groupId_idx" ON "gantt_tasks"("groupId");

-- CreateIndex
CREATE INDEX "gantt_dependencies_fromTaskId_idx" ON "gantt_dependencies"("fromTaskId");

-- CreateIndex
CREATE INDEX "gantt_dependencies_toTaskId_idx" ON "gantt_dependencies"("toTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "gantt_dependencies_tenantId_fromTaskId_toTaskId_key" ON "gantt_dependencies"("tenantId", "fromTaskId", "toTaskId");

-- AddForeignKey
ALTER TABLE "kanban_columns" ADD CONSTRAINT "kanban_columns_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_columns" ADD CONSTRAINT "kanban_columns_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "kanban_columns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gantt_tasks" ADD CONSTRAINT "gantt_tasks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gantt_tasks" ADD CONSTRAINT "gantt_tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gantt_tasks" ADD CONSTRAINT "gantt_tasks_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "gantt_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gantt_dependencies" ADD CONSTRAINT "gantt_dependencies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gantt_dependencies" ADD CONSTRAINT "gantt_dependencies_fromTaskId_fkey" FOREIGN KEY ("fromTaskId") REFERENCES "gantt_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gantt_dependencies" ADD CONSTRAINT "gantt_dependencies_toTaskId_fkey" FOREIGN KEY ("toTaskId") REFERENCES "gantt_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
