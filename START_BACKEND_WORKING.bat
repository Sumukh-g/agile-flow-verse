@echo off
echo ========================================
echo   STARTING BACKEND (FIXED)
echo ========================================
echo.
echo Compiling TypeScript first...
tsc -p tsconfig.api.json
if %errorlevel% neq 0 (
    echo.
    echo ERROR: TypeScript compilation failed!
    echo Check the errors above.
    pause
    exit /b 1
)
echo.
echo ✓ Compilation successful!
echo.
echo Starting server...
echo.
node dist-api/main.js

