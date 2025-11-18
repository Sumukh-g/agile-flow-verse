# PLAN: Production Readiness - Jira/Linear-Class Product

**Status**: In Progress
**Created**: 2025-11-13
**Goal**: Transform Agile Flow Verse into a production-ready, Jira/Linear-class product

---

## CONSTRAINTS (MUST FOLLOW)

1. ✅ **NO structural/layout changes** - Keep existing navigation, routes, UI structure
2. ✅ **NO feature removal** - Every visible feature must actually work
3. ✅ **Full responsiveness** - Desktop, tablet, mobile (Tailwind breakpoints)
4. ✅ **Automation + AI = BEST-IN-CLASS** - These must be genuine differentiators
5. ✅ **Minimal refactoring** - Only when necessary for correctness

---

## PHASE 1: RECONNAISSANCE & SETUP

### 1.1 Codebase Understanding ✅
- [x] Backend: NestJS + Prisma + PostgreSQL + Redis + Socket.IO
- [x] Frontend: React + Vite + TanStack Query + Tailwind + shadcn/ui
- [x] Models: User, Project, Task, Note, Workflow, Agent, AgentRun, etc.
- [x] API: 60+ endpoints across 14 modules
- [x] Real-time: WebSocket gateway for live updates

### 1.2 Existing State Analysis
- [x] Auth: JWT + refresh tokens (needs review)
- [x] Multi-tenant: Row-level security via Prisma
- [x] Automation: Workflow service exists (needs enhancement)
- [x] AI: Stub service exists (needs full implementation)
- [x] Frontend: Many pages use mock data (needs wiring)
- [x] Real-time: Socket.IO setup exists (needs testing)

---

## PHASE 2: API CONTRACTS & DATA LAYER

### 2.1 Backend DTOs & Validation [ ]
- [ ] Audit all controllers for consistent DTOs
- [ ] Add class-validator to all input DTOs
- [ ] Standardize response shapes (data, traceId, meta)
- [ ] Add proper error handling in all endpoints

**Files to Review/Fix**:
- `src/api/projects/dto.ts` + `projects.controller.ts`
- `src/api/tasks/dto.ts` + `tasks.controller.ts`
- `src/api/notes/dto.ts` + `notes.controller.ts`
- `src/api/calendar/calendar.controller.ts`
- `src/api/notifications/dto.ts` + `notifications.controller.ts`
- `src/api/automation/automation.controller.ts`
- `src/api/dashboard/dashboard.controller.ts`

### 2.2 Frontend API Client & Types [ ]
- [ ] Create/update TypeScript interfaces matching backend DTOs
- [ ] Extend `api-client.ts` with typed functions for all endpoints
- [ ] Replace any `any` types with proper interfaces

**API Modules to Create**:
- `src/lib/api/auth.ts`
- `src/lib/api/projects.ts`
- `src/lib/api/tasks.ts`
- `src/lib/api/notes.ts`
- `src/lib/api/calendar.ts`
- `src/lib/api/notifications.ts`
- `src/lib/api/automation.ts`
- `src/lib/api/agents.ts`
- `src/lib/api/dashboard.ts`

---

## PHASE 3: FRONTEND DATA HOOKS & WIRING

### 3.1 React Query Hooks [ ]
Create/update hooks with proper loading/error states:
- [ ] `useProjects` / `useProject(id)` / `useCreateProject` / `useUpdateProject` / `useDeleteProject`
- [ ] `useTasks` / `useTask(id)` / `useTasksByProject` / `useCreateTask` / `useUpdateTask` / `useDeleteTask`
- [ ] `useNotes` / `useNote(id)` / `useProjectNotes` / `useCreateNote` / `useUpdateNote` / `useDeleteNote`
- [ ] `useCalendarEvents` / `useProjectCalendar` / `useCreateEvent` / `useUpdateEvent`
- [ ] `useNotifications` / `useUnreadCount` / `useMarkRead` / `useMarkAllRead`
- [ ] `useWorkflows` / `useWorkflow(id)` / `useCreateWorkflow` / `useUpdateWorkflow` / `useDeleteWorkflow` / `useTestWorkflow`
- [ ] `useWorkflowExecutions(workflowId)`
- [ ] `useAgents` / `useAgentRuns` / `useRunAgent`
- [ ] `useDashboard` (already exists - review)

