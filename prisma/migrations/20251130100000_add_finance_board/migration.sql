-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID', 'DISPUTED');

-- CreateEnum
CREATE TYPE "InvoiceGroupingStrategy" AS ENUM ('DETAILED', 'BY_ROLE', 'BY_EPIC', 'BY_TASK', 'BY_USER', 'BY_DATE');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'REIMBURSED', 'INVOICED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('TRAVEL', 'SOFTWARE', 'HARDWARE', 'HOSTING', 'MARKETING', 'OFFICE_SUPPLIES', 'CONSULTING', 'SUBCONTRACTOR', 'MEALS', 'ACCOMMODATION', 'TRANSPORTATION', 'COMMUNICATION', 'TRAINING', 'LICENSE', 'OTHER');

-- CreateEnum
CREATE TYPE "BudgetAlertType" AS ENUM ('THRESHOLD_WARNING', 'THRESHOLD_CRITICAL', 'OVERSPEND', 'MONTHLY_REPORT');

-- AlterTable: Add finance columns to timesheets
ALTER TABLE "timesheets" ADD COLUMN "billable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "timesheets" ADD COLUMN "billableRate" DOUBLE PRECISION;
ALTER TABLE "timesheets" ADD COLUMN "invoiceId" TEXT;
ALTER TABLE "timesheets" ADD COLUMN "lockedAt" TIMESTAMP(3);
ALTER TABLE "timesheets" ADD COLUMN "projectId" TEXT;

-- AlterTable: Add finance settings to projects
ALTER TABLE "projects" ADD COLUMN "defaultCurrency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "projects" ADD COLUMN "billingType" TEXT NOT NULL DEFAULT 'time_materials';
ALTER TABLE "projects" ADD COLUMN "defaultBillable" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: Add billing info to crm_clients
ALTER TABLE "crm_clients" ADD COLUMN "billingAddress" TEXT;
ALTER TABLE "crm_clients" ADD COLUMN "billingCity" TEXT;
ALTER TABLE "crm_clients" ADD COLUMN "billingState" TEXT;
ALTER TABLE "crm_clients" ADD COLUMN "billingZip" TEXT;
ALTER TABLE "crm_clients" ADD COLUMN "billingCountry" TEXT;
ALTER TABLE "crm_clients" ADD COLUMN "taxId" TEXT;
ALTER TABLE "crm_clients" ADD COLUMN "paymentTermsDays" INTEGER NOT NULL DEFAULT 30;

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "clientId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "groupingStrategy" "InvoiceGroupingStrategy" NOT NULL DEFAULT 'BY_ROLE',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grandTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceDue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "includeTimesheets" BOOLEAN NOT NULL DEFAULT true,
    "includeExpenses" BOOLEAN NOT NULL DEFAULT true,
    "includeFixedTasks" BOOLEAN NOT NULL DEFAULT false,
    "showDetailedBreakdown" BOOLEAN NOT NULL DEFAULT false,
    "lineItems" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "terms" TEXT,
    "notes" TEXT,
    "clientNotes" TEXT,
    "pdfUrl" TEXT,
    "lastExportedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "ExpenseCategory" NOT NULL DEFAULT 'OTHER',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "date" TIMESTAMP(3) NOT NULL,
    "vendor" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'DRAFT',
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "billableToClient" BOOLEAN NOT NULL DEFAULT true,
    "markup" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "receiptUrl" TEXT,
    "receiptFilename" TEXT,
    "taxDeductible" BOOLEAN NOT NULL DEFAULT false,
    "taxCategory" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billable_rates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "userId" TEXT,
    "role" TEXT,
    "hourlyRate" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billable_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" TEXT,
    "referenceNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "allocatedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "alertThreshold" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "categories" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_alerts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "alertType" "BudgetAlertType" NOT NULL,
    "threshold" DOUBLE PRECISION,
    "message" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_reports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "reportType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "exportUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_invoices" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "clientId" TEXT,
    "frequency" TEXT NOT NULL,
    "nextRunDate" TIMESTAMP(3) NOT NULL,
    "lastRunDate" TIMESTAMP(3),
    "templateSettings" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoSend" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX "timesheets_projectId_idx" ON "timesheets"("projectId");
