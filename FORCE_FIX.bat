@echo off
echo Killing all node processes...
taskkill /F /IM node.exe 2>nul

echo.
echo Creating new .env with postgres user...
(
echo DATABASE_URL="postgresql://postgres@localhost:5432/agileflow_db"
echo.
echo REDIS_HOST=localhost
echo REDIS_PORT=6379
echo.
echo KAFKA_BROKERS=localhost:9092
echo.
echo JWT_SECRET=your-secret-key-change-in-production
echo JWT_REFRESH_SECRET=your-refresh-secret-key-change
echo JWT_EXPIRATION=1h
echo JWT_REFRESH_EXPIRATION=7d
echo.
echo API_URL=http://localhost:3000
echo PORT=3000
echo.
echo VITE_API_URL=http://localhost:3000
echo.
echo UPLOAD_PATH=./uploads
echo MAX_FILE_SIZE=10485760
echo.
echo NODE_ENV=development
echo.
echo ENABLE_KAFKA=false
echo ENABLE_EMAIL=false
echo ENABLE_KEYCLOAK=false
) > .env

echo ✅ New .env created
echo.
echo Checking DATABASE_URL...
findstr DATABASE_URL .env
echo.

echo Deleting Prisma cache...
rmdir /S /Q node_modules\.prisma 2>nul
rmdir /S /Q node_modules\@prisma 2>nul

echo.
echo Installing Prisma fresh...
call npm install @prisma/client

echo.
echo Generating Prisma client...
call npx prisma generate

echo.
echo ========================================
echo STARTING BACKEND NOW...
echo ========================================
timeout /t 2 /nobreak > nul
call npm run api:start

