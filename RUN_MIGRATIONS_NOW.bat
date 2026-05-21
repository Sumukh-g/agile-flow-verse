@echo off
echo ========================================
echo   Running Migrations - Complete Fix
echo ========================================
echo.

echo Step 1: Fixing database permissions...
echo.
echo You need to run this SQL command as postgres superuser:
echo.
echo   psql -U postgres -d agileflow_db -f RUN_MIGRATIONS_NOW.sql
echo.
echo OR run this command:
echo.
echo   psql -U postgres -d agileflow_db -c "GRANT ALL ON SCHEMA public TO agileflow; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO agileflow; CREATE EXTENSION IF NOT EXISTS pg_stat_statements; CREATE EXTENSION IF NOT EXISTS vector;"
echo.
pause

echo.
echo Step 2: Deploying migrations...
call npx prisma migrate deploy

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Migrations deployed successfully!
    echo.
    echo Step 3: Generating Prisma Client...
    echo (Make sure backend is stopped)
    timeout /t 2 /nobreak >nul
    call npx prisma generate
    
    echo.
    echo Step 4: Verifying...
    call npx prisma migrate status
    
    echo.
    echo ========================================
    echo ✅ SUCCESS! All migrations applied.
    echo ========================================
    echo.
    echo Next: Restart your backend server
) else (
    echo.
    echo ❌ Migration failed. Make sure you ran Step 1.
    echo.
    echo Check the error above for details.
)

pause

