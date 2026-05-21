import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceService } from './finance.service';
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
  GenerateReportDto,
  FinanceDashboardQueryDto,
} from './dto';

@ApiTags('finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/finance')
export class FinanceController {
  constructor(private readonly svc: FinanceService) {}

  // ===========================
  // DASHBOARD
  // ===========================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get finance dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved' })
  async getDashboard(@Request() req: any, @Query() query: FinanceDashboardQueryDto) {
    return this.svc.getDashboard(req.user.tenantId, req.user.userId, query);
  }

  // ===========================
  // INVOICES
  // ===========================

  @Post('invoices/generate')
  @ApiOperation({ summary: 'Generate invoice using wizard' })
  @ApiResponse({ status: 201, description: 'Invoice generated successfully' })
  async generateInvoice(@Request() req: any, @Body() dto: CreateInvoiceWizardDto) {
    return this.svc.generateInvoice(req.user.tenantId, req.user.userId, dto);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List invoices' })
  @ApiResponse({ status: 200, description: 'List of invoices' })
  async listInvoices(@Request() req: any, @Query() query: InvoiceQueryDto) {
    return this.svc.listInvoices(req.user.tenantId, req.user.userId, query);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice details' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice details' })
  async getInvoice(@Request() req: any, @Param('id') id: string) {
    return this.svc.getInvoice(req.user.tenantId, req.user.userId, id);
  }

  @Patch('invoices/:id')
  @ApiOperation({ summary: 'Update invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice updated' })
  async updateInvoice(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.svc.updateInvoice(req.user.tenantId, req.user.userId, id, dto);
  }

  @Delete('invoices/:id')
  @ApiOperation({ summary: 'Delete draft invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice deleted' })
  async deleteInvoice(@Request() req: any, @Param('id') id: string) {
    return this.svc.deleteInvoice(req.user.tenantId, req.user.userId, id);
  }

