@echo off
echo ========================================
echo   Complete Migration Fix and Run
echo ========================================
echo.

echo Step 1: Fixing database permissions...
echo.
echo IMPORTANT: Run this SQL command as postgres superuser:
echo.
echo   psql -U postgres -d agileflow_db -f FIX_PERMISSIONS_COMPLETE.sql
echo.
echo OR run this command:
echo.
echo   psql -U postgres -d agileflow_db -c "ALTER DATABASE agileflow_db OWNER TO agileflow; GRANT ALL ON SCHEMA public TO agileflow; GRANT CREATE ON SCHEMA public TO agileflow; CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
echo.
echo (Vector extension is optional - can skip if not installed)
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
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ✅ Prisma client generated!
    ) else (
        echo.
        echo ⚠️  Prisma generate had file lock - stop backend and run: npx prisma generate
    )
    
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
    echo ❌ Migration failed!
    echo.
    echo Make sure you:
    echo   1. Ran the permission fix command above
    echo   2. Entered correct postgres password
    echo   3. Database is running
    echo.
    echo Check the error above for details.
)

pause

