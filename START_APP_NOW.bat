@echo off
echo.
echo ========================================
echo   STARTING AGILE FLOW VERSE
echo ========================================
echo.

echo [1/3] Starting Backend...
start "Backend Server" cmd /k "npm run api:dev"
timeout /t 3 /nobreak >nul

echo [2/3] Starting Frontend...
start "Frontend Server" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo [3/3] Opening Browser...
timeout /t 8 /nobreak >nul
start http://localhost:5173

echo.
echo ========================================
echo   APPLICATION STARTED!
echo ========================================
echo.
echo   Backend:  http://localhost:3000
echo   Frontend: http://localhost:5173
echo   API Docs: http://localhost:3000/v1/docs
echo.
echo   Two CMD windows opened:
echo   - Backend Server
echo   - Frontend Server
echo.
echo   DON'T CLOSE THOSE WINDOWS!
echo.
pause

