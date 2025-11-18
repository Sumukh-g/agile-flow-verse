@echo off
echo Creating new .env file...
(
echo DATABASE_URL="postgresql://agileflow:agileflow_password@localhost:5432/agileflow_db"
echo.
echo REDIS_HOST=localhost
echo REDIS_PORT=6379
echo.
echo KAFKA_BROKERS=localhost:9092
echo.
echo JWT_SECRET=your-secret-key-change-in-production-use-strong-random-string
echo JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production-use-strong-random-string
echo JWT_EXPIRATION=1h
echo JWT_REFRESH_EXPIRATION=7d
echo.
echo API_URL=http://localhost:3000
echo PORT=3000
echo.
echo VITE_API_URL=http://localhost:3000
echo.
echo UPLOAD_PATH=./uploads
echo MAX_FILE_SIZE=10485760
echo.
echo NODE_ENV=development
echo.
echo ENABLE_KAFKA=false
echo ENABLE_EMAIL=false
echo ENABLE_KEYCLOAK=false
) > .env

echo ✅ New .env file created
type .env

