/**
 * Centralized Enums
 * Single source of truth for all enum values used across the application
 */

// ============================================
// TASK ENUMS
// ============================================

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  REVIEW = 'review',
  DONE = 'done',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// ============================================
// PROJECT ENUMS
// ============================================

export enum ProjectStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ON_HOLD = 'on-hold',
  CANCELLED = 'cancelled',
}

export enum ProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ProjectMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

// ============================================
// ISSUE ENUMS
// ============================================

export enum IssueStatus {
  INBOX = 'INBOX',
  NEEDS_INFO = 'NEEDS_INFO',
  TRIAGED = 'TRIAGED',
  PLANNED = 'PLANNED',
  READY_FOR_DEV = 'READY_FOR_DEV',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  IN_QA = 'IN_QA',
  DONE = 'DONE',
  WONT_DO = 'WONT_DO',
  DUPLICATE = 'DUPLICATE',
  ON_HOLD = 'ON_HOLD',
}

export enum IssueType {
  BUG = 'BUG',
  STORY = 'STORY',
  TASK = 'TASK',
  INCIDENT = 'INCIDENT',
  SUPPORT = 'SUPPORT',
}

export enum IssueSeverity {
  CRITICAL = 'CRITICAL',
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
}

export enum IssuePriority {
  P0 = 'P0',
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
}

// ============================================
// NOTIFICATION ENUMS
// ============================================

export enum NotificationType {
  TASK_ASSIGNED = 'task.assigned',
  TASK_UPDATED = 'task.updated',
  TASK_COMPLETED = 'task.completed',
  TASK_OVERDUE = 'task.overdue',
  PROJECT_UPDATED = 'project.updated',
  COMMENT_ADDED = 'comment.added',
  MENTION = 'mention',
  SYSTEM = 'system',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

// ============================================
// CALENDAR ENUMS
// ============================================

export enum CalendarEventType {
  MEETING = 'MEETING',
  TASK_DEADLINE = 'TASK_DEADLINE',
  ISSUE_DUE = 'ISSUE_DUE',
  REMINDER = 'REMINDER',
  NOTE_DATE = 'NOTE_DATE',
  OTHER = 'OTHER',
}

export enum CalendarEventSourceType {
  TASK = 'TASK',
  ISSUE = 'ISSUE',
  NOTE = 'NOTE',
}

export enum ExternalCalendarSource {
  NONE = 'NONE',
  GOOGLE = 'GOOGLE',
  OUTLOOK = 'OUTLOOK',
}

export enum CalendarSyncDirection {
  APP_TO_EXTERNAL = 'APP_TO_EXTERNAL',
  EXTERNAL_TO_APP = 'EXTERNAL_TO_APP',
  BIDIRECTIONAL = 'BIDIRECTIONAL',
}

// ============================================
// FINANCE ENUMS
// ============================================

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  VOID = 'VOID',
  DISPUTED = 'DISPUTED',
}

export enum InvoiceGroupingStrategy {
  DETAILED = 'DETAILED',
  BY_ROLE = 'BY_ROLE',
  BY_EPIC = 'BY_EPIC',
  BY_TASK = 'BY_TASK',
  BY_USER = 'BY_USER',
  BY_DATE = 'BY_DATE',
}

export enum ExpenseStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REIMBURSED = 'REIMBURSED',
  INVOICED = 'INVOICED',
}

export enum ExpenseCategory {
  TRAVEL = 'TRAVEL',
  SOFTWARE = 'SOFTWARE',
  HARDWARE = 'HARDWARE',
  HOSTING = 'HOSTING',
  MARKETING = 'MARKETING',
  OFFICE_SUPPLIES = 'OFFICE_SUPPLIES',
  CONSULTING = 'CONSULTING',
  SUBCONTRACTOR = 'SUBCONTRACTOR',
  MEALS = 'MEALS',
  ACCOMMODATION = 'ACCOMMODATION',
  TRANSPORTATION = 'TRANSPORTATION',
  COMMUNICATION = 'COMMUNICATION',
  TRAINING = 'TRAINING',
  LICENSE = 'LICENSE',
  OTHER = 'OTHER',
}

export enum BudgetAlertType {
  THRESHOLD_WARNING = 'THRESHOLD_WARNING',
  THRESHOLD_CRITICAL = 'THRESHOLD_CRITICAL',
  OVERSPEND = 'OVERSPEND',
  MONTHLY_REPORT = 'MONTHLY_REPORT',
}

// ============================================
// USER & ROLE ENUMS
// ============================================

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

// ============================================
// FORM ENUMS
// ============================================

export enum FormStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

// ============================================
// CRM ENUMS
// ============================================

export enum CrmClientStatus {
  LEAD = 'lead',
  PROSPECT = 'prospect',
  CLIENT = 'client',
  INACTIVE = 'inactive',
}

export enum CrmDealStage {
  LEAD = 'lead',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  CLOSED_WON = 'closed-won',
  CLOSED_LOST = 'closed-lost',
}

export enum CrmProjectStatus {
  IN_PROGRESS = 'in-progress',
  PLANNING = 'planning',
  REVIEW = 'review',
  COMPLETED = 'completed',
  ON_HOLD = 'on-hold',
  CANCELLED = 'cancelled',
}