### 3.2 Wire Pages to Real Data [ ]
Replace mock data with live API calls:
- [ ] `src/pages/Dashboard.tsx`
- [ ] `src/pages/Projects.tsx`
- [ ] `src/pages/ProjectDetails.tsx`
- [ ] `src/pages/Tasks.tsx`
- [ ] `src/pages/Notes.tsx`
- [ ] `src/pages/CalendarPage.tsx`
- [ ] `src/pages/NotificationsCenter.tsx`
- [ ] `src/pages/AutomationsPage.tsx` ⚠️ CRITICAL
- [ ] `src/pages/DeveloperPage.tsx` (AI/Agents section) ⚠️ CRITICAL
- [ ] `src/pages/Boards.tsx`

### 3.3 Loading/Error/Empty States [ ]
Ensure every page has:
- [ ] Loading skeletons (within existing layout)
- [ ] Error messages with retry options
- [ ] Empty states with CTAs ("Create your first project", etc.)
- [ ] Proper fallbacks for failed queries

---

## PHASE 4: RESPONSIVENESS & LAYOUT POLISH

### 4.1 Responsive Design Audit [ ]
Test and fix on mobile/tablet/desktop:
- [ ] Landing page
- [ ] Auth pages (Login, SignUp)
- [ ] Dashboard
- [ ] Projects list + detail
- [ ] Tasks list + boards
- [ ] Notes (Notion-style)
- [ ] Calendar
- [ ] Notifications center
- [ ] Automation page ⚠️
- [ ] Developer/AI page ⚠️
- [ ] Settings
- [ ] Admin

### 4.2 Layout Fixes [ ]
- [ ] No horizontal scroll on mobile
- [ ] Sidebars collapse/stack properly
- [ ] Tables scroll or paginate
- [ ] Modals/dialogs fit on small screens
- [ ] Touch targets are large enough (min 44x44px)

---

## PHASE 5: AUTH & TENANCY

### 5.1 Backend Auth [ ]
- [ ] Review JWT generation/validation
- [ ] Test refresh token flow
- [ ] Verify tenant isolation (RLS)
- [ ] Test guards/interceptors

### 5.2 Frontend Auth [ ]
- [ ] Fix `AuthProvider` (src/lib/auth-context.tsx)
- [ ] Handle token expiry + refresh
- [ ] Protected routes work correctly
- [ ] Clear state on logout
- [ ] Redirect to login when unauthenticated

---

## PHASE 6: CORE PRODUCT (Projects, Tasks, Notes)

### 6.1 Projects [ ]
- [ ] List projects with real data
- [ ] Create/edit/delete projects
- [ ] Project detail page shows real stats
- [ ] Project members management
- [ ] Project filtering/sorting

### 6.2 Tasks [ ]
- [ ] List tasks with filtering (status, priority, assignee, project)
- [ ] Task detail view/modal
- [ ] Create/edit/delete tasks
- [ ] Assign users to tasks
- [ ] Task dependencies
- [ ] Status changes (Kanban drag/drop)
- [ ] Task comments
- [ ] Time tracking

### 6.3 Notes [ ]
- [ ] List notes by project/global
- [ ] Rich text editor works
- [ ] Create/edit/delete notes
- [ ] Attachments: upload, list, download, delete
- [ ] Comments on notes
- [ ] Hierarchical notes (parent/child)
- [ ] Search notes

### 6.4 Calendar [ ]
- [ ] Calendar view renders real events
- [ ] Create/edit/delete events
- [ ] Link events to projects/tasks
- [ ] Different views (month/week/day)

### 6.5 Dashboard [ ]
- [ ] Real-time project stats
- [ ] Task completion charts
- [ ] Recent activity feed
- [ ] Workload/capacity widgets
- [ ] Customizable widgets (if applicable)

---

## PHASE 7: AUTOMATION (BEST-IN-CLASS) ⚠️ CRITICAL

