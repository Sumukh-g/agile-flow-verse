@echo off
echo.
echo 🚀 Starting Agile Flow Verse Application...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo ⚠️  Creating .env file from env.example...
    copy env.example .env
    echo ✓ .env file created
)

REM Start development services (PostgreSQL + Redis only)
echo.
echo 📦 Starting PostgreSQL and Redis...
docker-compose -f docker-compose.dev.yml up -d

REM Wait for PostgreSQL to be ready
echo.
echo ⏳ Waiting for PostgreSQL to be ready...
:wait_postgres
timeout /t 2 /nobreak >nul
docker exec agile-flow-postgres-dev pg_isready -U agileflow >nul 2>&1
if %errorlevel% neq 0 (
    echo .
    goto wait_postgres
)
echo ✓ PostgreSQL is ready

REM Wait for Redis to be ready
echo.
echo ⏳ Waiting for Redis to be ready...
:wait_redis
timeout /t 2 /nobreak >nul
docker exec agile-flow-redis-dev redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo .
    goto wait_redis
)
echo ✓ Redis is ready

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call npm install
echo ✓ Dependencies installed

REM Install socket.io-client if not present
echo.
echo 📦 Ensuring socket.io-client is installed...
call npm install socket.io-client
echo ✓ socket.io-client installed

REM Generate Prisma Client
echo.
echo 🔧 Generating Prisma Client...
call npx prisma generate
echo ✓ Prisma Client generated

REM Run migrations
echo.
echo 🔄 Running database migrations...
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo ⚠️  Migration failed, trying to apply manually...
    docker exec -i agile-flow-postgres-dev psql -U agileflow -d agileflow_db < prisma\migrations\20250107000000_add_notification_features\migration.sql
)
echo ✓ Migrations completed

echo.
echo ✅ Setup complete!
echo.
echo To start the application:
echo   npm run api:dev  (in one terminal)
echo   npm run dev      (in another terminal)
echo.
echo Access points:
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:3000
echo   Swagger:   http://localhost:3000/v1/docs
echo   PostgreSQL: localhost:5432 (user: agileflow, password: agileflow_password)
echo   Redis:     localhost:6379
echo.
pause

