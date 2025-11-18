@echo off
echo ========================================
echo FIXING .env FILE - FINAL ATTEMPT
echo ========================================
echo.

echo Backing up current .env...
copy .env .env.broken 2>nul

echo Creating clean .env from env.example...
copy env.example .env

echo.
echo ✅ .env restored from example
echo.
echo Current DATABASE_URL:
findstr DATABASE_URL .env
echo.
echo.
echo ========================================
echo STARTING BACKEND NOW
echo ========================================
echo.
npm run api:start

