-- Run this as postgres superuser to fix permissions and create extensions
-- Command: psql -U postgres -d agileflow_db -f RUN_MIGRATIONS_NOW.sql

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO agileflow;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO agileflow;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO agileflow;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO agileflow;

-- Create extensions (requires superuser)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS vector;

\echo '✅ Permissions and extensions set up! Now run: npx prisma migrate deploy'

