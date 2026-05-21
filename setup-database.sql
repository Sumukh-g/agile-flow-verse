-- Setup Database and User for Agile Flow Verse
-- Run this script as the postgres superuser: psql -U postgres -f setup-database.sql

-- Create user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'agileflow') THEN
        CREATE USER agileflow WITH PASSWORD 'agileflow_password';
        RAISE NOTICE 'User agileflow created';
    ELSE
        RAISE NOTICE 'User agileflow already exists';
    END IF;
END
$$;

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE agileflow_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'agileflow_db')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE agileflow_db TO agileflow;

-- Connect to the database and grant schema privileges
\c agileflow_db

-- Grant all privileges on schema
GRANT ALL ON SCHEMA public TO agileflow;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO agileflow;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO agileflow;

-- Make agileflow the owner (optional, but ensures full control)
ALTER DATABASE agileflow_db OWNER TO agileflow;

\echo '✅ Database setup complete!'
\echo 'You can now use: DATABASE_URL="postgresql://agileflow:agileflow_password@localhost:5432/agileflow_db"'
