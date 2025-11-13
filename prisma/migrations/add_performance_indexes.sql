-- Performance indexes for production optimization
-- Run this migration to add indexes for common query patterns

-- Task indexes
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_project ON tasks(tenant_id, project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at DESC);

-- Task assignee indexes
CREATE INDEX IF NOT EXISTS idx_task_assignees_user ON task_assignees(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_task ON task_assignees(task_id, tenant_id);

-- Project indexes
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by, tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Project member indexes
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id, tenant_id);

-- Note indexes
CREATE INDEX IF NOT EXISTS idx_notes_tenant_project ON notes(tenant_id, project_id);
CREATE INDEX IF NOT EXISTS idx_notes_parent ON notes(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, tenant_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Outbox indexes for event processing
CREATE INDEX IF NOT EXISTS idx_outbox_processed ON outbox(processed, created_at) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_outbox_tenant ON outbox(tenant_id, processed);

-- Timesheet indexes
CREATE INDEX IF NOT EXISTS idx_timesheets_user_date ON timesheets(user_id, date DESC, tenant_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_task ON timesheets(task_id, tenant_id);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);

-- Refresh token indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE expires_at > NOW();

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status, tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant_status ON projects(tenant_id, status);

