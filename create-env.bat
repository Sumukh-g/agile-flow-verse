@echo off
(
echo DATABASE_URL=postgresql://agileflow:agileflow_password@localhost:5432/agileflow_db
echo REDIS_URL=redis://localhost:6379
echo KEYCLOAK_URL=http://localhost:8080
echo KEYCLOAK_CLIENT_SECRET=dummy-secret-not-needed
echo JWT_SECRET=super-secret-jwt-key-change-in-production-min-32-chars-long
echo JWT_REFRESH_SECRET=super-secret-refresh-key-change-in-production-also-32-chars
echo CORS_ORIGINS=http://localhost:5173,http://localhost:3000
echo NODE_ENV=development
echo PORT=3000
) > .env

echo .env file created!
pause

