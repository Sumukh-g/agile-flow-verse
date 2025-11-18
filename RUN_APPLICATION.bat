@echo off
cls
echo.
echo ================================================
echo   AGILE FLOW VERSE - APPLICATION STARTUP
echo ================================================
echo.
echo [1/5] Creating .env file...
(
echo DATABASE_URL=postgresql://agileflow:agileflow_password@localhost:5432/agileflow_db
echo REDIS_URL=redis://localhost:6379
echo KEYCLOAK_URL=http://localhost:8080
echo KEYCLOAK_CLIENT_SECRET=dummy-secret
echo JWT_SECRET=super-secret-jwt-key-for-development-change-in-production-32chars
echo JWT_REFRESH_SECRET=super-secret-refresh-key-for-development-change-production-32chars
echo CORS_ORIGINS=http://localhost:5173,http://localhost:3000
echo NODE_ENV=development
echo PORT=3000
) > .env
echo    DONE!
echo.

echo [2/5] Starting Backend Server...
start "BACKEND SERVER - DO NOT CLOSE" cmd /k "npm run api:dev"
echo    Backend starting...
timeout /t 3 /nobreak >nul
echo.

echo [3/5] Starting Frontend Server...
start "FRONTEND SERVER - DO NOT CLOSE" cmd /k "npm run dev"
echo    Frontend starting...
timeout /t 3 /nobreak >nul
echo.

echo [4/5] Waiting for services to start...
timeout /t 8 /nobreak >nul
echo    Services should be ready!
echo.

echo [5/5] Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173
echo.

echo ================================================
echo   STARTUP COMPLETE!
echo ================================================
echo.
echo   Backend:  http://localhost:3000
echo   Frontend: http://localhost:5173
echo   API Docs: http://localhost:3000/v1/docs
echo.
echo   TWO WINDOWS OPENED:
echo   - "BACKEND SERVER - DO NOT CLOSE"
echo   - "FRONTEND SERVER - DO NOT CLOSE"
echo.
echo   Keep those windows open while using the app!
echo.
echo   Press Ctrl+C in each window to stop the servers.
echo.
pause

