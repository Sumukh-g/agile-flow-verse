@echo off
echo Starting Backend with proper TypeScript compilation...
echo.
echo Step 1: Compiling TypeScript...
tsc -p tsconfig.api.json
if %errorlevel% neq 0 (
    echo ERROR: TypeScript compilation failed!
    pause
    exit /b 1
)
echo ✓ Compilation successful!
echo.
echo Step 2: Starting Node.js server...
echo.
node dist-api/main.js

