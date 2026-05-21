-- Fix Permissions and Setup for Migrations
-- Run this as postgres superuser: psql -U postgres -d agileflow_db -f fix-permissions-and-migrate.sql

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO agileflow;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO agileflow;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO agileflow;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO agileflow;

-- Create extensions (requires superuser)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS vector;

-- Make agileflow owner of the database (optional but helps)
ALTER DATABASE agileflow_db OWNER TO agileflow;

\echo '✅ Permissions and extensions set up successfully!'
\echo 'You can now run: npx prisma migrate deploy'