### 7.1 Backend Automation Enhancement [ ]
- [x] Workflow CRUD (already exists)
- [x] WorkflowExecution logging (already exists)
- [ ] Test all trigger types:
  - `task_created`, `task_updated`, `task_completed`, `task_assigned`
  - `project_created`, `due_date_approaching`
- [ ] Test all action types:
  - `create_task`, `update_task`, `send_notification`, `assign_user`, `change_status`, `send_email`, `webhook`
- [ ] Add AI action: `run_agent` (integrate with AI service)
- [ ] Add more robust condition evaluation
- [ ] Add workflow execution history endpoint

### 7.2 Frontend Automation UI [ ]
- [ ] Workflow list: fetch real workflows
- [ ] Create workflow dialog/page with:
  - **Trigger selection** (dropdown with all types)
  - **Condition builder** (add/remove conditions, field/operator/value)
  - **Action builder** (add/remove actions, type + parameters)
- [ ] Edit workflow (load existing, update)
- [ ] Delete workflow (with confirmation)
- [ ] Enable/disable toggle
- [ ] Test workflow button (send sample data, show results)
- [ ] Execution history view:
  - List executions for a workflow
  - Show status (success/error)
  - Show timestamp
  - Show error details if failed
- [ ] Responsive layout (stack panels on mobile)
- [ ] Input validation (Zod + react-hook-form)
- [ ] Success/error toasts

### 7.3 Automation Examples & Templates [ ]
- [ ] Pre-defined workflow templates:
  - Auto-assign tasks based on tags
  - Send notification when task overdue
  - Create subtask when parent moves to "In Progress"
  - Webhook to external service on project completion
  - AI-generated task descriptions

---

## PHASE 8: AGENTIC AI (BEST-IN-CLASS) ⚠️ CRITICAL

### 8.1 Backend AI Service Implementation [ ]
- [ ] Read AI provider config from env (`AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`)
- [ ] Implement generic AI completion function (OpenAI-compatible)
- [ ] Core AI methods:
  - `summarizeText(text, context)`
  - `generateTasksFromDescription(description, projectContext)`
  - `generateUpdateMessage(project, tasks, context)`
  - `analyzeWorkflow(workflow, context)`
  - `generateNoteOutline(topic, context)`
  - `extractActionItems(text, context)`
- [ ] Agent orchestration:
  - **Intake Agent**: Normalize project/goal descriptions
  - **Planner Agent**: Break into tasks and milestones
  - **Comms Agent**: Generate updates/messages
  - **Summarizer Agent**: Summarize activity/notes
- [ ] AgentRun persistence:
  - Save input, output, tools used, cost, status
- [ ] Error handling + retries
- [ ] Rate limiting awareness

### 8.2 Frontend AI/Agent UI [ ]
- [ ] Agent list (show available agents with roles)
- [ ] Agent configuration (if needed)
- [ ] "Run agent" flows:
  - **Intake**: Input = project description → Output = normalized structure
  - **Planner**: Input = project + goals → Output = task breakdown
  - **Comms**: Input = project + time period → Output = status update
  - **Summarizer**: Input = note IDs or task IDs → Output = summary
- [ ] Show agent run history:
  - List past runs for each agent
  - Show input/output
  - Show cost if available
  - Show execution time
- [ ] Integrate AI into workflows:
  - Action type: `run_agent`
  - Parameters: agentId, input mapping
- [ ] Contextual AI buttons:
  - "Generate tasks" button on project page
  - "Summarize notes" button on notes page
  - "AI suggest" on task assignment
- [ ] Loading states (AI can be slow)
- [ ] Stream responses if possible (for better UX)
- [ ] Cost estimation/warnings

### 8.3 AI Safety & UX [ ]
- [ ] Never hardcode API keys (always env)
- [ ] Show clear messages when AI is not configured
- [ ] Rate limit UI to prevent abuse
- [ ] Allow users to edit AI output before accepting
- [ ] Undo/rollback for AI-generated changes
- [ ] Transparent cost display (if applicable)

---

## PHASE 9: REAL-TIME FEATURES

