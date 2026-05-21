import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectPermissionsService } from '../common/project-permissions.service';
import {
  CreateInvoiceWizardDto,
  UpdateInvoiceDto,
  InvoiceQueryDto,
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseQueryDto,
  CreateBillableRateDto,
  UpdateBillableRateDto,
  CreateBudgetDto,
  UpdateBudgetDto,
  RecordPaymentDto,
  DateRangePreset,
  InvoiceGroupingStrategy,
  InvoiceStatus,
  ExpenseStatus,
  InvoiceLineItem,
  GenerateReportDto,
  FinanceDashboardQueryDto,
} from './dto';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: ProjectPermissionsService,
  ) {}

  // ===========================
  // INVOICE METHODS
  // ===========================

  /**
   * Generate invoice using wizard data
   * This is the main invoice generation algorithm
   */
  async generateInvoice(tenantId: string, userId: string, dto: CreateInvoiceWizardDto) {
    // Check project access
    await this.permissions.ensureCanWriteProject(tenantId, userId, dto.projectId);

    // Calculate date range
    const { periodStart, periodEnd } = this.calculateDateRange(dto.dateRangePreset, dto.periodStart, dto.periodEnd);

    // Step A: Fetch billable items
    const billableItems = await this.fetchBillableItems(
      tenantId,
      dto.projectId,
      periodStart,
      periodEnd,
      dto.includeTimesheets,
      dto.includeExpenses,
      dto.includeFixedTasks,
    );

    // Step B: Calculate line items based on grouping strategy
    const lineItems = await this.calculateLineItems(
      tenantId,
      dto.projectId,
      billableItems,
      dto.groupingStrategy,
    );

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const taxPercent = dto.taxPercent || 0;
    const discountPercent = dto.discountPercent || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxPercent / 100);
    const grandTotal = taxableAmount + taxAmount;

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);

    // Calculate due date
    let dueDate: Date;
    if (dto.dueDate) {
      dueDate = new Date(dto.dueDate);
    } else if (dto.clientId) {
      // Get client's payment terms
      const client = await this.prisma.tx.crmClient.findUnique({
        where: { id: dto.clientId },
        select: { paymentTermsDays: true },
      });
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (client?.paymentTermsDays || 30));
    } else {
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
    }

    // Create invoice
    const invoice = await this.prisma.tx.invoice.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        clientId: dto.clientId || null,
        invoiceNumber,
        status: 'DRAFT',
        groupingStrategy: dto.groupingStrategy,
        periodStart,
        periodEnd,
        dueDate,
        currency: dto.currency || 'USD',
        subtotal,
        taxPercent,
        taxAmount,
        discountPercent,
        discountAmount,
        grandTotal,
        balanceDue: grandTotal,
        includeTimesheets: dto.includeTimesheets,
        includeExpenses: dto.includeExpenses,
        includeFixedTasks: dto.includeFixedTasks,
        showDetailedBreakdown: dto.showDetailedBreakdown || false,
        lineItems: lineItems as any,
        terms: dto.terms,
        notes: dto.notes,
        clientNotes: dto.clientNotes,
        createdById: userId,
      },
      include: {
        project: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, company: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    this.logger.log(`Invoice ${invoiceNumber} created for project ${dto.projectId}`);

    return invoice;
  }

  /**
   * List invoices with filtering
   */
  async listInvoices(tenantId: string, userId: string, query: InvoiceQueryDto) {
    const where: any = { tenantId };

    if (query.projectId) {
      await this.permissions.ensureCanReadProject(tenantId, userId, query.projectId);
      where.projectId = query.projectId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.clientId) {
      where.clientId = query.clientId;
    }

    if (query.from || query.to) {
      where.issueDate = {};
      if (query.from) where.issueDate.gte = new Date(query.from);
      if (query.to) where.issueDate.lte = new Date(query.to);
    }

    const invoices = await this.prisma.tx.invoice.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, company: true } },
        creator: { select: { id: true, name: true } },
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit || 50,
      skip: query.cursor ? 1 : 0,
      cursor: query.cursor ? { id: query.cursor } : undefined,
    });

    return invoices;
  }

  /**
   * Get single invoice with full details
   */
  async getInvoice(tenantId: string, userId: string, invoiceId: string) {
    const invoice = await this.prisma.tx.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: {
        project: { select: { id: true, name: true } },
        client: true,
        creator: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
        timesheets: {
          include: {
            user: { select: { id: true, name: true } },
            task: { select: { id: true, title: true } },
          },
        },
        expenses: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    await this.permissions.ensureCanReadProject(tenantId, userId, invoice.projectId);

    return invoice;
  }

  /**
   * Update invoice
   */
  async updateInvoice(tenantId: string, userId: string, invoiceId: string, dto: UpdateInvoiceDto) {
    const invoice = await this.prisma.tx.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    await this.permissions.ensureCanWriteProject(tenantId, userId, invoice.projectId);

    // Cannot edit sent/paid invoices (except to void)
    if (['SENT', 'PAID', 'PARTIALLY_PAID'].includes(invoice.status) && dto.status !== InvoiceStatus.VOID) {
      throw new BadRequestException('Cannot edit sent or paid invoices. Void it first to make changes.');
    }

    const updateData: any = {};

    // Handle status changes
    if (dto.status) {
      updateData.status = dto.status;

      if (dto.status === InvoiceStatus.SENT && invoice.status !== 'SENT') {
        updateData.sentAt = new Date();
        // Lock the timesheets
        await this.lockInvoiceItems(invoiceId);
      }

      if (dto.status === InvoiceStatus.VOID) {
        updateData.voidedAt = new Date();
        updateData.voidReason = dto.voidReason || 'Voided by user';
        // Unlock the timesheets
        await this.unlockInvoiceItems(invoiceId);
      }

      if (dto.status === InvoiceStatus.APPROVED && invoice.status !== 'APPROVED') {
        updateData.approvedById = userId;
        updateData.approvedAt = new Date();
      }
    }

    // Update other fields
    if (dto.clientId !== undefined) updateData.clientId = dto.clientId;
    if (dto.dueDate) updateData.dueDate = new Date(dto.dueDate);
    if (dto.taxPercent !== undefined) {
      updateData.taxPercent = dto.taxPercent;
      // Recalculate amounts
      const subtotal = invoice.subtotal;
      const discountAmount = subtotal * (invoice.discountPercent / 100);
      const taxableAmount = subtotal - discountAmount;
      updateData.taxAmount = taxableAmount * (dto.taxPercent / 100);
      updateData.grandTotal = taxableAmount + updateData.taxAmount;
      updateData.balanceDue = updateData.grandTotal - invoice.amountPaid;
    }
    if (dto.discountPercent !== undefined) {
      updateData.discountPercent = dto.discountPercent;
      // Recalculate amounts
      const subtotal = invoice.subtotal;
      updateData.discountAmount = subtotal * (dto.discountPercent / 100);
      const taxableAmount = subtotal - updateData.discountAmount;
      updateData.taxAmount = taxableAmount * (invoice.taxPercent / 100);
      updateData.grandTotal = taxableAmount + updateData.taxAmount;
      updateData.balanceDue = updateData.grandTotal - invoice.amountPaid;
    }
    if (dto.terms !== undefined) updateData.terms = dto.terms;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.clientNotes !== undefined) updateData.clientNotes = dto.clientNotes;

    const updated = await this.prisma.tx.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, company: true } },
      },
    });

    return updated;
  }

  /**
   * Delete invoice (only drafts)
   */
  async deleteInvoice(tenantId: string, userId: string, invoiceId: string) {
    const invoice = await this.prisma.tx.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    await this.permissions.ensureCanWriteProject(tenantId, userId, invoice.projectId);

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Only draft invoices can be deleted');
    }

    await this.prisma.tx.invoice.delete({
      where: { id: invoiceId },
    });

    return { ok: true };
  }

  /**
   * Record payment for invoice
   */
  async recordPayment(tenantId: string, userId: string, invoiceId: string, dto: RecordPaymentDto) {
    const invoice = await this.prisma.tx.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    await this.permissions.ensureCanWriteProject(tenantId, userId, invoice.projectId);

    if (['DRAFT', 'VOID'].includes(invoice.status)) {
      throw new BadRequestException('Cannot record payment for draft or void invoices');
    }

    const payment = await this.prisma.tx.payment.create({
      data: {
        tenantId,
        invoiceId,
        amount: dto.amount,
        paymentDate: new Date(dto.paymentDate),
        paymentMethod: dto.paymentMethod,
        referenceNumber: dto.referenceNumber,
        notes: dto.notes,
      },
    });

    // Update invoice amounts
    const newAmountPaid = invoice.amountPaid + dto.amount;
    const newBalanceDue = invoice.grandTotal - newAmountPaid;
    const newStatus = newBalanceDue <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    await this.prisma.tx.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        balanceDue: Math.max(0, newBalanceDue),
        status: newStatus,
        paidAt: newBalanceDue <= 0 ? new Date() : null,
      },
    });

    return payment;
  }

  // ===========================
  // EXPENSE METHODS
  // ===========================

  /**
   * Create expense
   */
  async createExpense(tenantId: string, userId: string, dto: CreateExpenseDto) {
    await this.permissions.ensureCanWriteProject(tenantId, userId, dto.projectId);

    const expense = await this.prisma.tx.expense.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        userId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        amount: dto.amount,
        currency: dto.currency || 'USD',
        date: new Date(dto.date),
        vendor: dto.vendor,
        billable: dto.billable ?? true,
        billableToClient: dto.billableToClient ?? true,
        markup: dto.markup || 0,
        taxDeductible: dto.taxDeductible || false,
        taxCategory: dto.taxCategory,
        tags: dto.tags || [],
        receiptUrl: dto.receiptUrl,
        status: 'DRAFT',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    // Update project spent amount
    await this.updateProjectSpent(dto.projectId);

    return expense;
  }

  /**
   * List expenses
   */
  async listExpenses(tenantId: string, userId: string, query: ExpenseQueryDto) {
    const where: any = { tenantId };

    if (query.projectId) {
      await this.permissions.ensureCanReadProject(tenantId, userId, query.projectId);
      where.projectId = query.projectId;
    }

    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    if (query.billable !== undefined) where.billable = query.billable;

    if (query.from || query.to) {
      where.date = {};
      if (query.from) where.date.gte = new Date(query.from);
      if (query.to) where.date.lte = new Date(query.to);
    }

    const expenses = await this.prisma.tx.expense.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
      take: query.limit || 50,
    });

    return expenses;
  }

  /**
   * Get single expense
   */
  async getExpense(tenantId: string, userId: string, expenseId: string) {
    const expense = await this.prisma.tx.expense.findFirst({
      where: { id: expenseId, tenantId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    await this.permissions.ensureCanReadProject(tenantId, userId, expense.projectId);

    return expense;
  }

  /**
   * Update expense
   */
  async updateExpense(tenantId: string, userId: string, expenseId: string, dto: UpdateExpenseDto) {
    const expense = await this.prisma.tx.expense.findFirst({
      where: { id: expenseId, tenantId },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    await this.permissions.ensureCanWriteProject(tenantId, userId, expense.projectId);

    // Cannot edit invoiced expenses
    if (expense.invoiceId) {
      throw new BadRequestException('Cannot edit expense that has been invoiced');
    }

    const updateData: any = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.amount !== undefined) updateData.amount = dto.amount;
    if (dto.date !== undefined) updateData.date = new Date(dto.date);
    if (dto.vendor !== undefined) updateData.vendor = dto.vendor;
    if (dto.billable !== undefined) updateData.billable = dto.billable;
    if (dto.billableToClient !== undefined) updateData.billableToClient = dto.billableToClient;
    if (dto.markup !== undefined) updateData.markup = dto.markup;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.receiptUrl !== undefined) updateData.receiptUrl = dto.receiptUrl;

    // Handle approval
    if (dto.status === ExpenseStatus.APPROVED) {
      updateData.status = dto.status;
      updateData.approvedById = userId;
      updateData.approvedAt = new Date();
    } else if (dto.status === ExpenseStatus.REJECTED) {
      updateData.status = dto.status;
      updateData.rejectionReason = dto.rejectionReason;
    } else if (dto.status) {
      updateData.status = dto.status;
    }

    const updated = await this.prisma.tx.expense.update({
      where: { id: expenseId },
      data: updateData,
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });

    // Update project spent if amount changed
    if (dto.amount !== undefined) {
      await this.updateProjectSpent(expense.projectId);
    }

    return updated;
  }

  /**
   * Delete expense
   */
  async deleteExpense(tenantId: string, userId: string, expenseId: string) {
    const expense = await this.prisma.tx.expense.findFirst({
      where: { id: expenseId, tenantId },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    await this.permissions.ensureCanWriteProject(tenantId, userId, expense.projectId);

    if (expense.invoiceId) {
      throw new BadRequestException('Cannot delete expense that has been invoiced');
    }

    await this.prisma.tx.expense.delete({
      where: { id: expenseId },
    });

    await this.updateProjectSpent(expense.projectId);

    return { ok: true };
  }

  // ===========================
  // BILLABLE RATE METHODS
  // ===========================

  /**
   * Create billable rate
   */
  async createBillableRate(tenantId: string, userId: string, dto: CreateBillableRateDto) {
    if (dto.projectId) {
      await this.permissions.ensureCanWriteProject(tenantId, userId, dto.projectId);
    }

    const rate = await this.prisma.tx.billableRate.create({
      data: {
        tenantId,
        projectId: dto.projectId || null,
        userId: dto.userId || null,
        role: dto.role || null,
        hourlyRate: dto.hourlyRate,
        currency: dto.currency || 'USD',
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
        description: dto.description,
        isActive: true,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return rate;
  }

  /**
   * List billable rates
   */
  async listBillableRates(tenantId: string, userId: string, projectId?: string) {
    const where: any = { tenantId };

    if (projectId) {
      await this.permissions.ensureCanReadProject(tenantId, userId, projectId);
      where.projectId = projectId;
    }

    const rates = await this.prisma.tx.billableRate.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: [{ isActive: 'desc' }, { effectiveFrom: 'desc' }],
    });

    return rates;
  }

  /**
   * Update billable rate
   */
  async updateBillableRate(tenantId: string, userId: string, rateId: string, dto: UpdateBillableRateDto) {
    const rate = await this.prisma.tx.billableRate.findFirst({
      where: { id: rateId, tenantId },
    });

    if (!rate) {
      throw new NotFoundException('Billable rate not found');
    }

    if (rate.projectId) {
      await this.permissions.ensureCanWriteProject(tenantId, userId, rate.projectId);
    }

    const updateData: any = {};
    if (dto.hourlyRate !== undefined) updateData.hourlyRate = dto.hourlyRate;
    if (dto.effectiveFrom) updateData.effectiveFrom = new Date(dto.effectiveFrom);
    if (dto.effectiveTo) updateData.effectiveTo = new Date(dto.effectiveTo);
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const updated = await this.prisma.tx.billableRate.update({
      where: { id: rateId },
      data: updateData,
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return updated;
  }

  /**
   * Delete billable rate
   */
  async deleteBillableRate(tenantId: string, userId: string, rateId: string) {
    const rate = await this.prisma.tx.billableRate.findFirst({
      where: { id: rateId, tenantId },
    });

    if (!rate) {
      throw new NotFoundException('Billable rate not found');
    }

    if (rate.projectId) {
      await this.permissions.ensureCanWriteProject(tenantId, userId, rate.projectId);
    }

    await this.prisma.tx.billableRate.delete({
      where: { id: rateId },
    });

    return { ok: true };
  }

  // ===========================
  // BUDGET METHODS
  // ===========================

  /**
   * Create budget
   */
  async createBudget(tenantId: string, userId: string, dto: CreateBudgetDto) {
    await this.permissions.ensureCanWriteProject(tenantId, userId, dto.projectId);

    const budget = await this.prisma.tx.budget.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        name: dto.name,
        totalAmount: dto.totalAmount,
        currency: dto.currency || 'USD',
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        alertThreshold: dto.alertThreshold || 80,
        categories: dto.categories || [],
        isActive: true,
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    return budget;
  }

  /**
   * List budgets
   */
  async listBudgets(tenantId: string, userId: string, projectId?: string) {
    const where: any = { tenantId };

    if (projectId) {
      await this.permissions.ensureCanReadProject(tenantId, userId, projectId);
      where.projectId = projectId;
    }

    const budgets = await this.prisma.tx.budget.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { alerts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return budgets;
  }

  /**
   * Get budget with details
   */
  async getBudget(tenantId: string, userId: string, budgetId: string) {
    const budget = await this.prisma.tx.budget.findFirst({
      where: { id: budgetId, tenantId },
      include: {
        project: { select: { id: true, name: true } },
        alerts: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    await this.permissions.ensureCanReadProject(tenantId, userId, budget.projectId);

    return budget;
  }

  /**
   * Update budget
   */
  async updateBudget(tenantId: string, userId: string, budgetId: string, dto: UpdateBudgetDto) {
    const budget = await this.prisma.tx.budget.findFirst({
      where: { id: budgetId, tenantId },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    await this.permissions.ensureCanWriteProject(tenantId, userId, budget.projectId);

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.totalAmount !== undefined) updateData.totalAmount = dto.totalAmount;
    if (dto.startDate) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) updateData.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.alertThreshold !== undefined) updateData.alertThreshold = dto.alertThreshold;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.categories !== undefined) updateData.categories = dto.categories;

    const updated = await this.prisma.tx.budget.update({
      where: { id: budgetId },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    return updated;
  }

  /**
   * Delete budget
   */
  async deleteBudget(tenantId: string, userId: string, budgetId: string) {
    const budget = await this.prisma.tx.budget.findFirst({
      where: { id: budgetId, tenantId },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    await this.permissions.ensureCanWriteProject(tenantId, userId, budget.projectId);

    await this.prisma.tx.budget.delete({
      where: { id: budgetId },
    });

    return { ok: true };
  }

  // ===========================
  // DASHBOARD & ANALYTICS
  // ===========================

  /**
   * Get finance dashboard data
   */
  async getDashboard(tenantId: string, userId: string, query: FinanceDashboardQueryDto) {
    const where: any = { tenantId };

    if (query.projectId) {
      await this.permissions.ensureCanReadProject(tenantId, userId, query.projectId);
      where.projectId = query.projectId;
    }

    const dateRange: any = {};
    if (query.from) dateRange.gte = new Date(query.from);
    if (query.to) dateRange.lte = new Date(query.to);

    // Fetch all metrics in parallel
    const [
      invoiceStats,
      expenseStats,
      recentInvoices,
      recentExpenses,
      overdueInvoices,
      pendingExpenses,
      revenueByMonth,
      expensesByCategory,
    ] = await Promise.all([
      // Invoice statistics
      this.prisma.tx.invoice.aggregate({
        where,
        _sum: { grandTotal: true, amountPaid: true, balanceDue: true },
        _count: true,
      }),

      // Expense statistics
      this.prisma.tx.expense.aggregate({
        where: { ...where, ...(Object.keys(dateRange).length ? { date: dateRange } : {}) },
        _sum: { amount: true },
        _count: true,
      }),

      // Recent invoices
      this.prisma.tx.invoice.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
          client: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Recent expenses
      this.prisma.tx.expense.findMany({
        where: { ...where, ...(Object.keys(dateRange).length ? { date: dateRange } : {}) },
        include: {
          user: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
        take: 5,
      }),

      // Overdue invoices
      this.prisma.tx.invoice.findMany({
        where: {
          ...where,
          status: { in: ['SENT', 'PARTIALLY_PAID'] },
          dueDate: { lt: new Date() },
        },
        include: {
          client: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),

      // Pending expense approvals
      this.prisma.tx.expense.findMany({
        where: { ...where, status: 'PENDING_APPROVAL' },
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 10,
      }),

      // Revenue by month (last 12 months)
      this.getRevenueByMonth(tenantId, query.projectId),

      // Expenses by category
      this.getExpensesByCategory(tenantId, query.projectId, query.from, query.to),
    ]);

    return {
      invoices: {
        total: invoiceStats._count,
        totalRevenue: invoiceStats._sum.grandTotal || 0,
        totalPaid: invoiceStats._sum.amountPaid || 0,
        totalOutstanding: invoiceStats._sum.balanceDue || 0,
      },
      expenses: {
        total: expenseStats._count,
        totalAmount: expenseStats._sum.amount || 0,
      },
      recentInvoices,
      recentExpenses,
      overdueInvoices,
      pendingExpenses,
      charts: {
        revenueByMonth,
        expensesByCategory,
      },
    };
  }

  // ===========================
  // CLIENT & TEAM METHODS
  // ===========================

  /**
   * List CRM clients for invoice assignment
   */
  async listClients(tenantId: string) {
    const clients = await this.prisma.tx.crmClient.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        company: true,
        email: true,
        billingAddress: true,
        billingCity: true,
        billingState: true,
        billingZip: true,
        billingCountry: true,
        taxId: true,
        paymentTermsDays: true,
      },
      orderBy: { name: 'asc' },
    });
    return clients;
  }

  /**
   * List team members for rate assignment
   */
  async listTeamMembers(tenantId: string, projectId?: string) {
    if (projectId) {
      // Get project members
      const members = await this.prisma.tx.projectMember.findMany({
        where: { projectId },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });
      return members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role || m.user.role,
      }));
    } else {
      // Get all tenant users
      const users = await this.prisma.tx.user.findMany({
        where: { tenantId },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: 'asc' },
      });
      return users;
    }
  }

  // ===========================
  // REPORT METHODS
  // ===========================

  /**
   * Generate financial report
   */
  async generateReport(tenantId: string, userId: string, dto: GenerateReportDto) {
    if (dto.projectId) {
      await this.permissions.ensureCanReadProject(tenantId, userId, dto.projectId);
    }

    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);

    let data: any = {};

    switch (dto.reportType) {
      case 'profit_loss':
        data = await this.generateProfitLossReport(tenantId, dto.projectId, periodStart, periodEnd);
        break;
      case 'expense_summary':
        data = await this.generateExpenseSummaryReport(tenantId, dto.projectId, periodStart, periodEnd);
        break;
      case 'time_analysis':
        data = await this.generateTimeAnalysisReport(tenantId, dto.projectId, periodStart, periodEnd);
        break;
      default:
        throw new BadRequestException(`Unknown report type: ${dto.reportType}`);
    }

    const report = await this.prisma.tx.financialReport.create({
      data: {
        tenantId,
        projectId: dto.projectId || null,
        reportType: dto.reportType,
        title: dto.title || `${dto.reportType} Report`,
        periodStart,
        periodEnd,
        data,
        createdById: userId,
      },
    });

    return report;
  }

  // ===========================
  // HELPER METHODS
  // ===========================

  private calculateDateRange(preset: DateRangePreset, customStart?: string, customEnd?: string): { periodStart: Date; periodEnd: Date } {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    switch (preset) {
      case DateRangePreset.THIS_WEEK:
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - now.getDay());
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + 6);
        periodEnd.setHours(23, 59, 59, 999);
        break;

      case DateRangePreset.LAST_WEEK:
        periodEnd = new Date(now);
        periodEnd.setDate(now.getDate() - now.getDay() - 1);
        periodEnd.setHours(23, 59, 59, 999);
        periodStart = new Date(periodEnd);
        periodStart.setDate(periodEnd.getDate() - 6);
        periodStart.setHours(0, 0, 0, 0);
        break;

      case DateRangePreset.THIS_MONTH:
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;

      case DateRangePreset.LAST_MONTH:
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;

      case DateRangePreset.THIS_QUARTER:
        const thisQuarter = Math.floor(now.getMonth() / 3);
        periodStart = new Date(now.getFullYear(), thisQuarter * 3, 1);
        periodEnd = new Date(now.getFullYear(), (thisQuarter + 1) * 3, 0, 23, 59, 59, 999);
        break;

      case DateRangePreset.LAST_QUARTER:
        const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
        const year = lastQuarter < 0 ? now.getFullYear() - 1 : now.getFullYear();
        const quarter = lastQuarter < 0 ? 3 : lastQuarter;
        periodStart = new Date(year, quarter * 3, 1);
        periodEnd = new Date(year, (quarter + 1) * 3, 0, 23, 59, 59, 999);
        break;

      case DateRangePreset.THIS_YEAR:
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;

      case DateRangePreset.LAST_YEAR:
        periodStart = new Date(now.getFullYear() - 1, 0, 1);
        periodEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        break;

      case DateRangePreset.CUSTOM:
        if (!customStart || !customEnd) {
          throw new BadRequestException('Custom date range requires periodStart and periodEnd');
        }
        periodStart = new Date(customStart);
        periodEnd = new Date(customEnd);
        break;

      default:
        throw new BadRequestException('Invalid date range preset');
    }

    return { periodStart, periodEnd };
  }

  private async fetchBillableItems(
    tenantId: string,
    projectId: string,
    periodStart: Date,
    periodEnd: Date,
    includeTimesheets: boolean,
    includeExpenses: boolean,
    includeFixedTasks: boolean,
  ) {
    const results: {
      timesheets: any[];
      expenses: any[];
      fixedTasks: any[];
    } = {
      timesheets: [],
      expenses: [],
      fixedTasks: [],
    };

    if (includeTimesheets) {
      results.timesheets = await this.prisma.tx.timesheet.findMany({
        where: {
          tenantId,
          projectId,
          billable: true,
          invoiceId: null, // Not yet billed
          date: { gte: periodStart, lte: periodEnd },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          task: { select: { id: true, title: true } },
        },
        orderBy: { date: 'asc' },
      });
    }

    if (includeExpenses) {
      results.expenses = await this.prisma.tx.expense.findMany({
        where: {
          tenantId,
          projectId,
          billableToClient: true,
          invoiceId: null, // Not yet billed
          status: 'APPROVED',
          date: { gte: periodStart, lte: periodEnd },
        },
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { date: 'asc' },
      });
    }

    if (includeFixedTasks) {
      // TODO: Implement fixed price tasks when that feature exists
      results.fixedTasks = [];
    }

    return results;
  }

  private async calculateLineItems(
    tenantId: string,
    projectId: string,
    billableItems: { timesheets: any[]; expenses: any[]; fixedTasks: any[] },
    groupingStrategy: InvoiceGroupingStrategy,
  ): Promise<InvoiceLineItem[]> {
    const lineItems: InvoiceLineItem[] = [];

    // Get billable rates
    const rates = await this.prisma.tx.billableRate.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [{ projectId }, { projectId: null }],
      },
      orderBy: [{ projectId: 'desc' }, { userId: 'desc' }, { role: 'desc' }],
    });

    // Calculate rate for a user
    const getRate = (userId: string, role?: string): number => {
      // Priority: Project-specific user rate > Global user rate > Project role rate > Global role rate > Default
      const userProjectRate = rates.find(r => r.projectId === projectId && r.userId === userId);
      if (userProjectRate) return userProjectRate.hourlyRate;

      const userGlobalRate = rates.find(r => !r.projectId && r.userId === userId);
      if (userGlobalRate) return userGlobalRate.hourlyRate;

      if (role) {
        const roleProjectRate = rates.find(r => r.projectId === projectId && r.role === role);
        if (roleProjectRate) return roleProjectRate.hourlyRate;

        const roleGlobalRate = rates.find(r => !r.projectId && r.role === role);
        if (roleGlobalRate) return roleGlobalRate.hourlyRate;
      }

      // Default rate
      return 100;
    };

    // Process timesheets based on grouping strategy
    switch (groupingStrategy) {
      case InvoiceGroupingStrategy.DETAILED:
        // Each timesheet as a line item
        for (const ts of billableItems.timesheets) {
          const rate = ts.billableRate || getRate(ts.userId);
          lineItems.push({
            id: `ts-${ts.id}`,
            description: `${ts.date.toLocaleDateString()} - ${ts.task?.title || 'General work'} - ${ts.user.name}`,
            quantity: ts.hours,
            unit: 'hours',
            rate,
            total: ts.hours * rate,
            linkedTimesheetIds: [ts.id],
            metadata: { userId: ts.userId, taskId: ts.taskId },
          });
        }
        break;

      case InvoiceGroupingStrategy.BY_USER:
        // Group by user
        const byUser = new Map<string, { user: any; hours: number; ids: string[] }>();
        for (const ts of billableItems.timesheets) {
          const key = ts.userId;
          if (!byUser.has(key)) {
            byUser.set(key, { user: ts.user, hours: 0, ids: [] });
          }
          const entry = byUser.get(key)!;
          entry.hours += ts.hours;
          entry.ids.push(ts.id);
        }
        for (const [userId, entry] of byUser) {
          const rate = getRate(userId);
          lineItems.push({
            id: `user-${userId}`,
            description: `Services - ${entry.user.name}`,
            quantity: entry.hours,
            unit: 'hours',
            rate,
            total: entry.hours * rate,
            linkedTimesheetIds: entry.ids,
          });
        }
        break;

      case InvoiceGroupingStrategy.BY_ROLE:
        // Group by role (we'll use a simple approach - group by rate tier)
        const byRole = new Map<number, { description: string; hours: number; ids: string[] }>();
        for (const ts of billableItems.timesheets) {
          const rate = ts.billableRate || getRate(ts.userId);
          if (!byRole.has(rate)) {
            byRole.set(rate, { description: rate >= 150 ? 'Senior Services' : rate >= 100 ? 'Standard Services' : 'Junior Services', hours: 0, ids: [] });
          }
          const entry = byRole.get(rate)!;
          entry.hours += ts.hours;
          entry.ids.push(ts.id);
        }
        for (const [rate, entry] of byRole) {
          lineItems.push({
            id: `role-${rate}`,
            description: entry.description,
            quantity: entry.hours,
            unit: 'hours',
            rate,
            total: entry.hours * rate,
            linkedTimesheetIds: entry.ids,
          });
        }
        break;

      case InvoiceGroupingStrategy.BY_TASK:
        // Group by task
        const byTask = new Map<string, { task: any; hours: number; ids: string[]; totalCost: number }>();
        for (const ts of billableItems.timesheets) {
          const key = ts.taskId || 'general';
          if (!byTask.has(key)) {
            byTask.set(key, { task: ts.task, hours: 0, ids: [], totalCost: 0 });
          }
          const entry = byTask.get(key)!;
          const rate = ts.billableRate || getRate(ts.userId);
          entry.hours += ts.hours;
          entry.totalCost += ts.hours * rate;
          entry.ids.push(ts.id);
        }
        for (const [taskId, entry] of byTask) {
          const avgRate = entry.totalCost / entry.hours;
          lineItems.push({
            id: `task-${taskId}`,
            description: entry.task?.title || 'General Work',
            quantity: entry.hours,
            unit: 'hours',
            rate: avgRate,
            total: entry.totalCost,
            linkedTimesheetIds: entry.ids,
            linkedTaskIds: taskId !== 'general' ? [taskId] : undefined,
          });
        }
        break;

      case InvoiceGroupingStrategy.BY_DATE:
        // Group by week
        const byWeek = new Map<string, { weekStart: Date; hours: number; ids: string[]; totalCost: number }>();
        for (const ts of billableItems.timesheets) {
          const weekStart = new Date(ts.date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const key = weekStart.toISOString().split('T')[0];
          if (!byWeek.has(key)) {
            byWeek.set(key, { weekStart, hours: 0, ids: [], totalCost: 0 });
          }
          const entry = byWeek.get(key)!;
          const rate = ts.billableRate || getRate(ts.userId);
          entry.hours += ts.hours;
          entry.totalCost += ts.hours * rate;
          entry.ids.push(ts.id);
        }
        for (const [weekKey, entry] of byWeek) {
          const weekEnd = new Date(entry.weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          const avgRate = entry.totalCost / entry.hours;
          lineItems.push({
            id: `week-${weekKey}`,
            description: `Week of ${entry.weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`,
            quantity: entry.hours,
            unit: 'hours',
            rate: avgRate,
            total: entry.totalCost,
            linkedTimesheetIds: entry.ids,
            dateRange: { start: entry.weekStart.toISOString(), end: weekEnd.toISOString() },
          });
        }
        break;

      default:
        // BY_EPIC or fallback - group all together
        const totalHours = billableItems.timesheets.reduce((sum, ts) => sum + ts.hours, 0);
        const totalCost = billableItems.timesheets.reduce((sum, ts) => {
          const rate = ts.billableRate || getRate(ts.userId);
          return sum + ts.hours * rate;
        }, 0);
        if (totalHours > 0) {
          lineItems.push({
            id: 'all-time',
            description: 'Professional Services',
            quantity: totalHours,
            unit: 'hours',
            rate: totalCost / totalHours,
            total: totalCost,
            linkedTimesheetIds: billableItems.timesheets.map(ts => ts.id),
          });
        }
    }

    // Add expenses as line items
    for (const expense of billableItems.expenses) {
      const markupAmount = expense.amount * (expense.markup / 100);
      lineItems.push({
        id: `exp-${expense.id}`,
        description: `${expense.title}${expense.vendor ? ` (${expense.vendor})` : ''}`,
        quantity: 1,
        unit: 'flat',
        rate: expense.amount + markupAmount,
        total: expense.amount + markupAmount,
        linkedExpenseIds: [expense.id],
        category: expense.category,
      });
    }

    return lineItems;
  }

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const lastInvoice = await this.prisma.tx.invoice.findFirst({
      where: {
        tenantId,
        invoiceNumber: { startsWith: `INV-${year}-` },
      },
      orderBy: { invoiceNumber: 'desc' },
    });

    let sequence = 1;
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split('-');
      sequence = parseInt(parts[2], 10) + 1;
    }

    return `INV-${year}-${sequence.toString().padStart(4, '0')}`;
  }

  private async lockInvoiceItems(invoiceId: string) {
    const now = new Date();

    // Lock timesheets
    await this.prisma.tx.timesheet.updateMany({
      where: { invoiceId },
      data: { lockedAt: now },
    });

    // Link expenses to invoice
    const invoice = await this.prisma.tx.invoice.findUnique({
      where: { id: invoiceId },
      select: { lineItems: true },
    });

    if (invoice?.lineItems) {
      const lineItems = invoice.lineItems as InvoiceLineItem[];
      const expenseIds = lineItems
        .filter(li => li.linkedExpenseIds)
        .flatMap(li => li.linkedExpenseIds || []);

      if (expenseIds.length > 0) {
        await this.prisma.tx.expense.updateMany({
          where: { id: { in: expenseIds } },
          data: { invoiceId, status: 'INVOICED' },
        });
      }

      // Link timesheets
      const timesheetIds = lineItems
        .filter(li => li.linkedTimesheetIds)
        .flatMap(li => li.linkedTimesheetIds || []);

      if (timesheetIds.length > 0) {
        await this.prisma.tx.timesheet.updateMany({
          where: { id: { in: timesheetIds } },
          data: { invoiceId, lockedAt: now },
        });
      }
    }
  }

  private async unlockInvoiceItems(invoiceId: string) {
    // Unlock timesheets
    await this.prisma.tx.timesheet.updateMany({
      where: { invoiceId },
      data: { invoiceId: null, lockedAt: null },
    });

    // Unlink expenses
    await this.prisma.tx.expense.updateMany({
      where: { invoiceId },
      data: { invoiceId: null, status: 'APPROVED' },
    });
  }

  private async updateProjectSpent(projectId: string) {
    const expenses = await this.prisma.tx.expense.aggregate({
      where: { projectId, status: { not: 'REJECTED' } },
      _sum: { amount: true },
    });

    await this.prisma.tx.project.update({
      where: { id: projectId },
      data: { spent: expenses._sum.amount || 0 },
    });
  }

  private async getRevenueByMonth(tenantId: string, projectId?: string) {
    const where: any = { tenantId, status: { in: ['PAID', 'PARTIALLY_PAID'] } };
    if (projectId) where.projectId = projectId;

    const invoices = await this.prisma.tx.invoice.findMany({
      where,
      select: { amountPaid: true, paidAt: true, issueDate: true },
    });

    const byMonth = new Map<string, number>();
    const now = new Date();

    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, 0);
    }

    for (const inv of invoices) {
      const date = inv.paidAt || inv.issueDate;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (byMonth.has(key)) {
        byMonth.set(key, byMonth.get(key)! + inv.amountPaid);
      }
    }

    return Array.from(byMonth.entries()).map(([month, amount]) => ({ month, amount }));
  }

  private async getExpensesByCategory(tenantId: string, projectId?: string, from?: string, to?: string) {
    const where: any = { tenantId, status: { not: 'REJECTED' } };
    if (projectId) where.projectId = projectId;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const expenses = await this.prisma.tx.expense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    return expenses.map(e => ({
      category: e.category,
      amount: e._sum.amount || 0,
      count: e._count,
    }));
  }

  private async generateProfitLossReport(tenantId: string, projectId: string | undefined, periodStart: Date, periodEnd: Date) {
    const where: any = { tenantId };
    if (projectId) where.projectId = projectId;

    const [revenue, expenses] = await Promise.all([
      this.prisma.tx.invoice.aggregate({
        where: {
          ...where,
          status: { in: ['PAID', 'PARTIALLY_PAID'] },
          paidAt: { gte: periodStart, lte: periodEnd },
        },
        _sum: { amountPaid: true },
      }),
      this.prisma.tx.expense.aggregate({
        where: {
          ...where,
          status: { not: 'REJECTED' },
          date: { gte: periodStart, lte: periodEnd },
        },
        _sum: { amount: true },
      }),
    ]);

    const totalRevenue = revenue._sum.amountPaid || 0;
    const totalExpenses = expenses._sum.amount || 0;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      netProfit,
      profitMargin,
    };
  }

  private async generateExpenseSummaryReport(tenantId: string, projectId: string | undefined, periodStart: Date, periodEnd: Date) {
    const where: any = { tenantId, date: { gte: periodStart, lte: periodEnd }, status: { not: 'REJECTED' } };
    if (projectId) where.projectId = projectId;

    const [byCategory, byUser, total] = await Promise.all([
      this.prisma.tx.expense.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.tx.expense.groupBy({
        by: ['userId'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.tx.expense.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      total: total._sum.amount || 0,
      count: total._count,
      byCategory,
      byUser,
    };
  }

  private async generateTimeAnalysisReport(tenantId: string, projectId: string | undefined, periodStart: Date, periodEnd: Date) {
    const where: any = { tenantId, date: { gte: periodStart, lte: periodEnd } };
    if (projectId) where.projectId = projectId;

    const [byUser, byTask, billable, total] = await Promise.all([
      this.prisma.tx.timesheet.groupBy({
        by: ['userId'],
        where,
        _sum: { hours: true },
      }),
      this.prisma.tx.timesheet.groupBy({
        by: ['taskId'],
        where,
        _sum: { hours: true },
      }),
      this.prisma.tx.timesheet.aggregate({
        where: { ...where, billable: true },
        _sum: { hours: true },
      }),
      this.prisma.tx.timesheet.aggregate({
        where,
        _sum: { hours: true },
      }),
    ]);

    const totalHours = total._sum.hours || 0;
    const billableHours = billable._sum.hours || 0;
    const utilizationRate = totalHours > 0 ? (billableHours / totalHours) * 100 : 0;

    return {
      totalHours,
      billableHours,
      nonBillableHours: totalHours - billableHours,
      utilizationRate,
      byUser,
      byTask,
    };
  }

  // ===========================
  // PDF EXPORT
  // ===========================

  /**
   * Generate PDF data for an invoice
   * Returns structured HTML/data that can be rendered to PDF on the frontend
   */
  async getInvoicePdfData(tenantId: string, userId: string, invoiceId: string) {
    const invoice = await this.getInvoice(tenantId, userId, invoiceId);

    // Get tenant info for company details
    const tenant = await this.prisma.tx.tenant.findUnique({
      where: { id: tenantId },
    });

    // Parse line items
    const lineItems = (invoice.lineItems as InvoiceLineItem[]) || [];

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: invoice.currency,
      }).format(amount);
    };

    // Build PDF data structure
    const pdfData = {
      // Header
      header: {
        companyName: tenant?.name || 'Your Company',
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
      },

      // Dates
      dates: {
        issueDate: new Date(invoice.issueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        dueDate: new Date(invoice.dueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        periodStart: new Date(invoice.periodStart).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        periodEnd: new Date(invoice.periodEnd).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      },

      // Bill To
      billTo: invoice.client ? {
        name: invoice.client.name,
        company: invoice.client.company,
        address: invoice.client.billingAddress,
        city: invoice.client.billingCity,
        state: invoice.client.billingState,
        zip: invoice.client.billingZip,
        country: invoice.client.billingCountry,
        taxId: invoice.client.taxId,
      } : null,

      // Project
      project: {
        name: invoice.project?.name,
        id: invoice.projectId,
      },

      // Line Items
      lineItems: lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit === 'hours' ? 'hrs' : item.unit === 'flat' ? '' : 'units',
        rate: formatCurrency(item.rate),
        total: formatCurrency(item.total),
      })),

      // Totals
      totals: {
        subtotal: formatCurrency(invoice.subtotal),
        discount: invoice.discountPercent > 0 ? {
          percent: invoice.discountPercent,
          amount: formatCurrency(invoice.discountAmount),
        } : null,
        tax: invoice.taxPercent > 0 ? {
          percent: invoice.taxPercent,
          amount: formatCurrency(invoice.taxAmount),
        } : null,
        grandTotal: formatCurrency(invoice.grandTotal),
        amountPaid: formatCurrency(invoice.amountPaid),
        balanceDue: formatCurrency(invoice.balanceDue),
      },

      // Payment Info
      paymentInfo: {
        terms: invoice.terms,
        clientNotes: invoice.clientNotes,
      },

      // Detailed breakdown (if enabled)
      detailedBreakdown: invoice.showDetailedBreakdown ? {
        timesheets: invoice.timesheets?.map(ts => ({
          date: new Date(ts.date).toLocaleDateString(),
          description: ts.description || ts.task?.title || 'Work',
          user: ts.user?.name,
          hours: ts.hours,
        })),
        expenses: invoice.expenses?.map(exp => ({
          date: new Date(exp.date).toLocaleDateString(),
          description: exp.title,
          user: exp.user?.name,
          amount: formatCurrency(exp.amount),
        })),
      } : null,

      // Payments
      payments: invoice.payments?.map(p => ({
        date: new Date(p.paymentDate).toLocaleDateString(),
        amount: formatCurrency(p.amount),
        method: p.paymentMethod,
        reference: p.referenceNumber,
      })),

      // Meta
      meta: {
        currency: invoice.currency,
        groupingStrategy: invoice.groupingStrategy,
        generatedAt: new Date().toISOString(),
      },
    };

    // Update last exported timestamp
    await this.prisma.tx.invoice.update({
      where: { id: invoiceId },
      data: { lastExportedAt: new Date() },
    });

    return pdfData;
  }

  /**
   * Generate simple HTML invoice for print/PDF
   */
  async getInvoiceHtml(tenantId: string, userId: string, invoiceId: string): Promise<string> {
    const data = await this.getInvoicePdfData(tenantId, userId, invoiceId);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${data.header.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #10b981; }
    .company-name { font-size: 28px; font-weight: 700; color: #10b981; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 32px; font-weight: 300; color: #374151; margin-bottom: 4px; }
    .invoice-number { font-size: 14px; color: #6b7280; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status-draft { background: #f3f4f6; color: #4b5563; }
    .status-sent { background: #ddd6fe; color: #7c3aed; }
    .status-paid { background: #d1fae5; color: #059669; }
    .status-overdue { background: #fee2e2; color: #dc2626; }
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .meta-box { flex: 1; }
    .meta-box h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 8px; }
    .meta-box p { font-size: 14px; color: #374151; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; padding: 12px 8px; border-bottom: 2px solid #e5e7eb; }
    th:last-child, td:last-child { text-align: right; }
    td { padding: 12px 8px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .totals { margin-left: auto; width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .totals-row.subtotal { border-top: 1px solid #e5e7eb; padding-top: 16px; }
    .totals-row.grand-total { border-top: 2px solid #10b981; padding-top: 16px; margin-top: 8px; font-size: 18px; font-weight: 700; color: #10b981; }
    .totals-row.balance-due { font-weight: 600; color: #dc2626; }
    .notes { margin-top: 40px; padding: 20px; background: #f9fafb; border-radius: 8px; }
    .notes h3 { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
    .notes p { font-size: 13px; color: #4b5563; }
    .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #9ca3af; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">${data.header.companyName}</div>
    <div class="invoice-title">
      <h1>INVOICE</h1>
      <div class="invoice-number">${data.header.invoiceNumber}</div>
      <div class="status status-${data.header.status.toLowerCase()}">${data.header.status}</div>
    </div>
  </div>

  <div class="meta-row">
    <div class="meta-box">
      <h3>Bill To</h3>
      ${data.billTo ? `
        <p><strong>${data.billTo.name}</strong></p>
        ${data.billTo.company ? `<p>${data.billTo.company}</p>` : ''}
        ${data.billTo.address ? `<p>${data.billTo.address}</p>` : ''}
        ${data.billTo.city || data.billTo.state || data.billTo.zip ? `<p>${[data.billTo.city, data.billTo.state, data.billTo.zip].filter(Boolean).join(', ')}</p>` : ''}
        ${data.billTo.country ? `<p>${data.billTo.country}</p>` : ''}
        ${data.billTo.taxId ? `<p>Tax ID: ${data.billTo.taxId}</p>` : ''}
      ` : '<p>No client assigned</p>'}
    </div>
    <div class="meta-box">
      <h3>Invoice Details</h3>
      <p>Issue Date: ${data.dates.issueDate}</p>
      <p>Due Date: ${data.dates.dueDate}</p>
      <p>Period: ${data.dates.periodStart} - ${data.dates.periodEnd}</p>
      ${data.project.name ? `<p>Project: ${data.project.name}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 50%">Description</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${data.lineItems.map(item => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity} ${item.unit}</td>
          <td>${item.rate}</td>
          <td>${item.total}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row subtotal">
      <span>Subtotal</span>
      <span>${data.totals.subtotal}</span>
    </div>
    ${data.totals.discount ? `
      <div class="totals-row">
        <span>Discount (${data.totals.discount.percent}%)</span>
        <span>-${data.totals.discount.amount}</span>
      </div>
    ` : ''}
    ${data.totals.tax ? `
      <div class="totals-row">
        <span>Tax (${data.totals.tax.percent}%)</span>
        <span>${data.totals.tax.amount}</span>
      </div>
    ` : ''}
    <div class="totals-row grand-total">
      <span>Total</span>
      <span>${data.totals.grandTotal}</span>
    </div>
    ${parseFloat(data.totals.amountPaid.replace(/[^0-9.-]+/g, '')) > 0 ? `
      <div class="totals-row">
        <span>Amount Paid</span>
        <span>${data.totals.amountPaid}</span>
      </div>
      <div class="totals-row balance-due">
        <span>Balance Due</span>
        <span>${data.totals.balanceDue}</span>
      </div>
    ` : ''}
  </div>

  ${data.paymentInfo.terms || data.paymentInfo.clientNotes ? `
    <div class="notes">
      ${data.paymentInfo.terms ? `
        <h3>Payment Terms</h3>
        <p>${data.paymentInfo.terms}</p>
      ` : ''}
      ${data.paymentInfo.clientNotes ? `
        <h3 style="margin-top: 16px;">Notes</h3>
        <p>${data.paymentInfo.clientNotes}</p>
      ` : ''}
    </div>
  ` : ''}

  ${data.detailedBreakdown ? `
    <div style="margin-top: 40px; page-break-before: always;">
      <h2 style="font-size: 18px; margin-bottom: 20px; color: #374151;">Detailed Breakdown</h2>
      
      ${data.detailedBreakdown.timesheets && data.detailedBreakdown.timesheets.length > 0 ? `
        <h3 style="font-size: 14px; margin: 20px 0 10px;">Time Entries</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>User</th>
              <th>Hours</th>
            </tr>
          </thead>
          <tbody>
            ${data.detailedBreakdown.timesheets.map(ts => `
              <tr>
                <td>${ts.date}</td>
                <td>${ts.description}</td>
                <td>${ts.user}</td>
                <td>${ts.hours}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      ${data.detailedBreakdown.expenses && data.detailedBreakdown.expenses.length > 0 ? `
        <h3 style="font-size: 14px; margin: 20px 0 10px;">Expenses</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>User</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${data.detailedBreakdown.expenses.map(exp => `
              <tr>
                <td>${exp.date}</td>
                <td>${exp.description}</td>
                <td>${exp.user}</td>
                <td>${exp.amount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
    </div>
  ` : ''}

  <div class="footer">
    <p>Thank you for your business!</p>
    <p style="margin-top: 8px;">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
</body>
</html>
    `;

    return html;
  }
}

