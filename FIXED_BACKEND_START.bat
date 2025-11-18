@echo off
echo ========================================
echo   FIXED BACKEND STARTUP
echo ========================================
echo.
echo [1/2] Compiling TypeScript...
tsc -p tsconfig.api.json
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Compilation failed!
    echo.
    pause
    exit /b 1
)
echo ✓ Compilation successful!
echo.
echo [2/2] Starting server...
echo.
node dist-api/main.js