  @Post('invoices/:id/send')
  @ApiOperation({ summary: 'Mark invoice as sent (locks data)' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice marked as sent' })
  @HttpCode(HttpStatus.OK)
  async sendInvoice(@Request() req: any, @Param('id') id: string) {
    return this.svc.updateInvoice(req.user.tenantId, req.user.userId, id, { status: 'SENT' as any });
  }

  @Post('invoices/:id/void')
  @ApiOperation({ summary: 'Void invoice (unlocks data)' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice voided' })
  @HttpCode(HttpStatus.OK)
  async voidInvoice(@Request() req: any, @Param('id') id: string, @Body() body: { reason?: string }) {
    return this.svc.updateInvoice(req.user.tenantId, req.user.userId, id, {
      status: 'VOID' as any,
      voidReason: body.reason,
    });
  }

  @Post('invoices/:id/approve')
  @ApiOperation({ summary: 'Approve invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice approved' })
  @HttpCode(HttpStatus.OK)
  async approveInvoice(@Request() req: any, @Param('id') id: string) {
    return this.svc.updateInvoice(req.user.tenantId, req.user.userId, id, { status: 'APPROVED' as any });
  }

  @Post('invoices/:id/payments')
  @ApiOperation({ summary: 'Record payment for invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 201, description: 'Payment recorded' })
  async recordPayment(@Request() req: any, @Param('id') id: string, @Body() dto: RecordPaymentDto) {
    return this.svc.recordPayment(req.user.tenantId, req.user.userId, id, dto);
  }

  // ===========================
  // EXPENSES
  // ===========================

  @Post('expenses')
  @ApiOperation({ summary: 'Create expense' })
  @ApiResponse({ status: 201, description: 'Expense created' })
  async createExpense(@Request() req: any, @Body() dto: CreateExpenseDto) {
    return this.svc.createExpense(req.user.tenantId, req.user.userId, dto);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'List expenses' })
  @ApiResponse({ status: 200, description: 'List of expenses' })
  async listExpenses(@Request() req: any, @Query() query: ExpenseQueryDto) {
    return this.svc.listExpenses(req.user.tenantId, req.user.userId, query);
  }

  @Get('expenses/:id')
  @ApiOperation({ summary: 'Get expense details' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiResponse({ status: 200, description: 'Expense details' })
  async getExpense(@Request() req: any, @Param('id') id: string) {
    return this.svc.getExpense(req.user.tenantId, req.user.userId, id);
  }

  @Patch('expenses/:id')
  @ApiOperation({ summary: 'Update expense' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiResponse({ status: 200, description: 'Expense updated' })
  async updateExpense(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.svc.updateExpense(req.user.tenantId, req.user.userId, id, dto);
  }

  @Delete('expenses/:id')
  @ApiOperation({ summary: 'Delete expense' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiResponse({ status: 200, description: 'Expense deleted' })
  async deleteExpense(@Request() req: any, @Param('id') id: string) {
    return this.svc.deleteExpense(req.user.tenantId, req.user.userId, id);
  }

  @Post('expenses/:id/approve')
  @ApiOperation({ summary: 'Approve expense' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiResponse({ status: 200, description: 'Expense approved' })
  @HttpCode(HttpStatus.OK)
  async approveExpense(@Request() req: any, @Param('id') id: string) {
    return this.svc.updateExpense(req.user.tenantId, req.user.userId, id, { status: 'APPROVED' as any });
  }

  @Post('expenses/:id/reject')
  @ApiOperation({ summary: 'Reject expense' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiResponse({ status: 200, description: 'Expense rejected' })
  @HttpCode(HttpStatus.OK)
  async rejectExpense(@Request() req: any, @Param('id') id: string, @Body() body: { reason?: string }) {
    return this.svc.updateExpense(req.user.tenantId, req.user.userId, id, {
      status: 'REJECTED' as any,
      rejectionReason: body.reason,
    });
  }

  // ===========================
  // BILLABLE RATES
  // ===========================

  @Post('rates')
  @ApiOperation({ summary: 'Create billable rate' })
  @ApiResponse({ status: 201, description: 'Rate created' })
  async createBillableRate(@Request() req: any, @Body() dto: CreateBillableRateDto) {
    return this.svc.createBillableRate(req.user.tenantId, req.user.userId, dto);
  }

  @Get('rates')
  @ApiOperation({ summary: 'List billable rates' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiResponse({ status: 200, description: 'List of rates' })
  async listBillableRates(@Request() req: any, @Query('projectId') projectId?: string) {
    return this.svc.listBillableRates(req.user.tenantId, req.user.userId, projectId);
  }

  @Patch('rates/:id')
  @ApiOperation({ summary: 'Update billable rate' })
  @ApiParam({ name: 'id', description: 'Rate ID' })
  @ApiResponse({ status: 200, description: 'Rate updated' })
  async updateBillableRate(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateBillableRateDto) {
    return this.svc.updateBillableRate(req.user.tenantId, req.user.userId, id, dto);
  }

  @Delete('rates/:id')
  @ApiOperation({ summary: 'Delete billable rate' })
  @ApiParam({ name: 'id', description: 'Rate ID' })
  @ApiResponse({ status: 200, description: 'Rate deleted' })
  async deleteBillableRate(@Request() req: any, @Param('id') id: string) {
    return this.svc.deleteBillableRate(req.user.tenantId, req.user.userId, id);
  }

  // ===========================
  // BUDGETS
  // ===========================

  @Post('budgets')
  @ApiOperation({ summary: 'Create budget' })
  @ApiResponse({ status: 201, description: 'Budget created' })
  async createBudget(@Request() req: any, @Body() dto: CreateBudgetDto) {
    return this.svc.createBudget(req.user.tenantId, req.user.userId, dto);
  }

  @Get('budgets')
  @ApiOperation({ summary: 'List budgets' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiResponse({ status: 200, description: 'List of budgets' })
  async listBudgets(@Request() req: any, @Query('projectId') projectId?: string) {
    return this.svc.listBudgets(req.user.tenantId, req.user.userId, projectId);
  }

  @Get('budgets/:id')
  @ApiOperation({ summary: 'Get budget details' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiResponse({ status: 200, description: 'Budget details' })
  async getBudget(@Request() req: any, @Param('id') id: string) {
    return this.svc.getBudget(req.user.tenantId, req.user.userId, id);
  }

  @Patch('budgets/:id')
  @ApiOperation({ summary: 'Update budget' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiResponse({ status: 200, description: 'Budget updated' })
  async updateBudget(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateBudgetDto) {
    return this.svc.updateBudget(req.user.tenantId, req.user.userId, id, dto);
  }

  @Delete('budgets/:id')
  @ApiOperation({ summary: 'Delete budget' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiResponse({ status: 200, description: 'Budget deleted' })
  async deleteBudget(@Request() req: any, @Param('id') id: string) {
    return this.svc.deleteBudget(req.user.tenantId, req.user.userId, id);
  }

  // ===========================
  // CLIENTS (for invoice linking)
  // ===========================

  @Get('clients')
  @ApiOperation({ summary: 'List CRM clients for invoice assignment' })
  @ApiResponse({ status: 200, description: 'List of clients' })
  async listClients(@Request() req: any) {
    return this.svc.listClients(req.user.tenantId);
  }

  // ===========================
  // TEAM MEMBERS (for rate assignment)
  // ===========================

  @Get('team-members')
  @ApiOperation({ summary: 'List team members for rate assignment' })
  @ApiResponse({ status: 200, description: 'List of team members' })
  async listTeamMembers(@Request() req: any, @Query('projectId') projectId?: string) {
    return this.svc.listTeamMembers(req.user.tenantId, projectId);
  }

  // ===========================
  // REPORTS
  // ===========================

  @Post('reports')
  @ApiOperation({ summary: 'Generate financial report' })
  @ApiResponse({ status: 201, description: 'Report generated' })
  async generateReport(@Request() req: any, @Body() dto: GenerateReportDto) {
    return this.svc.generateReport(req.user.tenantId, req.user.userId, dto);
  }

  // ===========================
  // PDF EXPORT
  // ===========================

  @Get('invoices/:id/pdf-data')
  @ApiOperation({ summary: 'Get invoice PDF data' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice PDF data' })
  async getInvoicePdfData(@Request() req: any, @Param('id') id: string) {
    return this.svc.getInvoicePdfData(req.user.tenantId, req.user.userId, id);
  }

  @Get('invoices/:id/html')
  @ApiOperation({ summary: 'Get invoice as HTML for printing' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice HTML', content: { 'text/html': {} } })
  async getInvoiceHtml(@Request() req: any, @Param('id') id: string) {
    const html = await this.svc.getInvoiceHtml(req.user.tenantId, req.user.userId, id);
    return html;
  }
}

