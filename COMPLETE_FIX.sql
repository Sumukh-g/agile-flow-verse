-- COMPLETE Permission Fix - Run this as postgres superuser
-- Command: psql -U postgres -d agileflow_db -f COMPLETE_FIX.sql

-- Step 1: Make agileflow the owner of the database
ALTER DATABASE agileflow_db OWNER TO agileflow;

-- Step 2: Connect to the database
\c agileflow_db

-- Step 3: Make agileflow the owner of the public schema
ALTER SCHEMA public OWNER TO agileflow;

-- Step 4: Grant all permissions on the schema
GRANT ALL ON SCHEMA public TO agileflow;
GRANT CREATE ON SCHEMA public TO agileflow;
GRANT USAGE ON SCHEMA public TO agileflow;

-- Step 5: Grant all on existing objects (if any exist)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO agileflow;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO agileflow;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO agileflow;

-- Step 6: Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO agileflow;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO agileflow;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO agileflow;

-- Step 7: Create extensions (vector is optional)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Try vector extension (optional - may not be installed)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Vector extension not available (optional): %', SQLERRM;
END $$;

\echo ''
\echo '✅ COMPLETE FIX APPLIED!'
\echo ''
\echo 'Now run: npx prisma migrate deploy'
\echo ''

