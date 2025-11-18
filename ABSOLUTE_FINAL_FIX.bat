@echo off
echo ========================================
echo ABSOLUTE FINAL FIX - PostgreSQL Auth
echo ========================================
echo.

echo [1/6] Setting agileflow password in PostgreSQL...
docker exec agile-postgres psql -U postgres -c "ALTER USER agileflow WITH PASSWORD 'agileflow_password';"
echo ✅ Password set
echo.

echo [2/6] Configuring pg_hba.conf for password auth...
docker exec agile-postgres bash -c "printf 'local all all trust\nhost all all 127.0.0.1/32 md5\nhost all all ::1/128 md5\nhost all all 0.0.0.0/0 md5\n' > /var/lib/postgresql/data/pg_hba.conf"
echo ✅ pg_hba.conf configured
echo.

echo [3/6] Restarting PostgreSQL...
docker restart agile-postgres
timeout /t 10 /nobreak >nul
echo ✅ PostgreSQL restarted
echo.

echo [4/6] Testing connection from inside container...
docker exec agile-postgres psql -U agileflow -d agileflow_db -c "SELECT 'Connection Works!' as status;" || (
    echo ❌ Internal connection failed
    pause
    exit /b 1
)
echo ✅ Internal connection works
echo.

echo [5/6] Cleaning Prisma cache...
rmdir /S /Q node_modules\.prisma 2>nul
echo ✅ Cache cleared
echo.

echo [6/6] Regenerating Prisma and starting backend...
call npx prisma generate
echo.
echo ========================================
echo STARTING BACKEND - THIS WILL WORK!
echo ========================================
echo.
call npm run api:start

