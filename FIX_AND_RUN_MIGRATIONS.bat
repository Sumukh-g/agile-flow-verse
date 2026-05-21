@echo off
echo ========================================
echo Complete Migration Fix and Run
echo ========================================
echo.

echo Step 1: Fixing database permissions and creating extensions...
echo.
echo You need to run this command (enter postgres password when prompted):
echo.
echo psql -U postgres -d agileflow_db -c "GRANT ALL ON SCHEMA public TO agileflow; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO agileflow; CREATE EXTENSION IF NOT EXISTS pg_stat_statements; CREATE EXTENSION IF NOT EXISTS vector;"
echo.
pause

echo.
echo Step 2: Deploying migrations...
call npx prisma migrate deploy

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Step 3: Generating Prisma Client...
    echo WARNING: Make sure backend server is stopped!
    timeout /t 3 /nobreak >nul
    call npx prisma generate
    
    echo.
    echo Step 4: Verifying...
    call npx prisma migrate status
    
    echo.
    echo ========================================
    echo SUCCESS! All migrations applied.
    echo ========================================
    echo.
    echo Next: Restart your backend server
) else (
    echo.
    echo ========================================
    echo ERROR: Migration failed
    echo ========================================
    echo.
    echo Make sure you ran Step 1 successfully.
)

pause

