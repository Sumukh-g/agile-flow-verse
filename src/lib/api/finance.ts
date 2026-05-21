import { apiClient } from '../api-client';

// Types
export interface Invoice {
  id: string;
  tenantId: string;
  projectId: string;
  clientId?: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  groupingStrategy: InvoiceGroupingStrategy;
  periodStart: string;
  periodEnd: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discountPercent: number;
  discountAmount: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  includeTimesheets: boolean;
  includeExpenses: boolean;
  includeFixedTasks: boolean;
  showDetailedBreakdown: boolean;
  lineItems: InvoiceLineItem[];
  metadata: Record<string, any>;
  terms?: string;
  notes?: string;
  clientNotes?: string;
  pdfUrl?: string;
  lastExportedAt?: string;
  createdById: string;
  approvedById?: string;
  approvedAt?: string;
  sentAt?: string;
  viewedAt?: string;
  paidAt?: string;
  voidedAt?: string;
  voidReason?: string;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string };
  client?: { id: string; name: string; company?: string };
  creator?: { id: string; name: string; email: string };
  approver?: { id: string; name: string; email: string };
  timesheets?: any[];
  expenses?: any[];
  payments?: Payment[];
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: 'hours' | 'flat' | 'units';
  rate: number;
  total: number;
  linkedTimesheetIds?: string[];
  linkedExpenseIds?: string[];
  linkedTaskIds?: string[];
  category?: string;
  dateRange?: { start: string; end: string };
  metadata?: Record<string, any>;
}

export interface Expense {
  id: string;
  tenantId: string;
  projectId: string;
  userId: string;
  invoiceId?: string;
  title: string;
  description?: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: string;
  vendor?: string;
  status: ExpenseStatus;
  billable: boolean;
  billableToClient: boolean;
  markup: number;
  approvedById?: string;
  approvedAt?: string;
  rejectionReason?: string;
  receiptUrl?: string;
  receiptFilename?: string;
  taxDeductible: boolean;
  taxCategory?: string;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email?: string };
  project?: { id: string; name: string };
  approver?: { id: string; name: string };
  invoice?: { id: string; invoiceNumber: string };
}

export interface BillableRate {
  id: string;
  tenantId: string;
  projectId?: string;
  userId?: string;
  role?: string;
  hourlyRate: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email: string };
  project?: { id: string; name: string };
}

export interface Budget {
  id: string;
  tenantId: string;
  projectId: string;
  name: string;
  totalAmount: number;
  currency: string;
  startDate: string;
  endDate?: string;
  allocatedAmount: number;
  spentAmount: number;
  alertThreshold: number;
  isActive: boolean;
  categories: any[];
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string };
  alerts?: BudgetAlert[];
  _count?: { alerts: number };
}

