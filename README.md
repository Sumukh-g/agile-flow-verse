# Agile Flow Verse

Agile Flow Verse is a full-stack, multi-tenant work management platform for agile teams.  
It combines project planning, task execution, sprint workflows, notes, automation, analytics, and reporting in one system.

## Highlights

- Multi-tenant architecture with tenant-scoped access controls
- Auth with JWT, refresh token flow, OAuth providers, and optional 2FA
- Scrum and delivery workflows (projects, tasks, backlog, sprints, epics, kanban, gantt)
- Collaboration features (notes, comments, notifications, calendar)
- Automation engine with rule execution tracking
- AI-assisted capabilities for planning, estimation, and summaries

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite
- React Router
- TanStack Query
- Tailwind CSS + Radix UI components

### Backend
- NestJS 10 (modular architecture)
- Prisma ORM
- PostgreSQL
- Redis (cache/rate limiting/idempotency support)
- Socket.IO (real-time updates)
- Swagger/OpenAPI docs

### Infrastructure
- Docker / Docker Compose
- Kafka and outbox support in backend modules

## Repository Structure

- `src/` - Frontend application
- `src/api/` - NestJS backend API
- `src/shared/` - Shared types and DTO schemas
- `prisma/` - Database schema and migrations
- `scripts/` - Data migration and maintenance scripts

## Getting Started

### 1) Install dependencies
```sh
npm install
```

### 2) Configure environment
Copy `env.example` to `.env` and update values for your machine.

### 3) Start local infrastructure (recommended)
```sh
docker-compose up -d postgres redis
```

### 4) Generate Prisma client and run migrations
```sh
npx prisma generate
npx prisma migrate dev
```

### 5) Run frontend and backend
In one terminal:
```sh
npm run dev
```

In another terminal:
```sh
npm run api:dev
```

Frontend runs on `http://localhost:5173` and backend on `http://localhost:3000` by default.

## API Docs

When running in non-production mode, Swagger UI is available at:

- `http://localhost:3000/v1/docs`

## Testing

```sh
npm test
npm run test:coverage
```

## Full Stack via Docker

To run most services with one command:

```sh
docker-compose up -d
```

## Notes

- This repository currently contains active feature work and migration scripts.
- Review pending changes before production deployment and keep secrets in `.env` only.
