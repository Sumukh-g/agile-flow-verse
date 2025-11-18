@echo off
echo ======================================
echo Agile Flow Verse - Status Check
echo ======================================
echo.

echo [1] Checking Docker Services...
docker ps --format "table {{.Names}}\t{{.Status}}" | findstr /C:"agile"
echo.

echo [2] Checking Port 3000 (Backend)...
netstat -ano | findstr ":3000" || echo No process on port 3000
echo.

echo [3] Checking Port 5173 (Frontend)...
netstat -ano | findstr ":5173" || echo No process on port 5173
echo.

echo [4] Checking Database Tables...
docker exec agile-postgres psql -U agileflow -d agileflow_db -c "\dt" 2>nul || echo Database check failed
echo.

echo [5] Testing Backend Health Endpoint...
curl -s http://localhost:3000/v1/health 2>nul || echo Backend not responding
echo.

echo ======================================
echo Status Check Complete
echo ======================================
pause

