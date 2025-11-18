/**
 * Shared API types matching backend DTOs
 */

// === Projects ===
export enum ProjectStatus {
  Active = 'active',
  Completed = 'completed',
  OnHold = 'on-hold',
  Cancelled = 'cancelled',
}

export enum ProjectPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  budget?: number;
  spent?: number;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  isPublic?: boolean;
  tenantId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  members?: ProjectMember[];
  tasks?: Task[];
  _count?: {
    tasks: number;
    members: number;
  };
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  progress?: number;
  budget?: number;
  spent?: number;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  progress?: number;
  budget?: number;
  spent?: number;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface ProjectQueryDto {
  search?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  limit?: number;
  cursor?: string;
}

// === Tasks ===
export enum TaskStatus {
  Todo = 'todo',
  InProgress = 'in-progress',
  Review = 'review',
  Done = 'done',
  Blocked = 'blocked',
  Cancelled = 'cancelled',
}

export enum TaskPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  projectId: string;
  tenantId: string;
  tags?: string[];
  isBlocked?: boolean;
  blockReason?: string;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  assignees?: User[];
  dependencies?: Task[];
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  projectId: string;
  assigneeIds?: string[];
  dependencyIds?: string[];
  tags?: string[];
  isBlocked?: boolean;
  blockReason?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  assigneeIds?: string[];
  dependencyIds?: string[];
  tags?: string[];
  isBlocked?: boolean;
  blockReason?: string;
}

export interface TaskQueryDto {
  search?: string;
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
  tags?: string[];
  limit?: number;
  cursor?: string;
}

// === Notes ===
export interface Note {
  id: string;
  title: string;
  content: string; // JSON string for rich text
  parentId?: string;
  projectId: string;
  tenantId: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  project?: Project;
  parent?: Note;
  children?: Note[];
  attachments?: Attachment[];
  comments?: Comment[];
}

export interface CreateNoteDto {
  title: string;
  content: string;
  parentId?: string;
  projectId: string;
  tags?: string[];
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
  parentId?: string;
  projectId?: string;
  tags?: string[];
}

// === Notifications ===
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

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  readAt?: string;
  archived: boolean;
  priority: NotificationPriority;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  priority?: NotificationPriority;
}

export interface NotificationQueryDto {
  search?: string;
  type?: NotificationType;
  read?: boolean;
  priority?: NotificationPriority;
  limit?: number;
  offset?: number;
}

// === Workflow (Automation) ===
export interface WorkflowTrigger {
  type: 'task_created' | 'task_updated' | 'task_completed' | 'task_assigned' | 'project_created' | 'due_date_approaching' | 'custom';
  conditions?: Record<string, any>;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface WorkflowAction {
  type: 'create_task' | 'update_task' | 'send_notification' | 'assign_user' | 'change_status' | 'send_email' | 'webhook' | 'run_agent' | 'custom';
  parameters: Record<string, any>;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  projectId?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  executions?: WorkflowExecution[];
}

export interface CreateWorkflowDto {
  name: string;
  description?: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  projectId?: string;
}

export interface UpdateWorkflowDto {
  name?: string;
  description?: string;
  enabled?: boolean;
  trigger?: WorkflowTrigger;
  conditions?: WorkflowCondition[];
  actions?: WorkflowAction[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  tenantId: string;
  status: 'success' | 'error';
  data: any;
  error?: string;
  createdAt: string;
  workflow?: Workflow;
}

export interface TestWorkflowResult {
  conditionsMet: boolean;
  actionsExecuted: string[];
  errors: string[];
}

// === Agent (AI) ===
export type AgentRole = 'Intake' | 'Planner' | 'Comms' | 'Summarizer';

export interface Agent {
  id: string;
  tenantId: string;
  name: string;
  role: AgentRole;
  tools: string[];
  createdAt: string;
  runs?: AgentRun[];
}

export interface AgentRun {
  id: string;
  agentId: string;
  tenantId: string;
  toolCalls: number;
  input: any;
  output?: any;
  costCents: number;
  createdAt: string;
  agent?: Agent;
}

export interface RunAgentDto {
  agentId: string;
  input: any;
}

// === Calendar ===
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  projectId?: string;
  taskId?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  task?: Task;
}

export interface CreateCalendarEventDto {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  allDay?: boolean;
  projectId?: string;
  taskId?: string;
}

export interface UpdateCalendarEventDto {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  allDay?: boolean;
  projectId?: string;
  taskId?: string;
}

// === Common ===
export interface User {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  user?: User;
}

export interface Comment {
  id: string;
  content: string;
  noteId?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  storageUrl: string;
  noteId?: string;
  tenantId: string;
  createdAt: string;
}

export interface DashboardStats {
  projects: {
    total: number;
    active: number;
    completed: number;
    onHold: number;
  };
  tasks: {
    total: number;
    todo: number;
    inProgress: number;
    review: number;
    done: number;
    overdue: number;
  };
  team: {
    totalMembers: number;
    activeToday: number;
  };
  activity: {
    recentTasks: Task[];
    recentProjects: Project[];
  };
}

// === API Response Wrapper ===
export interface ApiResponse<T> {
  data: T;
  traceId?: string;
  meta?: {
    cursor?: string;
    hasMore?: boolean;
    total?: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    cursor?: string;
    hasMore: boolean;
    total?: number;
  };
}

// === CRM ===
export interface CrmClient {
  id: string;
  tenantId: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  status: 'lead' | 'prospect' | 'client' | 'inactive';
  value: number;
  lastContact?: string;
  industry?: string;
  source?: string;
  assignedTo?: string;
  tags: string[];
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmProject {
  id: string;
  tenantId: string;
  clientId?: string;
  name: string;
  description?: string;
  status: 'in-progress' | 'planning' | 'review' | 'completed' | 'on-hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  budget: number;
  spent: number;
  startDate?: string;
  endDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  client?: Pick<CrmClient, 'id' | 'name' | 'company'>;
}

export interface CrmDeal {
  id: string;
  tenantId: string;
  title: string;
  clientId: string;
  value: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  expectedCloseDate?: string;
  source?: string;
  assignedTo?: string;
  lastActivity?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  client?: Pick<CrmClient, 'id' | 'name' | 'company'>;
}

export interface CrmSummary {
  totalClients: number;
  totalCrmProjects: number;
  totalDeals: number;
  totalRevenue: number;
  activeProjects: number;
}

