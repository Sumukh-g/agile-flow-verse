#!/bin/bash

echo "🚀 Starting Agile Flow Verse Application..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Creating .env file from env.example...${NC}"
    cp env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
fi

# Start development services (PostgreSQL + Redis only)
echo -e "${YELLOW}📦 Starting PostgreSQL and Redis...${NC}"
docker-compose -f docker-compose.dev.yml up -d

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
until docker exec agile-flow-postgres-dev pg_isready -U agileflow > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo -e "${GREEN}✓ PostgreSQL is ready${NC}"

# Wait for Redis to be ready
echo -e "${YELLOW}⏳ Waiting for Redis to be ready...${NC}"
until docker exec agile-flow-redis-dev redis-cli ping > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo -e "${GREEN}✓ Redis is ready${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Install socket.io-client if not present
if ! npm list socket.io-client > /dev/null 2>&1; then
    echo -e "${YELLOW}📦 Installing socket.io-client...${NC}"
    npm install socket.io-client
    echo -e "${GREEN}✓ socket.io-client installed${NC}"
fi

# Generate Prisma Client
echo -e "${YELLOW}🔧 Generating Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"

# Run migrations
echo -e "${YELLOW}🔄 Running database migrations...${NC}"
npx prisma migrate deploy
echo -e "${GREEN}✓ Migrations completed${NC}"

# Apply notification features migration
echo -e "${YELLOW}🔄 Applying notification features migration...${NC}"
docker exec -i agile-flow-postgres-dev psql -U agileflow -d agileflow_db < prisma/migrations/20250107000000_add_notification_features/migration.sql
echo -e "${GREEN}✓ Notification features migration applied${NC}"

# Seed database (optional)
echo -e "${YELLOW}🌱 Seeding database...${NC}"
npx prisma db seed || echo -e "${YELLOW}⚠️  No seed script found or seeding failed${NC}"

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${YELLOW}To start the application:${NC}"
echo -e "  ${GREEN}npm run api:dev${NC}  (in one terminal)"
echo -e "  ${GREEN}npm run dev${NC}      (in another terminal)"
echo ""
echo -e "${YELLOW}Or use:${NC}"
echo -e "  ${GREEN}npm run dev & npm run api:dev${NC}"
echo ""
echo -e "${YELLOW}Access points:${NC}"
echo -e "  Frontend:  ${GREEN}http://localhost:5173${NC}"
echo -e "  Backend:   ${GREEN}http://localhost:3000${NC}"
echo -e "  Swagger:   ${GREEN}http://localhost:3000/v1/docs${NC}"
echo -e "  PostgreSQL: ${GREEN}localhost:5432${NC} (user: agileflow, password: agileflow_password)"
echo -e "  Redis:     ${GREEN}localhost:6379${NC}"
echo ""

