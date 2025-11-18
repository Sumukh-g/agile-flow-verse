@echo off
echo Waiting 15 seconds for backend to start...
timeout /t 15 /nobreak > nul
echo.
echo Checking backend status...
call check-status.bat

