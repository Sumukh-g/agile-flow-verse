# 🚀 Quick Start Guide - Agile Flow Verse

## Overview

Welcome to **Agile Flow Verse** - a comprehensive project management platform with:
- ✅ Full CRUD operations for Projects and Tasks
- ✅ Real-time synchronization
- ✅ Multi-tenant architecture
- ✅ Advanced analytics and reporting
- ✅ Workflow automation
- ✅ Notes/Pages with rich text editor
- ✅ Calendar and Boards (Kanban)
- ✅ Notifications Center

## 🎯 Quick Start (Demo Mode)

The fastest way to try the application:

### 1. Start Frontend Only (Demo Mode)

```bash
# Install dependencies
npm install

# Start the frontend
npm run dev
```

Visit `http://localhost:5173` and click **"Demo Login"** button.

This will let you explore the UI with mock authentication (no backend required).

---

## 🏗️ Full Stack Setup (Backend + Frontend)

For full functionality including database persistence:

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (via Docker)

### Step 1: Start Infrastructure

```bash
# Start PostgreSQL, Redis, Kafka, and Keycloak
docker-compose up -d

# Wait for services to be healthy (about 30 seconds)
docker-compose logs -f postgres
```

### Step 2: Setup Environment

Create a `.env` file in the project root (copy from `env.example`):

```bash
cp env.example .env
```

The default values work for local development.

### Step 3: Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Optional: Seed initial data
npx prisma db seed
```

### Step 4: Start Backend API

```bash
# Terminal 1 - Start the NestJS backend
npm run api:dev
```

The backend will start on `http://localhost:3000`

### Step 5: Start Frontend

```bash
# Terminal 2 - Start the Vite frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

### Step 6: Login

Visit `http://localhost:5173` and:
- Click **"Demo Login"** for instant access, OR
- Use the login form with backend authentication

---

## 📋 Features Overview

### ✅ Fully Functional Features

#### 1. **Projects Management**
- Create, edit, and delete projects
- Set budgets, timelines, and priorities
- Track project progress
- Filter and search projects
- **Page**: `/projects`

#### 2. **Tasks Management**
- Create, edit, and delete tasks
- Assign to projects
- Set status (To Do, In Progress, Review, Done, Blocked)
- Set priorities (Low, Medium, High, Critical)
- Due dates and estimated hours
- Filter by project and status
- **Page**: `/tasks`

#### 3. **Dashboard**
- Real-time statistics
- Project and task overview
- Quick actions
- Visual analytics
- **Page**: `/dashboard`

#### 4. **Authentication**
- Demo login (no backend required)
- Full JWT authentication with backend
- Multi-tenant support
- **Pages**: `/login`, `/signup`

### 🔧 Advanced Features (Backend Configured)

#### 5. **Analytics & Reports**
- Burndown charts
- Velocity reports
- Capacity planning
- Time tracking reports
- Export to CSV/JSON
- **Backend Endpoints**: `/v1/reports/*`, `/v1/analytics/*`

#### 6. **Workflow Automation**
- Create custom workflows
- Trigger-based actions
- Condition evaluation
- Webhook integrations
- **Backend Endpoints**: `/v1/automation/*`

#### 7. **Real-time Synchronization**
- WebSocket-based updates
- Automatic cache invalidation
- Multi-client sync
- **Backend**: WebSocket Gateway on port 3001

#### 8. **Notes/Pages**
- Rich text editor
- Hierarchical structure
- Comments and attachments
- **Page**: `/notes`

#### 9. **Calendar**
- Integrated with projects and tasks
- Due date visualization
- Event management
- **Page**: `/calendar`

#### 10. **Boards (Kanban)**
- Drag-and-drop interface
- Visual task management
- Column customization
- **Page**: `/boards`

---

## 🧪 Testing the Application

### Test Project & Task Creation

1. Go to **Dashboard** (`/dashboard`)
2. Click **"Generate Test Data"** button
3. This will create:
   - A new test project
   - 3 sample tasks (todo, in-progress, done)

### Test Projects Page

1. Go to **Projects** (`/projects`)
2. Click **"New Project"** to create a project
3. Fill in the form and save
4. Click **"Edit"** to modify a project
5. Click **"Delete"** to remove a project
6. Click on a project card to view details

### Test Tasks Page

