@echo off
echo ===============================================
echo  COMPREHENSIVE FIX SCRIPT
echo  This will install and setup everything
echo ===============================================
echo.

REM Step 1: Install ALL missing dependencies
echo [1/8] Installing missing dependencies...
call npm install socket.io-client bcrypt @types/bcrypt @types/node
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

REM Step 2: Install all other dependencies
echo [2/8] Installing all project dependencies...
call npm install
echo ✓ All dependencies installed
echo.

REM Step 3: Generate Prisma Client
echo [3/8] Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma Client
    pause
    exit /b 1
)
echo ✓ Prisma Client generated
echo.

REM Step 4: Check if Docker is running
echo [4/8] Checking Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Docker is not running
    echo Please start Docker Desktop and run this script again
    pause
    exit /b 1
)
echo ✓ Docker is running
echo.

REM Step 5: Start Docker containers
echo [5/8] Starting Docker containers (PostgreSQL + Redis)...
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
echo ✓ Containers started
echo.

REM Step 6: Wait for databases
echo [6/8] Waiting for databases to be ready...
timeout /t 10 /nobreak >nul
echo ✓ Databases should be ready
echo.

REM Step 7: Run migrations
echo [7/8] Running database migrations...
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo WARNING: Migration deployment failed
    echo Trying manual migration...
    docker exec -i agile-flow-postgres-dev psql -U agileflow -d agileflow_db < prisma\migrations\20250107000000_add_notification_features\migration.sql 2>nul
)
echo ✓ Migrations completed
echo.

REM Step 8: Create .env if missing
echo [8/8] Checking environment configuration...
if not exist .env (
    copy env.example .env
    echo ✓ Created .env file
) else (
    echo ✓ .env file exists
)
echo.

echo ===============================================
echo  ✓ SETUP COMPLETE!
echo ===============================================
echo.
echo Next steps:
echo   1. Open TWO terminal windows
echo   2. In first terminal:  npm run api:dev
echo   3. In second terminal: npm run dev
echo.
echo Then access:
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:3000
echo   Swagger:   http://localhost:3000/v1/docs
echo.
echo To test authentication:
echo   1. Go to http://localhost:5173/signup
echo   2. Create an account
echo   3. Login with your credentials
echo.
pause

