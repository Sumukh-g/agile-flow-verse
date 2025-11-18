@echo off
echo ========================================
echo NUCLEAR FIX - Switching to postgres superuser
echo ========================================
echo.

echo [1/4] Updating .env to use postgres superuser (has trust auth)...
powershell -Command "(Get-Content .env) -replace 'DATABASE_URL=.*', 'DATABASE_URL=\"postgresql://postgres@localhost:5432/agileflow_db\"' | Set-Content .env.tmp && mv -Force .env.tmp .env"
echo ✅ .env updated
echo.

echo [2/4] Granting all privileges to postgres on agileflow_db...
docker exec agile-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE agileflow_db TO postgres;"
docker exec agile-postgres psql -U postgres -d agileflow_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;"
docker exec agile-postgres psql -U postgres -d agileflow_db -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;"
echo ✅ Privileges granted
echo.

echo [3/4] Testing connection...
docker exec agile-postgres psql -U postgres -d agileflow_db -c "SELECT 'SUCCESS!' as status;" || (
    echo ❌ Connection failed
    pause
    exit /b 1
)
echo ✅ Connection works!
echo.

echo [4/4] Regenerating Prisma and starting backend...
call npx prisma generate
echo.
echo ========================================
echo Starting backend server NOW...
echo ========================================
echo.
call npm run api:start

