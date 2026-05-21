@echo off
echo ========================================
echo Fixing Frontend and Backend Issues
echo ========================================
echo.

echo [1/4] Installing missing frontend dependency...
call npm install react-beautiful-dnd
if %errorlevel% neq 0 (
    echo ERROR: Failed to install react-beautiful-dnd
    pause
    exit /b 1
)
echo ✓ Frontend dependency installed
echo.

echo [2/4] Checking database configuration...
if not exist .env (
    echo WARNING: .env file not found!
    echo Creating .env from env.example...
    copy env.example .env
    echo ✓ .env file created
) else (
    echo ✓ .env file exists
)
echo.

echo [3/4] Verifying DATABASE_URL format...
findstr /C:"DATABASE_URL" .env >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: DATABASE_URL not found in .env
    echo Please add: DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agile_flow_verse"
) else (
    echo ✓ DATABASE_URL found in .env
)
echo.

echo [4/4] Checking if PostgreSQL is running...
timeout /t 1 >nul 2>&1
echo.
echo ========================================
echo IMPORTANT: Database Connection Check
echo ========================================
echo.
echo Please verify your .env file has the correct DATABASE_URL:
echo   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agile_flow_verse"
echo.
echo Make sure:
echo   1. PostgreSQL is running on localhost:5432
echo   2. Database 'agile_flow_verse' exists
echo   3. Username: postgres, Password: postgres
echo.
echo To start PostgreSQL with Docker:
echo   docker-compose up -d postgres
echo.
echo ========================================
echo Fix script completed!
echo ========================================
pause