CREATE INDEX "timesheets_invoiceId_idx" ON "timesheets"("invoiceId");
CREATE INDEX "timesheets_billable_idx" ON "timesheets"("billable");
CREATE INDEX "timesheets_date_idx" ON "timesheets"("date");

CREATE UNIQUE INDEX "invoices_tenantId_invoiceNumber_key" ON "invoices"("tenantId", "invoiceNumber");
CREATE INDEX "invoices_tenantId_idx" ON "invoices"("tenantId");
CREATE INDEX "invoices_projectId_idx" ON "invoices"("projectId");
CREATE INDEX "invoices_clientId_idx" ON "invoices"("clientId");
CREATE INDEX "invoices_status_idx" ON "invoices"("status");
CREATE INDEX "invoices_issueDate_idx" ON "invoices"("issueDate");
CREATE INDEX "invoices_dueDate_idx" ON "invoices"("dueDate");

CREATE INDEX "expenses_tenantId_idx" ON "expenses"("tenantId");
CREATE INDEX "expenses_projectId_idx" ON "expenses"("projectId");
CREATE INDEX "expenses_userId_idx" ON "expenses"("userId");
CREATE INDEX "expenses_invoiceId_idx" ON "expenses"("invoiceId");
CREATE INDEX "expenses_status_idx" ON "expenses"("status");
CREATE INDEX "expenses_date_idx" ON "expenses"("date");
CREATE INDEX "expenses_billable_idx" ON "expenses"("billable");

CREATE INDEX "billable_rates_tenantId_idx" ON "billable_rates"("tenantId");
CREATE INDEX "billable_rates_projectId_idx" ON "billable_rates"("projectId");
CREATE INDEX "billable_rates_userId_idx" ON "billable_rates"("userId");
CREATE INDEX "billable_rates_role_idx" ON "billable_rates"("role");
CREATE INDEX "billable_rates_isActive_idx" ON "billable_rates"("isActive");

CREATE INDEX "payments_tenantId_idx" ON "payments"("tenantId");
CREATE INDEX "payments_invoiceId_idx" ON "payments"("invoiceId");
CREATE INDEX "payments_paymentDate_idx" ON "payments"("paymentDate");

CREATE INDEX "budgets_tenantId_idx" ON "budgets"("tenantId");
CREATE INDEX "budgets_projectId_idx" ON "budgets"("projectId");
CREATE INDEX "budgets_isActive_idx" ON "budgets"("isActive");

CREATE INDEX "budget_alerts_tenantId_idx" ON "budget_alerts"("tenantId");
CREATE INDEX "budget_alerts_budgetId_idx" ON "budget_alerts"("budgetId");
CREATE INDEX "budget_alerts_acknowledged_idx" ON "budget_alerts"("acknowledged");

CREATE INDEX "financial_reports_tenantId_idx" ON "financial_reports"("tenantId");
CREATE INDEX "financial_reports_projectId_idx" ON "financial_reports"("projectId");
CREATE INDEX "financial_reports_reportType_idx" ON "financial_reports"("reportType");

CREATE INDEX "recurring_invoices_tenantId_idx" ON "recurring_invoices"("tenantId");
CREATE INDEX "recurring_invoices_projectId_idx" ON "recurring_invoices"("projectId");
CREATE INDEX "recurring_invoices_nextRunDate_idx" ON "recurring_invoices"("nextRunDate");
CREATE INDEX "recurring_invoices_isActive_idx" ON "recurring_invoices"("isActive");

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "crm_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "expenses" ADD CONSTRAINT "expenses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "billable_rates" ADD CONSTRAINT "billable_rates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "billable_rates" ADD CONSTRAINT "billable_rates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "billable_rates" ADD CONSTRAINT "billable_rates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "budgets" ADD CONSTRAINT "budgets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "budget_alerts" ADD CONSTRAINT "budget_alerts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "budget_alerts" ADD CONSTRAINT "budget_alerts_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "recurring_invoices" ADD CONSTRAINT "recurring_invoices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recurring_invoices" ADD CONSTRAINT "recurring_invoices_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recurring_invoices" ADD CONSTRAINT "recurring_invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "crm_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "recurring_invoices" ADD CONSTRAINT "recurring_invoices_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

