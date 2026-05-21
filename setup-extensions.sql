-- Run this script as postgres superuser FIRST, before running migrations
-- psql -U postgres -d agileflow_db -f setup-extensions.sql

-- Create extensions (requires superuser)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS vector;

\echo '✅ Extensions created successfully!'

