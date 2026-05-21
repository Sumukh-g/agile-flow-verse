import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi, type CreateInvoiceWizardDto, type UpdateInvoiceDto, type CreateExpenseDto, type UpdateExpenseDto, type CreateBillableRateDto, type UpdateBillableRateDto, type CreateBudgetDto, type UpdateBudgetDto, type RecordPaymentDto, type GenerateReportDto, type InvoiceQueryDto, type ExpenseQueryDto, type FinanceDashboardQueryDto } from '@/lib/api/finance';
import { toast } from 'sonner';

// Query Keys
export const financeKeys = {
  all: ['finance'] as const,
  dashboard: (query?: FinanceDashboardQueryDto) => [...financeKeys.all, 'dashboard', query] as const,
  invoices: (query?: InvoiceQueryDto) => [...financeKeys.all, 'invoices', query] as const,
  invoice: (id: string) => [...financeKeys.all, 'invoice', id] as const,
  expenses: (query?: ExpenseQueryDto) => [...financeKeys.all, 'expenses', query] as const,
  expense: (id: string) => [...financeKeys.all, 'expense', id] as const,
  rates: (projectId?: string) => [...financeKeys.all, 'rates', projectId] as const,
  budgets: (projectId?: string) => [...financeKeys.all, 'budgets', projectId] as const,
  budget: (id: string) => [...financeKeys.all, 'budget', id] as const,
};

// Dashboard
export function useFinanceDashboard(query?: FinanceDashboardQueryDto) {
  return useQuery({
    queryKey: financeKeys.dashboard(query),
    queryFn: () => financeApi.getDashboard(query),
    staleTime: 30 * 1000, // Data is fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Invoices
export function useInvoices(query?: InvoiceQueryDto) {
  return useQuery({
    queryKey: financeKeys.invoices(query),
    queryFn: () => financeApi.listInvoices(query),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: financeKeys.invoice(id),
    queryFn: () => financeApi.getInvoice(id),
    enabled: !!id,
  });
}

export function useGenerateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateInvoiceWizardDto) => financeApi.generateInvoice(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
      queryClient.invalidateQueries({ queryKey: financeKeys.dashboard() });
      toast.success(`Invoice ${data.invoiceNumber} created successfully`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate invoice');
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateInvoiceDto }) =>
      financeApi.updateInvoice(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.invoice(data.id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
      queryClient.invalidateQueries({ queryKey: financeKeys.dashboard() });
      toast.success('Invoice updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update invoice');
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => financeApi.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
      queryClient.invalidateQueries({ queryKey: financeKeys.dashboard() });
      toast.success('Invoice deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete invoice');
    },
  });
}

export function useSendInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => financeApi.sendInvoice(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.invoice(data.id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
      toast.success('Invoice marked as sent');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send invoice');
    },
  });
}

export function useVoidInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      financeApi.voidInvoice(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.invoice(data.id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
      queryClient.invalidateQueries({ queryKey: financeKeys.dashboard() });
      toast.success('Invoice voided');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to void invoice');
    },
  });
}

export function useApproveInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => financeApi.approveInvoice(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.invoice(data.id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
      toast.success('Invoice approved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve invoice');
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, dto }: { invoiceId: string; dto: RecordPaymentDto }) =>
      financeApi.recordPayment(invoiceId, dto),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.invoice(invoiceId) });
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
      queryClient.invalidateQueries({ queryKey: financeKeys.dashboard() });
      toast.success('Payment recorded');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record payment');
    },
  });
}

// Expenses
export function useExpenses(query?: ExpenseQueryDto) {
  return useQuery({
    queryKey: financeKeys.expenses(query),
    queryFn: () => financeApi.listExpenses(query),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: financeKeys.expense(id),
    queryFn: () => financeApi.getExpense(id),
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateExpenseDto) => financeApi.createExpense(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.expenses() });
      queryClient.invalidateQueries({ queryKey: financeKeys.dashboard() });
      toast.success('Expense created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create expense');
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateExpenseDto }) =>
      financeApi.updateExpense(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.expense(data.id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.expenses() });
      queryClient.invalidateQueries({ queryKey: financeKeys.dashboard() });
      toast.success('Expense updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update expense');
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => financeApi.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.expenses() });
      queryClient.invalidateQueries({ queryKey: financeKeys.dashboard() });
      toast.success('Expense deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete expense');
    },
  });
}

export function useApproveExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => financeApi.approveExpense(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.expense(data.id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.expenses() });
      queryClient.invalidateQueries({ queryKey: financeKeys.dashboard() });
      toast.success('Expense approved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve expense');
    },
  });
}

export function useRejectExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      financeApi.rejectExpense(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.expense(data.id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.expenses() });
      toast.success('Expense rejected');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject expense');
    },
  });
}

// Billable Rates
export function useBillableRates(projectId?: string) {
  return useQuery({
    queryKey: financeKeys.rates(projectId),
    queryFn: () => financeApi.listBillableRates(projectId),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useCreateBillableRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateBillableRateDto) => financeApi.createBillableRate(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.rates() });
      toast.success('Billable rate created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create rate');
    },
  });
}

export function useUpdateBillableRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBillableRateDto }) =>
      financeApi.updateBillableRate(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.rates() });
      toast.success('Billable rate updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update rate');
    },
  });
}

export function useDeleteBillableRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => financeApi.deleteBillableRate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.rates() });
      toast.success('Billable rate deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete rate');
    },
  });
}

// Budgets
export function useBudgets(projectId?: string) {
  return useQuery({
    queryKey: financeKeys.budgets(projectId),
    queryFn: () => financeApi.listBudgets(projectId),
    staleTime: 30 * 1000, // Data is fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: financeKeys.budget(id),
    queryFn: () => financeApi.getBudget(id),
    enabled: !!id,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateBudgetDto) => financeApi.createBudget(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.budgets() });
      toast.success('Budget created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create budget');
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBudgetDto }) =>
      financeApi.updateBudget(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.budget(data.id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.budgets() });
      toast.success('Budget updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update budget');
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => financeApi.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.budgets() });
      toast.success('Budget deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete budget');
    },
  });
}

// Reports
export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: GenerateReportDto) => financeApi.generateReport(dto),
    onSuccess: () => {
      toast.success('Report generated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate report');
    },
  });
}

// Clients (for invoice linking)
export function useClients() {
  return useQuery({
    queryKey: [...financeKeys.all, 'clients'],
    queryFn: () => financeApi.listClients(),
    staleTime: 5 * 60 * 1000, // Fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Cache for 30 minutes
  });
}

// Team Members (for rate assignment)
export function useTeamMembers(projectId?: string) {
  return useQuery({
    queryKey: [...financeKeys.all, 'team-members', projectId],
    queryFn: () => financeApi.listTeamMembers(projectId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

