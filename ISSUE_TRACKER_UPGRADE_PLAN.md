# Issue Tracker Upgrade Plan

## Current State Analysis

### Backend (Prisma Schema)
- **Issue Model** exists with:
  - Basic fields: `title`, `description`, `status`, `priority`, `type`, `severity`
  - Relationships: `assignee`, `reporter`, `project`, `tenant`
  - Current statuses: `backlog`, `todo`, `in-progress`, `review`, `done`, `closed`
  - Current types: `bug`, `feature`, `task`, `improvement`
  - Current priorities: `low`, `medium`, `high`, `critical`
  - Missing: `componentId`, new status values

### Backend (NestJS)
- **IssuesService**: Full CRUD with filtering/sorting
- **IssuesController**: REST endpoints for issues
- **DTOs**: Validation for create/update/query
- **Multi-tenant**: Properly scoped to tenant/project

### Frontend (React)
- **ProjectIssueTracker**: Kanban + List views
- **Hooks**: `useIssues`, `useCreateIssue`, `useUpdateIssue`, etc.
- **UI**: Basic status badges, priority colors, drag-and-drop
- Missing: Triage board, Dev board, component support

---

## Upgrade Plan

### Phase 1: Database Schema & Backend (Foundation)
1. ✅ Update Prisma schema with new enums and fields
2. ✅ Create migration with safe backfill
3. ✅ Update DTOs with new enum values
4. ✅ Update service methods

### Phase 2: Frontend Types & API
5. ✅ Update TypeScript interfaces
6. ✅ Update API client types

### Phase 3: UI Components
7. ✅ Create TriageBoard component
8. ✅ Create DevBoard component  
9. ✅ Update ProjectIssueTracker with tabs
10. ✅ Enhance Issue detail view

---

## Status Mapping (Old → New)

| Old Status | New Status | Notes |
|------------|------------|-------|
| `backlog` | `INBOX` | New issues start here |
| `todo` | `READY_FOR_DEV` | Ready to work on |
| `in-progress` | `IN_PROGRESS` | Same |
| `review` | `IN_REVIEW` | Same |
| `done` | `DONE` | Same |
| `closed` | `WONT_DO` or `DONE` | Based on context |

New statuses to add:
- `NEEDS_INFO`
- `TRIAGED`
- `PLANNED`
- `IN_QA`
- `DUPLICATE`
- `ON_HOLD`

---

## Implementation Order

1. **Prisma Schema** → Migration → Backend DTOs → Service
2. **Frontend Types** → API Client
3. **Triage Board** → Dev Board → Updated Tracker
4. **Issue Detail** enhancements

