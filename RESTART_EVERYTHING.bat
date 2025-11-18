@echo off
echo ===================================
echo RESTARTING EVERYTHING FRESH
echo ===================================
echo.

echo Step 1: Stopping all Node processes...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 >nul

echo.
echo Step 2: Clearing frontend cache...
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"
if exist ".vite" rmdir /s /q ".vite"

echo.
echo Step 3: Starting backend...
start "Backend API" cmd /k "npm run api:dev"
timeout /t 5 >nul

echo.
echo Step 4: Starting frontend...
start "Frontend Dev" cmd /k "npm run dev"

echo.
echo ===================================
echo DONE!
echo ===================================
echo.
echo Two windows opened:
echo 1. Backend API (port 3000)
echo 2. Frontend Dev (port 5173)
echo.
echo Wait 10 seconds, then:
echo 1. Go to: http://localhost:5173
echo 2. Login with: test@test.com / Test123!
echo.
pause

