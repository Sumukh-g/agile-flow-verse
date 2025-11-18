@echo off
echo ========================================
echo Starting Agile Flow Backend
echo ========================================
echo.

echo [Step 1] Checking DATABASE_URL...
if exist .env (
    echo .env file found
) else (
    echo ERROR: .env file not found!
    pause
    exit /b 1
)
echo.

echo [Step 2] Creating full database schema...
call npx prisma db push --accept-data-loss --skip-generate
echo Schema push complete
echo.

echo [Step 3] Starting backend server...
echo Backend will start now. Watch for errors below:
echo ========================================
echo.
call npm run api:start

