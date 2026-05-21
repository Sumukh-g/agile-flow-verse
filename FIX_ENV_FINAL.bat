@echo off
echo ========================================
echo FIXING ENVIRONMENT AND DEPENDENCIES
echo ========================================
echo.

echo Step 1: Installing missing packages...
call npm install @radix-ui/react-slider socket.io-client @nestjs/jwt @types/multer
if errorlevel 1 (
    echo WARNING: Some packages may have failed to install
)

echo.
echo Step 2: Backing up current .env...
copy .env .env.broken 2>nul

echo Step 3: Creating clean .env from env.example...
if exist env.example (
    copy env.example .env
    echo ✅ .env restored from example
) else (
    echo WARNING: env.example not found, skipping .env restore
)

echo.
echo Current DATABASE_URL:
findstr DATABASE_URL .env 2>nul
echo.
echo.
echo ========================================
echo STARTING BACKEND NOW
echo ========================================
echo.
npm run api:dev

