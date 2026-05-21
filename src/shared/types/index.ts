/**
 * Central Type Exports
 * Single source of truth for all types used across the application
 */

// ============================================
// ENUMS
// ============================================
export * from './enums';

// ============================================
// API RESPONSE TYPES
// ============================================
export * from './api-response';

// ============================================
// BASE DTOs
// ============================================
export * from './dto/base.dto';

// ============================================
// DOMAIN DTOs
// ============================================
export * from './dto/tasks.dto';
export * from './dto/projects.dto';
export * from './dto/issues.dto';
export * from './dto/notes.dto';
export * from './dto/auth.dto';

// ============================================
// PRISMA TYPES
// ============================================
// Re-export Prisma types for convenience
export type {
  Task,
  Project,
  User,
  Note,
  Issue,
  Comment,
  Attachment,
  Notification,
  CalendarEvent,
  ProjectMember,
  TaskAssignee,
  TaskDependency,
  TimeLog,
  Tenant,
  Role,
  RoleAssignment,
  CrmClient,
  CrmProject,
  CrmDeal,
  Form,
  FormResponse,
  Workflow,
  WorkflowExecution,
  KanbanColumn,
  KanbanCard,
  GanttTask,
  GanttDependency,
  Timesheet,
  Invoice,
  Expense,
  BillableRate,
  Payment,
  Budget,
  BudgetAlert,
  FinancialReport,
  RecurringInvoice,
} from '@prisma/client';

// ============================================
// COMMON TYPES
// ============================================

/**
 * Authenticated request user object
 */
export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  email: string;
  name: string;
  roles?: string[];
  permissions?: string[];
}

/**
 * Request with authenticated user
 */
export interface AuthenticatedRequest {
  user: AuthenticatedUser;
}

