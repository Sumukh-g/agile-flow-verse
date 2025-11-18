@echo off
(
echo DATABASE_URL=postgresql://agileflow:agileflow_password@localhost:5432/agileflow_db
echo REDIS_URL=redis://localhost:6379
echo JWT_SECRET=super-secret-jwt-key-for-development-min-32-characters-long-string
echo JWT_REFRESH_SECRET=super-secret-refresh-key-for-development-also-32-characters
echo CORS_ORIGINS=http://localhost:5173,http://localhost:3000
echo NODE_ENV=development
echo PORT=3000
) > .env

echo .env file created successfully!

