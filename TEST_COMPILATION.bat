@echo off
echo ========================================
echo   TESTING BACKEND COMPILATION
echo ========================================
echo.

echo Cleaning old build...
if exist dist-api rmdir /s /q dist-api
echo.

echo Compiling TypeScript...
tsc -p tsconfig.api.json

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   ✓ COMPILATION SUCCESSFUL!
    echo ========================================
    echo.
    echo You can now run: npm run api:dev
    echo.
) else (
    echo.
    echo ========================================
    echo   ✗ COMPILATION FAILED
    echo ========================================
    echo.
    echo Check the errors above.
    echo.
    echo Note: Test files (*.spec.ts, *.test.ts) are excluded
    echo and should be run separately with Jest.
    echo.
)

pause
