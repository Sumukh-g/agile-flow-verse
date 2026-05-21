@echo off
echo ========================================
echo Fixing PostgreSQL Database Authentication
echo ========================================
echo.

echo [1/5] Checking PostgreSQL connection...
psql -U postgres -c "SELECT version();" >nul 2>&1
if errorlevel 1 (
    echo ❌ Cannot connect to PostgreSQL as 'postgres' user
    echo.
    echo Please ensure:
    echo 1. PostgreSQL is running
    echo 2. You know the postgres user password
    echo 3. psql is in your PATH
    echo.
    echo You may need to set PGPASSWORD environment variable:
    echo   set PGPASSWORD=your_postgres_password
    echo   Then run this script again
    echo.
    pause
    exit /b 1
)
echo ✅ PostgreSQL connection successful
echo.

echo [2/5] Creating user 'agileflow' if it doesn't exist...
psql -U postgres -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'agileflow') THEN CREATE USER agileflow WITH PASSWORD 'agileflow_password'; END IF; END \$\$;" 2>nul
if errorlevel 1 (
    echo ⚠️  User might already exist, continuing...
) else (
    echo ✅ User 'agileflow' created
)
echo.

echo [3/5] Setting password for user 'agileflow'...
psql -U postgres -c "ALTER USER agileflow WITH PASSWORD 'agileflow_password';" 2>nul
echo ✅ Password set
echo.

echo [4/5] Creating database 'agileflow_db' if it doesn't exist...
psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'agileflow_db'" | findstr /C:"1" >nul
if errorlevel 1 (
    psql -U postgres -c "CREATE DATABASE agileflow_db OWNER agileflow;"
    echo ✅ Database 'agileflow_db' created
) else (
    echo ✅ Database 'agileflow_db' already exists
)
echo.

echo [5/5] Granting privileges...
psql -U postgres -d agileflow_db -c "GRANT ALL PRIVILEGES ON DATABASE agileflow_db TO agileflow;"
psql -U postgres -d agileflow_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO agileflow;"
psql -U postgres -d agileflow_db -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO agileflow;"
psql -U postgres -d agileflow_db -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO agileflow;"
psql -U postgres -d agileflow_db -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO agileflow;"
echo ✅ Privileges granted
echo.

echo [6/6] Testing connection with agileflow user...
psql -U agileflow -d agileflow_db -c "SELECT 'Connection successful!' as status;" 2>nul
if errorlevel 1 (
    echo ❌ Connection test failed
    echo.
    echo This might be due to pg_hba.conf authentication settings.
    echo You may need to configure PostgreSQL to allow password authentication.
    echo.
    pause
    exit /b 1
)
echo ✅ Connection test successful!
echo.

echo ========================================
echo Database setup complete!
echo ========================================
echo.
echo Your .env file should have:
echo DATABASE_URL="postgresql://agileflow:agileflow_password@localhost:5432/agileflow_db"
echo.
echo Next steps:
echo 1. Run: npx prisma migrate dev
echo 2. Run: npm run api:start
echo.
pause

