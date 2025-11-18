@echo off
echo Fixing DATABASE_URL to use postgres superuser...
echo.

REM Backup current .env
copy .env .env.backup.old >nul 2>&1

REM Read .env and replace DATABASE_URL
powershell -Command "(Get-Content .env) -replace 'DATABASE_URL=.*', 'DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/agileflow_db\"' | Set-Content .env.new"

REM Replace .env with new version
move /Y .env.new .env >nul

echo ✅ DATABASE_URL updated to use postgres superuser
echo.
type .env | findstr DATABASE_URL
echo.
echo Testing connection...
node test-prisma-connection.mjs