1. Go to **Tasks** (`/tasks`)
2. Click **"New Task"** to create a task
3. Select a project (must exist)
4. Set status, priority, due date
5. Tasks are automatically grouped by status
6. Use filters to search and filter tasks

---

## 📡 API Endpoints

### Authentication
- `POST /v1/auth/login` - User login
- `POST /v1/auth/register` - User registration
- `POST /v1/auth/refresh` - Refresh token

### Projects
- `GET /v1/projects` - List projects (paginated)
- `POST /v1/projects` - Create project
- `GET /v1/projects/:id` - Get project details
- `PUT /v1/projects/:id` - Update project
- `DELETE /v1/projects/:id` - Delete project

### Tasks
- `GET /v1/tasks` - List tasks (filterable by project)
- `POST /v1/tasks` - Create task
- `GET /v1/tasks/:id` - Get task details
- `PUT /v1/tasks/:id` - Update task
- `DELETE /v1/tasks/:id` - Delete task

### Analytics
- `GET /v1/analytics/performance` - Performance metrics
- `GET /v1/analytics/trends` - Trend data
- `GET /v1/analytics/workload` - Workload analysis
- `GET /v1/analytics/forecast` - Project forecast

### Reports
- `GET /v1/reports/burndown` - Burndown chart
- `GET /v1/reports/velocity` - Velocity report
- `GET /v1/reports/capacity` - Capacity report
- `GET /v1/reports/export` - Export reports

View full API documentation at: `http://localhost:3000/v1/docs` (when backend is running)

---

## 🛠️ Development Commands

```bash
# Frontend
npm run dev          # Start frontend dev server
npm run build        # Build frontend for production
npm run preview      # Preview production build
npm run lint         # Lint frontend code

# Backend
npm run api:dev      # Start backend in watch mode
npm run api:build    # Build backend
npm run api:start    # Start built backend

# Database
npx prisma generate  # Generate Prisma client
npx prisma migrate dev  # Create and apply migration
npx prisma studio    # Open Prisma Studio (database GUI)

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage  # Generate coverage report
```

---

## 🐛 Troubleshooting

### Backend won't start
- Ensure PostgreSQL is running: `docker-compose ps`
- Check database connection in `.env`
- Run migrations: `npx prisma migrate deploy`

### Frontend shows "Network Error"
- Start the backend: `npm run api:dev`
- Check `VITE_API_URL` in `.env` (should be `http://localhost:3000`)
- Use "Demo Login" if you don't need backend features

### Database connection errors
- Restart Docker services: `docker-compose restart`
- Check PostgreSQL logs: `docker-compose logs postgres`

### WebSocket connection fails
- Real-time features require backend running
- Check console for WebSocket errors
- Fallback to manual refresh still works

---

## 🎨 Architecture Overview

### Frontend (React + Vite)
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v7
- **Real-time**: Socket.IO client

### Backend (NestJS)
- **Framework**: NestJS 10 with TypeScript
- **Database**: PostgreSQL 16 with Prisma ORM
- **Cache**: Redis 7
- **Message Queue**: Apache Kafka
- **Authentication**: JWT + Keycloak (optional)
- **Real-time**: Socket.IO Gateway

### Key Features
- **Multi-tenant**: Row-level security in database
- **Event-driven**: Outbox pattern for reliability
- **Optimistic Updates**: Instant UI feedback
- **Offline Support**: Request queuing and sync
- **Caching**: Redis for performance

---

## 📚 Next Steps

1. ✅ Explore the Dashboard and create test data
2. ✅ Create your first project in `/projects`
3. ✅ Add tasks to your project in `/tasks`
4. 🔧 Try the Calendar view to see due dates
5. 🔧 Use Boards for Kanban-style task management
6. 🔧 Create Notes for documentation
7. 🔧 Setup Workflows for automation
8. 🔧 View Analytics and Reports

---

## 📖 Documentation

- **API Docs**: `http://localhost:3000/v1/docs`
- **Backend README**: `BACKEND_README.md`
- **Production Guide**: `PRODUCTION_READINESS_COMPREHENSIVE.md`
- **Features Summary**: `ADVANCED_FEATURES_SUMMARY.md`

---

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the documentation files
3. Check console logs for errors
4. Ensure all services are running

---

**Happy coding! 🚀**




