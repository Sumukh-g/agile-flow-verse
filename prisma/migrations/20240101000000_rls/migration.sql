-- Enable RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox ENABLE ROW LEVEL SECURITY;

-- Create policies for each table
CREATE POLICY users_by_tenant ON users
  USING (tenant_id = current_setting('app.current_tenant')::text);

CREATE POLICY projects_by_tenant ON projects
  USING (tenant_id = current_setting('app.current_tenant')::text);

CREATE POLICY tasks_by_tenant ON tasks
  USING (tenant_id = current_setting('app.current_tenant')::text);

CREATE POLICY timesheets_by_tenant ON timesheets
  USING (tenant_id = current_setting('app.current_tenant')::text);

CREATE POLICY tenant_features_by_tenant ON tenant_features
  USING (tenant_id = current_setting('app.current_tenant')::text);

CREATE POLICY role_assignments_by_tenant ON role_assignments
  USING (tenant_id = current_setting('app.current_tenant')::text);

CREATE POLICY audit_logs_by_tenant ON audit_logs
  USING (tenant_id = current_setting('app.current_tenant')::text OR tenant_id IS NULL);

CREATE POLICY outbox_by_tenant ON outbox
  USING (tenant_id = current_setting('app.current_tenant')::text); 