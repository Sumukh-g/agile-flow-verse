-- Add performance indexes for common query patterns
-- This migration adds composite indexes to optimize frequently used queries

-- Task indexes for common query patterns
CREATE INDEX IF NOT EXISTS "tasks_tenantId_projectId_status_idx" ON "tasks"("tenantId", "projectId", "status");
CREATE INDEX IF NOT EXISTS "tasks_tenantId_status_idx" ON "tasks"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "tasks_tenantId_priority_idx" ON "tasks"("tenantId", "priority");

-- TaskAssignee indexes
CREATE INDEX IF NOT EXISTS "task_assignees_tenantId_userId_idx" ON "task_assignees"("tenantId", "userId");
CREATE INDEX IF NOT EXISTS "task_assignees_taskId_idx" ON "task_assignees"("taskId");

-- Project indexes
CREATE INDEX IF NOT EXISTS "projects_tenantId_createdBy_deletedAt_idx" ON "projects"("tenantId", "createdBy", "deletedAt");
CREATE INDEX IF NOT EXISTS "projects_tenantId_deletedAt_idx" ON "projects"("tenantId", "deletedAt");

-- ProjectMember indexes
CREATE INDEX IF NOT EXISTS "project_members_tenantId_userId_idx" ON "project_members"("tenantId", "userId");
CREATE INDEX IF NOT EXISTS "project_members_projectId_idx" ON "project_members"("projectId");

-- Issue indexes
CREATE INDEX IF NOT EXISTS "issues_tenantId_projectId_status_priority_idx" ON "issues"("tenantId", "projectId", "status", "priority");
CREATE INDEX IF NOT EXISTS "issues_tenantId_status_priority_idx" ON "issues"("tenantId", "status", "priority");

-- Notification indexes
CREATE INDEX IF NOT EXISTS "notifications_tenantId_userId_read_createdAt_idx" ON "notifications"("tenantId", "userId", "read", "createdAt");
CREATE INDEX IF NOT EXISTS "notifications_tenantId_userId_read_idx" ON "notifications"("tenantId", "userId", "read");
CREATE INDEX IF NOT EXISTS "notifications_tenantId_userId_idx" ON "notifications"("tenantId", "userId");

-- User indexes
CREATE INDEX IF NOT EXISTS "users_tenantId_email_idx" ON "users"("tenantId", "email");
CREATE INDEX IF NOT EXISTS "users_tenantId_idx" ON "users"("tenantId");