### 9.1 Backend Real-time [ ]
- [ ] Verify WebSocket gateway setup
- [ ] Emit events on mutations:
  - `project.created`, `project.updated`, `project.deleted`
  - `task.created`, `task.updated`, `task.deleted`, `task.status_changed`
  - `note.created`, `note.updated`, `note.deleted`
  - `notification.created`
- [ ] Tenant-scoped rooms (don't broadcast across tenants)

### 9.2 Frontend Real-time [ ]
- [ ] Connect to WebSocket on auth
- [ ] Listen for events and invalidate React Query cache
- [ ] Show toast notifications for relevant events
- [ ] Update UI optimistically where appropriate
- [ ] Handle reconnection

---

## PHASE 10: NOTIFICATIONS

### 10.1 Backend Notifications [ ]
- [ ] In-app notifications (already exists)
- [ ] Notification preferences (optional)
- [ ] Mark read/unread
- [ ] Mark all read
- [ ] Delete notifications
- [ ] Archive notifications
- [ ] Pagination

### 10.2 Frontend Notifications [ ]
- [ ] Notification center (already exists - review)
- [ ] Unread count badge
- [ ] Real-time updates
- [ ] Mark as read on click
- [ ] Filter by type/status
- [ ] Responsive layout

---

## PHASE 11: SEARCH

### 11.1 Backend Search [ ]
- [ ] Full-text search across projects, tasks, notes
- [ ] Filter by type
- [ ] Pagination
- [ ] Relevance scoring

### 11.2 Frontend Search [ ]
- [ ] Global search component
- [ ] Search suggestions/autocomplete
- [ ] Recent searches
- [ ] Navigate to result

---

## PHASE 12: ANALYTICS & REPORTS

### 12.1 Backend Analytics [ ]
- [ ] Project analytics (completion %, velocity, etc.)
- [ ] Task analytics (by status, priority, assignee)
- [ ] User analytics (workload, productivity)
- [ ] Tenant-level analytics
- [ ] Time-series data for trends

### 12.2 Backend Reports [ ]
- [ ] Burndown charts
- [ ] Velocity reports
- [ ] Capacity planning
- [ ] Time tracking reports
- [ ] Export (CSV/JSON)

### 12.3 Frontend Analytics/Reports [ ]
- [ ] Dashboard charts (Recharts)
- [ ] Reports page with filters
- [ ] Export buttons
- [ ] Responsive charts

---

## PHASE 13: ADMIN & SETTINGS

### 13.1 Admin Page [ ]
- [ ] Tenant management (view, edit settings)
- [ ] User management (list, roles)
- [ ] Feature flags (if applicable)
- [ ] System monitoring

### 13.2 Settings Page [ ]
- [ ] User profile
- [ ] Notification preferences
- [ ] Theme selection
- [ ] API keys (for integrations)

---

## PHASE 14: TESTING & VALIDATION

### 14.1 Manual Testing [ ]
- [ ] Auth flows (login, signup, logout, refresh)
- [ ] Projects CRUD
- [ ] Tasks CRUD + status changes
- [ ] Notes CRUD + attachments
- [ ] Calendar CRUD
- [ ] Notifications (create, read, delete)
- [ ] Automation (create, test, execute)
- [ ] AI agents (run, view history)
- [ ] Real-time updates
- [ ] Search
- [ ] Reports

### 14.2 Responsive Testing [ ]
- [ ] Test all major pages on mobile
- [ ] Test all major pages on tablet
- [ ] Test all major pages on desktop

### 14.3 Edge Cases [ ]
- [ ] Empty states
- [ ] Error states
- [ ] Offline behavior
- [ ] Slow network
- [ ] Large datasets

---

## PHASE 15: DOCUMENTATION & POLISH

### 15.1 Documentation [ ]
- [ ] Update README with production setup
- [ ] API documentation (Swagger)
- [ ] User guide (optional)
- [ ] Developer guide

### 15.2 Code Quality [ ]
- [ ] Remove console.logs
- [ ] Remove unused imports
- [ ] Fix linter warnings
- [ ] Add comments where needed

### 15.3 Performance [ ]
- [ ] Optimize queries (indexes, pagination)
- [ ] Lazy load components
- [ ] Code splitting
- [ ] Image optimization

---

## SUCCESS METRICS

- ✅ All pages load with real data
- ✅ No mock data anywhere in production code
- ✅ All features work end-to-end
- ✅ Automation is genuinely useful (3+ real-world workflows)
- ✅ AI agents produce meaningful results
- ✅ Responsive on all devices
- ✅ No console errors
- ✅ Auth is secure and reliable
- ✅ Real-time updates work
- ✅ Performance is acceptable (<2s page loads)

---

## NOTES

- Focus on **Automation** and **AI** first (phases 7-8) after core data wiring
- Keep existing UI structure - only fix bugs and wire data
- Use Tailwind + shadcn/ui patterns consistently
- Validate all inputs (frontend + backend)
- Handle errors gracefully everywhere
- Test incrementally - don't move to next phase until current phase works

---

## PROGRESS TRACKING

**Current Phase**: PHASE 8 - Agentic AI Implementation
**Next Up**: Create AI controller endpoints and integrate with workflows
**Blockers**: None
**Last Updated**: 2025-11-13 02:15 UTC

## COMPLETED WORK

### ✅ Phase 1: Reconnaissance
- Understood codebase structure (NestJS + React + Prisma)
- Analyzed existing DTOs, services, and models
- Created comprehensive production readiness plan

### ✅ Phase 2: API Contracts & Data Layer
- Backend DTOs are well-validated with class-validator
- Consistent API response shapes across all endpoints
- Proper error handling infrastructure in place

### ✅ Phase 3: Frontend API Client & Types
- Created `src/lib/api/types.ts` with complete TypeScript interfaces
- Built modular API clients:
  - `auth.ts`, `projects.ts`, `tasks.ts`, `notes.ts`
  - `notifications.ts`, `automation.ts`, `agents.ts`
  - `calendar.ts`, `dashboard.ts`
- Centralized export in `src/lib/api/index.ts`

### ✅ Phase 4: React Query Hooks
- Created comprehensive hooks with optimistic updates:
  - `useProjectsEnhanced.ts` - Full CRUD with optimistic updates
  - `useTasksEnhanced.ts` - Tasks with assignment management
  - `useNotesEnhanced.ts` - Notes with attachments & comments
  - `useNotificationsEnhanced.ts` - Real-time notification management
  - `useAutomation.ts` - Workflow management & testing
  - `useAgents.ts` - AI agent execution & history
  - `useCalendarEnhanced.ts` - Calendar event management
  - `useDashboardEnhanced.ts` - Dashboard stats
- All hooks include proper loading/error states and toast notifications

### ✅ Phase 5: AI Service Implementation (Backend)
- Implemented comprehensive `AiService` with:
  - OpenAI-compatible API integration
  - Environment-based configuration (AI_PROVIDER, AI_API_KEY, AI_MODEL, AI_BASE_URL)
  - Mock mode when AI not configured
  - Core AI methods:
    - `summarizeText()`
    - `generateTasksFromDescription()`
    - `generateUpdateMessage()`
    - `analyzeWorkflow()`
    - `generateNoteOutline()`
    - `extractActionItems()`
  - Full agent orchestration system:
    - **Intake Agent**: Normalizes project descriptions
    - **Planner Agent**: Breaks down into tasks & milestones
    - **Comms Agent**: Generates status updates
    - **Summarizer Agent**: Summarizes notes/tasks
  - `runAgent()` method with tracking to AgentRun table
  - Cost tracking and tool call counting

## IN PROGRESS

### 🔄 Phase 8: AI Backend Integration
- Need to create AI controller with endpoints
- Need to add `run_agent` action to workflow service
- Need to seed default agents in database

## NEXT STEPS (Priority Order)

1. **AI Controller Endpoints** - Create REST endpoints for AI features
2. **Integrate AI with Workflows** - Add `run_agent` action type
3. **Seed Default Agents** - Create initial agents in database
4. **Wire Pages to Real Data** - Replace mocks with live API calls
5. **Build Automation UI** - Production-ready workflow builder
6. **Build AI Agent UI** - Agent execution interface
7. **Responsive Design Audit** - Fix mobile/tablet layouts
8. **End-to-End Testing** - Verify all features work

