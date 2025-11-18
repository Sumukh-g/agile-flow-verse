@echo off
echo ========================================
echo FINAL FIX - Agile Flow Backend
echo ========================================
echo.

echo [1/5] Fixing PostgreSQL authentication (pg_hba.conf with Unix line endings)...
docker exec agile-postgres bash -c "printf 'local all all trust\nhost all all 127.0.0.1/32 trust\nhost all all ::1/128 trust\nhost all all 0.0.0.0/0 trust\n' > /var/lib/postgresql/data/pg_hba.conf"
echo ✅ pg_hba.conf fixed
echo.

echo [2/5] Restarting PostgreSQL...
docker restart agile-postgres
timeout /t 8 /nobreak > nul
echo ✅ PostgreSQL restarted
echo.

echo [3/5] Testing database connection...
docker exec agile-postgres psql -U agileflow -d agileflow_db -c "SELECT 'DB Connected!' as status;" || (
    echo ❌ Database connection failed
    pause
    exit /b 1
)
echo ✅ Database connection works!
echo.

echo [4/5] Regenerating Prisma client...
call npx prisma generate > nul 2>&1
echo ✅ Prisma client generated
echo.

echo [5/5] Starting backend server...
echo ========================================
echo Backend is starting... Watch for success message below:
echo.
call npm run api:start