export interface BudgetAlert {
  id: string;
  tenantId: string;
  budgetId: string;
  alertType: BudgetAlertType;
  threshold?: number;
  message: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod?: string;
  referenceNumber?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceDashboard {
  invoices: {
    total: number;
    totalRevenue: number;
    totalPaid: number;
    totalOutstanding: number;
  };
  expenses: {
    total: number;
    totalAmount: number;
  };
  recentInvoices: Invoice[];
  recentExpenses: Expense[];
  overdueInvoices: Invoice[];
  pendingExpenses: Expense[];
  charts: {
    revenueByMonth: { month: string; amount: number }[];
    expensesByCategory: { category: string; amount: number; count: number }[];
  };
}

export interface FinancialReport {
  id: string;
  tenantId: string;
  projectId?: string;
  reportType: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  data: any;
  exportUrl?: string;
  createdById: string;
  createdAt: string;
}

// Enums
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

export enum DateRangePreset {
  THIS_WEEK = 'THIS_WEEK',
  LAST_WEEK = 'LAST_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  LAST_MONTH = 'LAST_MONTH',
  THIS_QUARTER = 'THIS_QUARTER',
  LAST_QUARTER = 'LAST_QUARTER',
  THIS_YEAR = 'THIS_YEAR',
  LAST_YEAR = 'LAST_YEAR',
  CUSTOM = 'CUSTOM',
}

export enum BudgetAlertType {
  THRESHOLD_WARNING = 'THRESHOLD_WARNING',
  THRESHOLD_CRITICAL = 'THRESHOLD_CRITICAL',
  OVERSPEND = 'OVERSPEND',
  MONTHLY_REPORT = 'MONTHLY_REPORT',
}

// DTOs
export interface CreateInvoiceWizardDto {
  projectId: string;
  clientId?: string;
  dateRangePreset: DateRangePreset;
  periodStart?: string;
  periodEnd?: string;
  includeTimesheets: boolean;
  includeExpenses: boolean;
  includeFixedTasks: boolean;
  groupingStrategy: InvoiceGroupingStrategy;
  showDetailedBreakdown?: boolean;
  taxPercent?: number;
  discountPercent?: number;
  terms?: string;
  notes?: string;
  clientNotes?: string;
  dueDate?: string;
  currency?: string;
}

export interface UpdateInvoiceDto {
  status?: InvoiceStatus;
  clientId?: string;
  dueDate?: string;
  taxPercent?: number;
  discountPercent?: number;
  terms?: string;
  notes?: string;
  clientNotes?: string;
  voidReason?: string;
}

export interface CreateExpenseDto {
  projectId: string;
  title: string;
  description?: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  vendor?: string;
  billable?: boolean;
  billableToClient?: boolean;
  markup?: number;
  taxDeductible?: boolean;
  taxCategory?: string;
  tags?: string[];
  receiptUrl?: string;
  currency?: string;
}

export interface UpdateExpenseDto {
  title?: string;
  description?: string;
  category?: ExpenseCategory;
  amount?: number;
  date?: string;
  vendor?: string;
  status?: ExpenseStatus;
  billable?: boolean;
  billableToClient?: boolean;
  markup?: number;
  rejectionReason?: string;
  tags?: string[];
  receiptUrl?: string;
}

export interface CreateBillableRateDto {
  projectId?: string;
  userId?: string;
  role?: string;
  hourlyRate: number;
  currency?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  description?: string;
}

export interface UpdateBillableRateDto {
  hourlyRate?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateBudgetDto {
  projectId: string;
  name: string;
  totalAmount: number;
  currency?: string;
  startDate: string;
  endDate?: string;
  alertThreshold?: number;
  categories?: any[];
}

export interface UpdateBudgetDto {
  name?: string;
  totalAmount?: number;
  startDate?: string;
  endDate?: string;
  alertThreshold?: number;
  isActive?: boolean;
  categories?: any[];
}

export interface RecordPaymentDto {
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface GenerateReportDto {
  reportType: 'profit_loss' | 'expense_summary' | 'time_analysis';
  projectId?: string;
  periodStart: string;
  periodEnd: string;
  title?: string;
}

export interface InvoiceQueryDto {
  projectId?: string;
  status?: InvoiceStatus;
  clientId?: string;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
}

export interface ExpenseQueryDto {
  projectId?: string;
  status?: ExpenseStatus;
  category?: ExpenseCategory;
  billable?: boolean;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
}

export interface FinanceDashboardQueryDto {
  projectId?: string;
  from?: string;
  to?: string;
}

// API Functions
export const financeApi = {
  // Dashboard
  getDashboard: (query?: FinanceDashboardQueryDto) =>
    apiClient.get<FinanceDashboard>('/finance/dashboard', { params: query }),

  // Invoices
  generateInvoice: (dto: CreateInvoiceWizardDto) =>
    apiClient.post<Invoice>('/finance/invoices/generate', dto),

  listInvoices: (query?: InvoiceQueryDto) =>
    apiClient.get<Invoice[]>('/finance/invoices', { params: query }),

  getInvoice: (id: string) =>
    apiClient.get<Invoice>(`/finance/invoices/${id}`),

  updateInvoice: (id: string, dto: UpdateInvoiceDto) =>
    apiClient.patch<Invoice>(`/finance/invoices/${id}`, dto),

  deleteInvoice: (id: string) =>
    apiClient.delete(`/finance/invoices/${id}`),

  sendInvoice: (id: string) =>
    apiClient.post<Invoice>(`/finance/invoices/${id}/send`),

  voidInvoice: (id: string, reason?: string) =>
    apiClient.post<Invoice>(`/finance/invoices/${id}/void`, { reason }),

  approveInvoice: (id: string) =>
    apiClient.post<Invoice>(`/finance/invoices/${id}/approve`),

  recordPayment: (invoiceId: string, dto: RecordPaymentDto) =>
    apiClient.post<Payment>(`/finance/invoices/${invoiceId}/payments`, dto),

  // Expenses
  createExpense: (dto: CreateExpenseDto) =>
    apiClient.post<Expense>('/finance/expenses', dto),

  listExpenses: (query?: ExpenseQueryDto) =>
    apiClient.get<Expense[]>('/finance/expenses', { params: query }),

  getExpense: (id: string) =>
    apiClient.get<Expense>(`/finance/expenses/${id}`),

  updateExpense: (id: string, dto: UpdateExpenseDto) =>
    apiClient.patch<Expense>(`/finance/expenses/${id}`, dto),

  deleteExpense: (id: string) =>
    apiClient.delete(`/finance/expenses/${id}`),

  approveExpense: (id: string) =>
    apiClient.post<Expense>(`/finance/expenses/${id}/approve`),

  rejectExpense: (id: string, reason?: string) =>
    apiClient.post<Expense>(`/finance/expenses/${id}/reject`, { reason }),

  // Billable Rates
  createBillableRate: (dto: CreateBillableRateDto) =>
    apiClient.post<BillableRate>('/finance/rates', dto),

  listBillableRates: (projectId?: string) =>
    apiClient.get<BillableRate[]>('/finance/rates', { params: { projectId } }),

  updateBillableRate: (id: string, dto: UpdateBillableRateDto) =>
    apiClient.patch<BillableRate>(`/finance/rates/${id}`, dto),

  deleteBillableRate: (id: string) =>
    apiClient.delete(`/finance/rates/${id}`),

  // Budgets
  createBudget: (dto: CreateBudgetDto) =>
    apiClient.post<Budget>('/finance/budgets', dto),

  listBudgets: (projectId?: string) =>
    apiClient.get<Budget[]>('/finance/budgets', { params: { projectId } }),

  getBudget: (id: string) =>
    apiClient.get<Budget>(`/finance/budgets/${id}`),

  updateBudget: (id: string, dto: UpdateBudgetDto) =>
    apiClient.patch<Budget>(`/finance/budgets/${id}`, dto),

  deleteBudget: (id: string) =>
    apiClient.delete(`/finance/budgets/${id}`),

  // Reports
  generateReport: (dto: GenerateReportDto) =>
    apiClient.post<FinancialReport>('/finance/reports', dto),

  // PDF Export
  getInvoicePdfData: (id: string) =>
    apiClient.get(`/finance/invoices/${id}/pdf-data`),

  getInvoiceHtml: (id: string) =>
    apiClient.get<string>(`/finance/invoices/${id}/html`),

  // Clients (for invoice linking)
  listClients: () =>
    apiClient.get<Client[]>('/finance/clients'),

  // Team Members (for rate assignment)
  listTeamMembers: (projectId?: string) =>
    apiClient.get<TeamMember[]>('/finance/team-members', { params: { projectId } }),
};

// Client interface
export interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  billingCountry?: string;
  taxId?: string;
  paymentTermsDays?: number;
}

// Team member interface
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export default financeApi;

