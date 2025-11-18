@echo off
echo Compiling TypeScript...
call npx tsc -p tsconfig.api.json
if %errorlevel% neq 0 (
    echo Compilation failed!
    pause
    exit /b 1
)

echo.
echo Renaming main.js to main.cjs for CommonJS compatibility...
if exist dist-api\main.js (
    move /Y dist-api\main.js dist-api\main.cjs >nul
)

echo.
echo Starting backend...
node dist-api/main.cjs


