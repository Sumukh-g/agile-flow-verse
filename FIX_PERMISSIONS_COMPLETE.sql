-- Complete Permission Fix for Migrations
-- Run as postgres superuser: psql -U postgres -d agileflow_db -f FIX_PERMISSIONS_COMPLETE.sql

-- Make agileflow the owner of the database (this ensures full control)
ALTER DATABASE agileflow_db OWNER TO agileflow;

-- Connect to the database
\c agileflow_db

-- Grant all schema permissions
GRANT ALL ON SCHEMA public TO agileflow;
GRANT CREATE ON SCHEMA public TO agileflow;

-- Grant all on existing objects (if any)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO agileflow;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO agileflow;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO agileflow;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO agileflow;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO agileflow;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO agileflow;

-- Create extensions (vector is optional - will fail gracefully if not installed)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Try to create vector extension, but don't fail if it's not installed
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Vector extension not available (optional): %', SQLERRM;
END $$;

\echo '✅ Permissions fixed! Now run: npx prisma migrate deploy'

