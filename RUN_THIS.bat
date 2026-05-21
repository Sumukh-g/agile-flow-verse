@echo off
cls
echo ========================================
echo   MIGRATION FIX - RUN THIS
echo ========================================
echo.

echo STEP 1: Fix Permissions
echo ------------------------
echo.
echo Run this command (enter postgres password):
echo.
echo   psql -U postgres -d agileflow_db -f COMPLETE_FIX.sql
echo.
echo OR run this single command:
echo.
echo   psql -U postgres -d agileflow_db -c "ALTER DATABASE agileflow_db OWNER TO agileflow; \c agileflow_db ALTER SCHEMA public OWNER TO agileflow; GRANT ALL ON SCHEMA public TO agileflow; GRANT CREATE ON SCHEMA public TO agileflow; CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
echo.
pause

echo.
echo STEP 2: Running Migrations
echo ------------------------
npx prisma migrate deploy

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SUCCESS! Migrations applied.
    echo.
    echo STEP 3: Generating Prisma Client
    echo ------------------------
    echo (Stop backend first)
    timeout /t 2 /nobreak >nul
    npx prisma generate
    
    echo.
    echo STEP 4: Verifying
    echo ------------------------
    npx prisma migrate status
    
    echo.
    echo ========================================
    echo ✅ ALL DONE! Restart backend now.
    echo ========================================
) else (
    echo.
    echo ❌ Failed! Make sure you ran Step 1.
)

pause

