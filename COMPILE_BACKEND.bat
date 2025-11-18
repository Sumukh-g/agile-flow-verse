@echo off
echo ========================================
echo   COMPILING BACKEND
echo ========================================
echo.

echo Cleaning old build...
if exist dist-api rmdir /s /q dist-api 2>nul
echo.

echo Compiling TypeScript...
call npx tsc -p tsconfig.api.json

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   COMPILATION SUCCESSFUL!
    echo ========================================
    echo.
    echo Backend compiled successfully!
    echo You can now run: npm run api:dev
    echo.
) else (
    echo.
    echo ========================================
    echo   COMPILATION FAILED
    echo ========================================
    echo.
    echo Showing errors (excluding test files):
    echo.
    call npx tsc -p tsconfig.api.json 2>&1 | findstr /V:"spec.ts" | findstr /V:"test.ts" | findstr /C:"error TS"
    echo.
    echo.
    echo Note: Test files are excluded from compilation.
    echo Run 'npx tsc -p tsconfig.api.json' to see all errors.
    echo.
)

pause

