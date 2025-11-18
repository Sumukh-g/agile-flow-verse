@echo off
echo ========================================
echo   STARTING BACKEND SERVER
echo ========================================
echo.

echo Step 1: Cleaning old build...
if exist dist-api rmdir /s /q dist-api 2>nul
echo.

echo Step 2: Compiling TypeScript...
call npx tsc -p tsconfig.api.json
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Compilation failed!
    pause
    exit /b 1
)
echo ✓ Compilation successful!
echo.

echo Step 3: Ensuring package.json exists...
if not exist dist-api\package.json (
    echo {"type": "commonjs"} > dist-api\package.json
    echo ✓ Created dist-api/package.json
)
echo.

echo Step 4: Starting backend server...
echo.
cd dist-api
node main.js


