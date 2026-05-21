@echo off
echo Installing missing packages...
call npm install @radix-ui/react-slider socket.io-client @nestjs/jwt @types/multer
echo.
echo Installation complete!
pause

