import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  FileText,
  Receipt,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Filter,
  Download,
  Send,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  Users,
  Briefcase,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Building2,
  Wallet,
  Target,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useFinanceDashboard,
  useInvoices,
  useInvoice,
  useExpenses,
  useBillableRates,
  useBudgets,
  useGenerateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
  useSendInvoice,
  useVoidInvoice,
  useApproveInvoice,
  useRecordPayment,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useApproveExpense,
  useRejectExpense,
  useCreateBillableRate,
  useUpdateBillableRate,
  useDeleteBillableRate,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
  useClients,
  useTeamMembers,
} from '@/hooks/useFinance';
import {
  InvoiceStatus,
  InvoiceGroupingStrategy,
  ExpenseStatus,
  ExpenseCategory,
  DateRangePreset,
  type Invoice,
  type Expense,
  type BillableRate,
  type Budget,
  type CreateInvoiceWizardDto,
  type CreateExpenseDto,
  type Client,
  type UpdateInvoiceDto,
  financeApi,
} from '@/lib/api/finance';
import { format, formatDistanceToNow, parseISO, isAfter, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FinanceBoardProps {
  projectId: string;
  projectName?: string;
}

// Status badge colors
const invoiceStatusColors: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  [InvoiceStatus.PENDING_APPROVAL]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [InvoiceStatus.APPROVED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [InvoiceStatus.SENT]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  [InvoiceStatus.VIEWED]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  [InvoiceStatus.PARTIALLY_PAID]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  [InvoiceStatus.PAID]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [InvoiceStatus.OVERDUE]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [InvoiceStatus.VOID]: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  [InvoiceStatus.DISPUTED]: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
};

const expenseStatusColors: Record<ExpenseStatus, string> = {
  [ExpenseStatus.DRAFT]: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  [ExpenseStatus.PENDING_APPROVAL]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [ExpenseStatus.APPROVED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [ExpenseStatus.REJECTED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [ExpenseStatus.REIMBURSED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [ExpenseStatus.INVOICED]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  [ExpenseCategory.TRAVEL]: 'Travel',
  [ExpenseCategory.SOFTWARE]: 'Software',
  [ExpenseCategory.HARDWARE]: 'Hardware',
  [ExpenseCategory.HOSTING]: 'Hosting',
  [ExpenseCategory.MARKETING]: 'Marketing',
  [ExpenseCategory.OFFICE_SUPPLIES]: 'Office Supplies',
  [ExpenseCategory.CONSULTING]: 'Consulting',
  [ExpenseCategory.SUBCONTRACTOR]: 'Subcontractor',
  [ExpenseCategory.MEALS]: 'Meals',
  [ExpenseCategory.ACCOMMODATION]: 'Accommodation',
  [ExpenseCategory.TRANSPORTATION]: 'Transportation',
  [ExpenseCategory.COMMUNICATION]: 'Communication',
  [ExpenseCategory.TRAINING]: 'Training',
  [ExpenseCategory.LICENSE]: 'License',
  [ExpenseCategory.OTHER]: 'Other',
};

export default function FinanceBoard({ projectId, projectName }: FinanceBoardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showInvoiceWizard, setShowInvoiceWizard] = useState(false);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showRateDialog, setShowRateDialog] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Queries
  const { data: dashboard, isLoading: dashboardLoading, refetch: refetchDashboard } = useFinanceDashboard({ projectId });
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices({ projectId });
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses({ projectId });
  const { data: rates = [], isLoading: ratesLoading } = useBillableRates(projectId);
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets(projectId);
  const { data: clients = [] } = useClients();
  const { data: teamMembers = [] } = useTeamMembers(projectId);

  // Mutations
  const generateInvoice = useGenerateInvoice();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const sendInvoice = useSendInvoice();
  const voidInvoice = useVoidInvoice();
  const approveInvoice = useApproveInvoice();
  const recordPayment = useRecordPayment();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const approveExpense = useApproveExpense();
  const rejectExpense = useRejectExpense();
  const createRate = useCreateBillableRate();
  const updateRate = useUpdateBillableRate();
  const deleteRate = useDeleteBillableRate();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  // Format currency
  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Finance Board</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {projectName || 'Project'} • Financial Management
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchDashboard()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowInvoiceWizard(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-6 py-2 border-b bg-white/50 dark:bg-slate-900/50">
          <TabsList className="bg-slate-100 dark:bg-slate-800">
            <TabsTrigger value="dashboard" className="gap-2">
              <PieChart className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2">
              <FileText className="w-4 h-4" />
              Invoices
              {invoices.length > 0 && (
                <Badge variant="secondary" className="ml-1">{invoices.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-2">
              <Receipt className="w-4 h-4" />
              Expenses
              {expenses.length > 0 && (
                <Badge variant="secondary" className="ml-1">{expenses.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rates" className="gap-2">
              <Users className="w-4 h-4" />
              Rates
            </TabsTrigger>
            <TabsTrigger value="budgets" className="gap-2">
              <Target className="w-4 h-4" />
              Budgets
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="p-6 m-0">
            <DashboardView
              dashboard={dashboard}
              loading={dashboardLoading}
              formatCurrency={formatCurrency}
            />
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="p-6 m-0">
            <InvoicesView
              invoices={invoices}
              loading={invoicesLoading}
              formatCurrency={formatCurrency}
              clients={clients}
              onSend={(inv) => sendInvoice.mutate(inv.id)}
              onApprove={(inv) => approveInvoice.mutate(inv.id)}
              onVoid={(inv) => voidInvoice.mutate({ id: inv.id })}
              onDelete={(inv) => deleteInvoice.mutate(inv.id)}
              onRecordPayment={(inv) => {
                setSelectedInvoice(inv);
                setShowPaymentDialog(true);
              }}
              onDownloadPdf={async (inv) => {
                try {
                  const html = await financeApi.getInvoiceHtml(inv.id);
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(html as string);
                    printWindow.document.close();
                    printWindow.print();
                  }
                } catch (error) {
                  toast.error('Failed to generate PDF');
                }
              }}
              onViewDetails={(inv) => {
                setSelectedInvoice(inv);
                setShowInvoiceDetail(true);
              }}
              onEdit={(inv) => {
                setSelectedInvoice(inv);
                setShowInvoiceDetail(true);
              }}
            />
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="p-6 m-0">
            <ExpensesView
              expenses={expenses}
              loading={expensesLoading}
              formatCurrency={formatCurrency}
              onAdd={() => setShowExpenseDialog(true)}
              onEdit={(exp) => {
                setSelectedExpense(exp);
                setShowExpenseDialog(true);
              }}
              onApprove={(exp) => approveExpense.mutate(exp.id)}
              onReject={(exp) => rejectExpense.mutate({ id: exp.id })}
              onDelete={(exp) => deleteExpense.mutate(exp.id)}
            />
          </TabsContent>

          {/* Rates Tab */}
          <TabsContent value="rates" className="p-6 m-0">
            <RatesView
              rates={rates}
              loading={ratesLoading}
              formatCurrency={formatCurrency}
              onAdd={() => setShowRateDialog(true)}
              onDelete={(rate) => deleteRate.mutate(rate.id)}
            />
          </TabsContent>

          {/* Budgets Tab */}
          <TabsContent value="budgets" className="p-6 m-0">
            <BudgetsView
              budgets={budgets}
              loading={budgetsLoading}
              formatCurrency={formatCurrency}
              onAdd={() => setShowBudgetDialog(true)}
              onDelete={(budget) => deleteBudget.mutate(budget.id)}
            />
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Invoice Wizard Dialog */}
      <InvoiceWizardDialog
        open={showInvoiceWizard}
        onOpenChange={setShowInvoiceWizard}
        projectId={projectId}
        clients={clients}
        onGenerate={(dto) => {
          generateInvoice.mutate(dto);
          setShowInvoiceWizard(false);
        }}
        isLoading={generateInvoice.isPending}
      />

      {/* Expense Dialog */}
      <ExpenseDialog
        open={showExpenseDialog}
        onOpenChange={(open) => {
          setShowExpenseDialog(open);
          if (!open) setSelectedExpense(null);
        }}
        projectId={projectId}
        expense={selectedExpense}
        onSave={(dto) => {
          if (selectedExpense) {
            updateExpense.mutate({ id: selectedExpense.id, dto });
          } else {
            createExpense.mutate(dto);
          }
          setShowExpenseDialog(false);
          setSelectedExpense(null);
        }}
        isLoading={createExpense.isPending || updateExpense.isPending}
      />

      {/* Payment Dialog */}
      {selectedInvoice && (
        <PaymentDialog
          open={showPaymentDialog}
          onOpenChange={(open) => {
            setShowPaymentDialog(open);
            if (!open) setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          onRecord={(dto) => {
            recordPayment.mutate({ invoiceId: selectedInvoice.id, dto });
            setShowPaymentDialog(false);
            setSelectedInvoice(null);
          }}
          isLoading={recordPayment.isPending}
        />
      )}

      {/* Rate Dialog */}
      <RateDialog
        open={showRateDialog}
        onOpenChange={setShowRateDialog}
        projectId={projectId}
        onSave={(dto) => {
          createRate.mutate(dto);
          setShowRateDialog(false);
        }}
        isLoading={createRate.isPending}
      />

      {/* Budget Dialog */}
      <BudgetDialog
        open={showBudgetDialog}
        onOpenChange={setShowBudgetDialog}
        projectId={projectId}
        onSave={(dto) => {
          createBudget.mutate(dto);
          setShowBudgetDialog(false);
        }}
        isLoading={createBudget.isPending}
      />

      {/* Invoice Detail Dialog */}
      {selectedInvoice && (
        <InvoiceDetailDialog
          open={showInvoiceDetail}
          onOpenChange={(open) => {
            setShowInvoiceDetail(open);
            if (!open) setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          clients={clients}
          onUpdate={(dto) => {
            updateInvoice.mutate({ id: selectedInvoice.id, dto });
          }}
          onSend={() => sendInvoice.mutate(selectedInvoice.id)}
          onApprove={() => approveInvoice.mutate(selectedInvoice.id)}
          onVoid={(reason) => voidInvoice.mutate({ id: selectedInvoice.id, reason })}
          onRecordPayment={() => {
            setShowInvoiceDetail(false);
            setShowPaymentDialog(true);
          }}
          isUpdating={updateInvoice.isPending}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
}

// ===========================
// Dashboard View Component
// ===========================

function DashboardView({
  dashboard,
  loading,
  formatCurrency,
}: {
  dashboard: any;
  loading: boolean;
  formatCurrency: (amount: number, currency?: string) => string;
}) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-slate-200 rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-slate-200 rounded w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(dashboard?.invoices?.totalRevenue || 0),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      title: 'Outstanding',
      value: formatCurrency(dashboard?.invoices?.totalOutstanding || 0),
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      title: 'Expenses',
      value: formatCurrency(dashboard?.expenses?.totalAmount || 0),
      icon: TrendingDown,
      color: 'text-rose-600',
      bg: 'bg-rose-100 dark:bg-rose-900/30',
    },
    {
      title: 'Invoices',
      value: dashboard?.invoices?.total || 0,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {stat.title}
              </CardTitle>
              <div className={cn('p-2 rounded-lg', stat.bg)}>
                <stat.icon className={cn('w-4 h-4', stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overdue Invoices */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              Overdue Invoices
            </CardTitle>
            <CardDescription>Invoices past their due date</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard?.overdueInvoices?.length > 0 ? (
              <div className="space-y-3">
                {dashboard.overdueInvoices.slice(0, 5).map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{inv.invoiceNumber}</p>
                      <p className="text-sm text-slate-500">{inv.client?.name || 'No client'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-rose-600">{formatCurrency(inv.balanceDue)}</p>
                      <p className="text-xs text-slate-500">
                        {differenceInDays(new Date(), parseISO(inv.dueDate))} days overdue
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">No overdue invoices 🎉</p>
            )}
          </CardContent>
        </Card>

        {/* Pending Expenses */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <Clock className="w-5 h-5" />
              Pending Approvals
            </CardTitle>
            <CardDescription>Expenses awaiting approval</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard?.pendingExpenses?.length > 0 ? (
              <div className="space-y-3">
                {dashboard.pendingExpenses.slice(0, 5).map((exp: any) => (
                  <div key={exp.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{exp.title}</p>
                      <p className="text-sm text-slate-500">{exp.user?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-600">{formatCurrency(exp.amount)}</p>
                      <p className="text-xs text-slate-500">
                        {formatDistanceToNow(parseISO(exp.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">No pending expenses</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard?.recentInvoices?.length > 0 ? (
              <div className="space-y-2">
                {dashboard.recentInvoices.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{inv.invoiceNumber}</p>
                        <p className="text-sm text-slate-500">{inv.project?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(inv.grandTotal)}</p>
                      <Badge className={invoiceStatusColors[inv.status as InvoiceStatus]} variant="secondary">
                        {inv.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">No recent invoices</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Recent Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard?.recentExpenses?.length > 0 ? (
              <div className="space-y-2">
                {dashboard.recentExpenses.map((exp: any) => (
                  <div key={exp.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                        <Receipt className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{exp.title}</p>
                        <p className="text-sm text-slate-500">{exp.user?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(exp.amount)}</p>
                      <Badge className={expenseStatusColors[exp.status as ExpenseStatus]} variant="secondary">
                        {exp.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">No recent expenses</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ===========================
// Invoices View Component
// ===========================

function InvoicesView({
  invoices,
  loading,
  formatCurrency,
  clients,
  onSend,
  onApprove,
  onVoid,
  onDelete,
  onRecordPayment,
  onDownloadPdf,
  onViewDetails,
  onEdit,
}: {
  invoices: Invoice[];
  loading: boolean;
  formatCurrency: (amount: number, currency?: string) => string;
  clients: Client[];
  onSend: (inv: Invoice) => void;
  onApprove: (inv: Invoice) => void;
  onVoid: (inv: Invoice) => void;
  onDelete: (inv: Invoice) => void;
  onRecordPayment: (inv: Invoice) => void;
  onDownloadPdf: (inv: Invoice) => void;
  onViewDetails: (inv: Invoice) => void;
  onEdit: (inv: Invoice) => void;
}) {
  if (loading) {
    return (
      <Card className="border-0 shadow-lg animate-pulse">
        <CardContent className="p-8">
          <div className="h-64 bg-slate-200 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>Manage your project invoices</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {invoices.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                  <TableCell>{inv.client?.name || '—'}</TableCell>
                  <TableCell>
                    <Badge className={invoiceStatusColors[inv.status]} variant="secondary">
                      {inv.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{formatCurrency(inv.grandTotal)}</p>
                      {inv.balanceDue > 0 && inv.balanceDue !== inv.grandTotal && (
                        <p className="text-xs text-slate-500">
                          Due: {formatCurrency(inv.balanceDue)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {format(parseISO(inv.dueDate), 'MMM dd, yyyy')}
                      {isAfter(new Date(), parseISO(inv.dueDate)) && inv.status !== InvoiceStatus.PAID && (
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewDetails(inv)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {inv.status === InvoiceStatus.DRAFT && (
                          <DropdownMenuItem onClick={() => onEdit(inv)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Invoice
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onDownloadPdf(inv)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {inv.status === InvoiceStatus.DRAFT && (
                          <>
                            <DropdownMenuItem onClick={() => onApprove(inv)}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSend(inv)}>
                              <Send className="w-4 h-4 mr-2" />
                              Mark as Sent
                            </DropdownMenuItem>
                          </>
                        )}
                        {inv.status === InvoiceStatus.PENDING_APPROVAL && (
                          <DropdownMenuItem onClick={() => onApprove(inv)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </DropdownMenuItem>
                        )}
                        {inv.status === InvoiceStatus.APPROVED && (
                          <DropdownMenuItem onClick={() => onSend(inv)}>
                            <Send className="w-4 h-4 mr-2" />
                            Mark as Sent
                          </DropdownMenuItem>
                        )}
                        {[InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID].includes(inv.status) && (
                          <DropdownMenuItem onClick={() => onRecordPayment(inv)}>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Record Payment
                          </DropdownMenuItem>
                        )}
                        {inv.status !== InvoiceStatus.VOID && inv.status !== InvoiceStatus.PAID && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onVoid(inv)}
                              className="text-rose-600"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Void Invoice
                            </DropdownMenuItem>
                          </>
                        )}
                        {inv.status === InvoiceStatus.DRAFT && (
                          <DropdownMenuItem
                            onClick={() => onDelete(inv)}
                            className="text-rose-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No invoices yet
            </h3>
            <p className="text-slate-500 mb-4">
              Create your first invoice to start tracking revenue
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===========================
// Expenses View Component
// ===========================

function ExpensesView({
  expenses,
  loading,
  formatCurrency,
  onAdd,
  onEdit,
  onApprove,
  onReject,
  onDelete,
}: {
  expenses: Expense[];
  loading: boolean;
  formatCurrency: (amount: number, currency?: string) => string;
  onAdd: () => void;
  onEdit: (exp: Expense) => void;
  onApprove: (exp: Expense) => void;
  onReject: (exp: Expense) => void;
  onDelete: (exp: Expense) => void;
}) {
  if (loading) {
    return (
      <Card className="border-0 shadow-lg animate-pulse">
        <CardContent className="p-8">
          <div className="h-64 bg-slate-200 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Expenses</CardTitle>
            <CardDescription>Track and manage project expenses</CardDescription>
          </div>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {expenses.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expense</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{exp.title}</p>
                      {exp.vendor && (
                        <p className="text-sm text-slate-500">{exp.vendor}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {expenseCategoryLabels[exp.category]}
                    </Badge>
                  </TableCell>
                  <TableCell>{exp.user?.name || '—'}</TableCell>
                  <TableCell>
                    <Badge className={expenseStatusColors[exp.status]} variant="secondary">
                      {exp.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(exp.amount)}
                    {!exp.billable && (
                      <span className="ml-1 text-xs text-slate-400">(non-billable)</span>
                    )}
                  </TableCell>
                  <TableCell>{format(parseISO(exp.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(exp)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {exp.receiptUrl && (
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Receipt
                          </DropdownMenuItem>
                        )}
                        {exp.status === ExpenseStatus.PENDING_APPROVAL && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onApprove(exp)}>
                              <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onReject(exp)}>
                              <XCircle className="w-4 h-4 mr-2 text-rose-600" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {!exp.invoiceId && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(exp)}
                              className="text-rose-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No expenses yet
            </h3>
            <p className="text-slate-500 mb-4">
              Start tracking project expenses
            </p>
            <Button onClick={onAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===========================
// Rates View Component
// ===========================

function RatesView({
  rates,
  loading,
  formatCurrency,
  onAdd,
  onDelete,
}: {
  rates: BillableRate[];
  loading: boolean;
  formatCurrency: (amount: number, currency?: string) => string;
  onAdd: () => void;
  onDelete: (rate: BillableRate) => void;
}) {
  if (loading) {
    return (
      <Card className="border-0 shadow-lg animate-pulse">
        <CardContent className="p-8">
          <div className="h-64 bg-slate-200 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Billable Rates</CardTitle>
            <CardDescription>Configure hourly rates for team members and roles</CardDescription>
          </div>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Rate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {rates.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User / Role</TableHead>
                <TableHead>Hourly Rate</TableHead>
                <TableHead>Effective From</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {rate.user?.name || rate.role || 'Default Rate'}
                        </p>
                        {rate.description && (
                          <p className="text-sm text-slate-500">{rate.description}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-emerald-600">
                    {formatCurrency(rate.hourlyRate)}/hr
                  </TableCell>
                  <TableCell>
                    {format(parseISO(rate.effectiveFrom), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={rate.isActive ? 'default' : 'secondary'}>
                      {rate.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(rate)}
                      className="text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No rates configured
            </h3>
            <p className="text-slate-500 mb-4">
              Set up billable rates for your team
            </p>
            <Button onClick={onAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Rate
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===========================
// Budgets View Component
// ===========================

function BudgetsView({
  budgets,
  loading,
  formatCurrency,
  onAdd,
  onDelete,
}: {
  budgets: Budget[];
  loading: boolean;
  formatCurrency: (amount: number, currency?: string) => string;
  onAdd: () => void;
  onDelete: (budget: Budget) => void;
}) {
  if (loading) {
    return (
      <Card className="border-0 shadow-lg animate-pulse">
        <CardContent className="p-8">
          <div className="h-64 bg-slate-200 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Budgets</CardTitle>
            <CardDescription>Track and monitor project budgets</CardDescription>
          </div>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Budget
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {budgets.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {budgets.map((budget) => {
              const percentUsed = (budget.spentAmount / budget.totalAmount) * 100;
              const isOverBudget = percentUsed > 100;
              const isWarning = percentUsed >= budget.alertThreshold && !isOverBudget;

              return (
                <Card key={budget.id} className={cn(
                  'border-2',
                  isOverBudget && 'border-rose-300 bg-rose-50/50 dark:bg-rose-900/10',
                  isWarning && 'border-amber-300 bg-amber-50/50 dark:bg-amber-900/10',
                  !isOverBudget && !isWarning && 'border-slate-200'
                )}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{budget.name}</CardTitle>
                      <Badge variant={budget.isActive ? 'default' : 'secondary'}>
                        {budget.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Spent</span>
                      <span className="font-bold">
                        {formatCurrency(budget.spentAmount)} / {formatCurrency(budget.totalAmount)}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(percentUsed, 100)}
                      className={cn(
                        'h-2',
                        isOverBudget && '[&>div]:bg-rose-500',
                        isWarning && '[&>div]:bg-amber-500'
                      )}
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className={cn(
                        'font-medium',
                        isOverBudget && 'text-rose-600',
                        isWarning && 'text-amber-600'
                      )}>
                        {percentUsed.toFixed(1)}% used
                      </span>
                      <span className="text-slate-500">
                        {formatCurrency(budget.totalAmount - budget.spentAmount)} remaining
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(budget)}
                        className="text-rose-600 hover:text-rose-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No budgets yet
            </h3>
            <p className="text-slate-500 mb-4">
              Create a budget to track project spending
            </p>
            <Button onClick={onAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Budget
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===========================
// Invoice Wizard Dialog
// ===========================

function InvoiceWizardDialog({
  open,
  onOpenChange,
  projectId,
  clients,
  onGenerate,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  clients: Client[];
  onGenerate: (dto: CreateInvoiceWizardDto) => void;
  isLoading: boolean;
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CreateInvoiceWizardDto>>({
    projectId,
    clientId: undefined,
    dateRangePreset: DateRangePreset.LAST_MONTH,
    includeTimesheets: true,
    includeExpenses: true,
    includeFixedTasks: false,
    groupingStrategy: InvoiceGroupingStrategy.BY_ROLE,
    taxPercent: 0,
    discountPercent: 0,
    currency: 'USD',
  });

  const handleGenerate = () => {
    onGenerate(formData as CreateInvoiceWizardDto);
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      projectId,
      clientId: undefined,
      dateRangePreset: DateRangePreset.LAST_MONTH,
      includeTimesheets: true,
      includeExpenses: true,
      includeFixedTasks: false,
      groupingStrategy: InvoiceGroupingStrategy.BY_ROLE,
      taxPercent: 0,
      discountPercent: 0,
      currency: 'USD',
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) resetForm();
      onOpenChange(v);
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            Invoice Generation Wizard
          </DialogTitle>
          <DialogDescription>
            Step {step} of 3: {step === 1 ? 'Date Range' : step === 2 ? 'Items to Include' : 'Grouping & Details'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Date Range & Client */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Client Selection */}
              <div>
                <Label>Bill To (Client)</Label>
                <p className="text-sm text-slate-500 mb-2">Select a client for this invoice</p>
                <Select
                  value={formData.clientId || 'none'}
                  onValueChange={(v) => setFormData({ ...formData, clientId: v === 'none' ? undefined : v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-slate-500">No client (internal invoice)</span>
                    </SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{client.name}</span>
                          {client.company && <span className="text-xs text-slate-500">{client.company}</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clients.length === 0 && (
                  <p className="text-xs text-amber-600 mt-2">
                    No clients found. Add clients in the CRM section.
                  </p>
                )}
              </div>

              <Separator />

              {/* Date Range */}
              <div>
                <Label>Select Period</Label>
                <Select
                  value={formData.dateRangePreset}
                  onValueChange={(v) => setFormData({ ...formData, dateRangePreset: v as DateRangePreset })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DateRangePreset.THIS_WEEK}>This Week</SelectItem>
                    <SelectItem value={DateRangePreset.LAST_WEEK}>Last Week</SelectItem>
                    <SelectItem value={DateRangePreset.THIS_MONTH}>This Month</SelectItem>
                    <SelectItem value={DateRangePreset.LAST_MONTH}>Last Month</SelectItem>
                    <SelectItem value={DateRangePreset.THIS_QUARTER}>This Quarter</SelectItem>
                    <SelectItem value={DateRangePreset.LAST_QUARTER}>Last Quarter</SelectItem>
                    <SelectItem value={DateRangePreset.THIS_YEAR}>This Year</SelectItem>
                    <SelectItem value={DateRangePreset.LAST_YEAR}>Last Year</SelectItem>
                    <SelectItem value={DateRangePreset.CUSTOM}>Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.dateRangePreset === DateRangePreset.CUSTOM && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      className="mt-2"
                      value={formData.periodStart?.split('T')[0] || ''}
                      onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      className="mt-2"
                      value={formData.periodEnd?.split('T')[0] || ''}
                      onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Items to Include */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Timesheets</p>
                    <p className="text-sm text-slate-500">Include billable time entries</p>
                  </div>
                </div>
                <Switch
                  checked={formData.includeTimesheets}
                  onCheckedChange={(v) => setFormData({ ...formData, includeTimesheets: v })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Receipt className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="font-medium">Expenses</p>
                    <p className="text-sm text-slate-500">Include approved expenses</p>
                  </div>
                </div>
                <Switch
                  checked={formData.includeExpenses}
                  onCheckedChange={(v) => setFormData({ ...formData, includeExpenses: v })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium">Fixed Price Tasks</p>
                    <p className="text-sm text-slate-500">Include completed fixed-price items</p>
                  </div>
                </div>
                <Switch
                  checked={formData.includeFixedTasks}
                  onCheckedChange={(v) => setFormData({ ...formData, includeFixedTasks: v })}
                />
              </div>
            </div>
          )}

          {/* Step 3: Grouping & Details */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Grouping Strategy</Label>
                <p className="text-sm text-slate-500 mb-2">
                  How should line items be grouped on the invoice?
                </p>
                <Select
                  value={formData.groupingStrategy}
                  onValueChange={(v) => setFormData({ ...formData, groupingStrategy: v as InvoiceGroupingStrategy })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={InvoiceGroupingStrategy.DETAILED}>
                      <div>
                        <p className="font-medium">Detailed</p>
                        <p className="text-xs text-slate-500">Every time entry as a row</p>
                      </div>
                    </SelectItem>
                    <SelectItem value={InvoiceGroupingStrategy.BY_ROLE}>
                      <div>
                        <p className="font-medium">By Role</p>
                        <p className="text-xs text-slate-500">Group by service type</p>
                      </div>
                    </SelectItem>
                    <SelectItem value={InvoiceGroupingStrategy.BY_USER}>
                      <div>
                        <p className="font-medium">By Team Member</p>
                        <p className="text-xs text-slate-500">Group by person</p>
                      </div>
                    </SelectItem>
                    <SelectItem value={InvoiceGroupingStrategy.BY_TASK}>
                      <div>
                        <p className="font-medium">By Task</p>
                        <p className="text-xs text-slate-500">Group by task/feature</p>
                      </div>
                    </SelectItem>
                    <SelectItem value={InvoiceGroupingStrategy.BY_DATE}>
                      <div>
                        <p className="font-medium">By Date</p>
                        <p className="text-xs text-slate-500">Group by week</p>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Tax %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    className="mt-2"
                    value={formData.taxPercent || 0}
                    onChange={(e) => setFormData({ ...formData, taxPercent: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Discount %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    className="mt-2"
                    value={formData.discountPercent || 0}
                    onChange={(e) => setFormData({ ...formData, discountPercent: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label>Payment Terms</Label>
                <Textarea
                  className="mt-2"
                  placeholder="Net 30, Payment due upon receipt, etc."
                  value={formData.terms || ''}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                />
              </div>

              <div>
                <Label>Notes for Client</Label>
                <Textarea
                  className="mt-2"
                  placeholder="Thank you for your business..."
                  value={formData.clientNotes || ''}
                  onChange={(e) => setFormData({ ...formData, clientNotes: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              {isLoading ? 'Generating...' : 'Generate Invoice'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===========================
// Expense Dialog
// ===========================

function ExpenseDialog({
  open,
  onOpenChange,
  projectId,
  expense,
  onSave,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  expense: Expense | null;
  onSave: (dto: CreateExpenseDto | any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Partial<CreateExpenseDto>>({
    projectId,
    title: '',
    category: ExpenseCategory.OTHER,
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    billable: true,
    billableToClient: true,
  });

  React.useEffect(() => {
    if (expense) {
      setFormData({
        projectId: expense.projectId,
        title: expense.title,
        description: expense.description,
        category: expense.category,
        amount: expense.amount,
        date: expense.date.split('T')[0],
        vendor: expense.vendor,
        billable: expense.billable,
        billableToClient: expense.billableToClient,
        markup: expense.markup,
      });
    } else {
      setFormData({
        projectId,
        title: '',
        category: ExpenseCategory.OTHER,
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        billable: true,
        billableToClient: true,
      });
    }
  }, [expense, projectId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Title *</Label>
            <Input
              className="mt-2"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="AWS Monthly Bill"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v as ExpenseCategory })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(expenseCategoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                className="mt-2"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                className="mt-2"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Vendor</Label>
              <Input
                className="mt-2"
                value={formData.vendor || ''}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="Amazon Web Services"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              className="mt-2"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Monthly hosting costs for production environment"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.billable}
                onCheckedChange={(v) => setFormData({ ...formData, billable: v })}
              />
              <Label>Billable</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.billableToClient}
                onCheckedChange={(v) => setFormData({ ...formData, billableToClient: v })}
              />
              <Label>Bill to Client</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSave(formData)} disabled={isLoading || !formData.title || !formData.amount}>
            {isLoading ? 'Saving...' : expense ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===========================
// Payment Dialog
// ===========================

function PaymentDialog({
  open,
  onOpenChange,
  invoice,
  onRecord,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  onRecord: (dto: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    amount: invoice.balanceDue,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    referenceNumber: '',
    notes: '',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Invoice {invoice.invoiceNumber} • Balance Due: ${invoice.balanceDue.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Amount *</Label>
            <Input
              type="number"
              min="0.01"
              max={invoice.balanceDue}
              step="0.01"
              className="mt-2"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div>
            <Label>Payment Date *</Label>
            <Input
              type="date"
              className="mt-2"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
            />
          </div>

          <div>
            <Label>Payment Method</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Reference Number</Label>
            <Input
              className="mt-2"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              placeholder="Transaction ID, check number, etc."
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              className="mt-2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => onRecord(formData)}
            disabled={isLoading || formData.amount <= 0}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===========================
// Rate Dialog
// ===========================

function RateDialog({
  open,
  onOpenChange,
  projectId,
  onSave,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSave: (dto: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    projectId,
    hourlyRate: 0,
    role: '',
    description: '',
    effectiveFrom: new Date().toISOString().split('T')[0],
    currency: 'USD',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Billable Rate</DialogTitle>
          <DialogDescription>
            Configure hourly rates for team members or roles
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Role / Title</Label>
            <Input
              className="mt-2"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g., Senior Developer, Designer, PM"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Hourly Rate *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                className="mt-2"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                placeholder="150.00"
              />
            </div>
            <div>
              <Label>Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(v) => setFormData({ ...formData, currency: v })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD ($)</SelectItem>
                  <SelectItem value="AUD">AUD ($)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Effective From</Label>
            <Input
              type="date"
              className="mt-2"
              value={formData.effectiveFrom}
              onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              className="mt-2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Rate for senior-level development work"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave(formData)}
            disabled={isLoading || formData.hourlyRate <= 0}
          >
            {isLoading ? 'Creating...' : 'Create Rate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===========================
// Budget Dialog
// ===========================

function BudgetDialog({
  open,
  onOpenChange,
  projectId,
  onSave,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSave: (dto: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    projectId,
    name: '',
    totalAmount: 0,
    currency: 'USD',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    alertThreshold: 80,
  });

  // Prepare data for submission - only include endDate if it's not empty
  const handleSave = () => {
    const submitData: any = {
      projectId: formData.projectId,
      name: formData.name,
      totalAmount: formData.totalAmount,
      currency: formData.currency,
      startDate: formData.startDate,
      alertThreshold: formData.alertThreshold,
    };
    // Only include endDate if it's a valid date string
    if (formData.endDate && formData.endDate.trim() !== '') {
      submitData.endDate = formData.endDate;
    }
    onSave(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Budget</DialogTitle>
          <DialogDescription>
            Set up budget tracking for the project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Budget Name *</Label>
            <Input
              className="mt-2"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Q1 Development Budget, Marketing Spend"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Total Amount *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                className="mt-2"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                placeholder="50000.00"
              />
            </div>
            <div>
              <Label>Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(v) => setFormData({ ...formData, currency: v })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD ($)</SelectItem>
                  <SelectItem value="AUD">AUD ($)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Start Date *</Label>
              <Input
                type="date"
                className="mt-2"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                className="mt-2"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Alert Threshold (%)</Label>
            <p className="text-sm text-slate-500 mb-2">
              Get notified when budget usage exceeds this percentage
            </p>
            <Input
              type="number"
              min="0"
              max="100"
              className="mt-2"
              value={formData.alertThreshold}
              onChange={(e) => setFormData({ ...formData, alertThreshold: parseInt(e.target.value) || 80 })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !formData.name || formData.totalAmount <= 0}
          >
            {isLoading ? 'Creating...' : 'Create Budget'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===========================
// Invoice Detail Dialog
// ===========================

function InvoiceDetailDialog({
  open,
  onOpenChange,
  invoice,
  clients,
  onUpdate,
  onSend,
  onApprove,
  onVoid,
  onRecordPayment,
  isUpdating,
  formatCurrency,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  clients: Client[];
  onUpdate: (dto: UpdateInvoiceDto) => void;
  onSend: () => void;
  onApprove: () => void;
  onVoid: (reason?: string) => void;
  onRecordPayment: () => void;
  isUpdating: boolean;
  formatCurrency: (amount: number, currency?: string) => string;
}) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    clientId: invoice.clientId || '',
    dueDate: invoice.dueDate?.split('T')[0] || '',
    taxPercent: invoice.taxPercent || 0,
    discountPercent: invoice.discountPercent || 0,
    terms: invoice.terms || '',
    notes: invoice.notes || '',
    clientNotes: invoice.clientNotes || '',
  });
  const [voidReason, setVoidReason] = useState('');
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);

  const isDraft = invoice.status === InvoiceStatus.DRAFT;
  const canEdit = isDraft || invoice.status === InvoiceStatus.PENDING_APPROVAL;
  const canSend = invoice.status === InvoiceStatus.APPROVED;
  const canApprove = invoice.status === InvoiceStatus.DRAFT || invoice.status === InvoiceStatus.PENDING_APPROVAL;
  const canRecordPayment = invoice.status === InvoiceStatus.SENT || invoice.status === InvoiceStatus.PARTIALLY_PAID;
  const canVoid = invoice.status !== InvoiceStatus.VOID && invoice.status !== InvoiceStatus.PAID;

  const handleSave = () => {
    const updateData: UpdateInvoiceDto = {};
    if (formData.clientId && formData.clientId !== invoice.clientId) {
      updateData.clientId = formData.clientId;
    }
    if (formData.dueDate !== invoice.dueDate?.split('T')[0]) {
      updateData.dueDate = formData.dueDate;
    }
    if (formData.taxPercent !== invoice.taxPercent) {
      updateData.taxPercent = formData.taxPercent;
    }
    if (formData.discountPercent !== invoice.discountPercent) {
      updateData.discountPercent = formData.discountPercent;
    }
    if (formData.terms !== invoice.terms) {
      updateData.terms = formData.terms;
    }
    if (formData.notes !== invoice.notes) {
      updateData.notes = formData.notes;
    }
    if (formData.clientNotes !== invoice.clientNotes) {
      updateData.clientNotes = formData.clientNotes;
    }
    
    if (Object.keys(updateData).length > 0) {
      onUpdate(updateData);
    }
    setEditMode(false);
  };

  const selectedClient = clients.find(c => c.id === (formData.clientId || invoice.clientId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">Invoice {invoice.invoiceNumber}</DialogTitle>
              <DialogDescription>
                Created {format(parseISO(invoice.createdAt), 'MMM dd, yyyy')}
              </DialogDescription>
            </div>
            <Badge className={invoiceStatusColors[invoice.status]} variant="secondary">
              {invoice.status.replace('_', ' ')}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Invoice Summary */}
          <div className="grid grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm bg-slate-50 dark:bg-slate-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500">Total Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(invoice.grandTotal)}
                </p>
                {invoice.balanceDue > 0 && invoice.balanceDue !== invoice.grandTotal && (
                  <p className="text-sm text-amber-600">
                    Balance Due: {formatCurrency(invoice.balanceDue)}
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm bg-slate-50 dark:bg-slate-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500">Due Date</CardTitle>
              </CardHeader>
              <CardContent>
                {editMode && canEdit ? (
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                ) : (
                  <p className="text-lg font-medium">
                    {invoice.dueDate ? format(parseISO(invoice.dueDate), 'MMM dd, yyyy') : 'Not set'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Client Section */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Bill To
                </CardTitle>
                {canEdit && !editMode && (
                  <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editMode && canEdit ? (
                <Select
                  value={formData.clientId || 'none'}
                  onValueChange={(v) => setFormData({ ...formData, clientId: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No client assigned</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} {client.company && `(${client.company})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : selectedClient ? (
                <div className="space-y-1">
                  <p className="font-medium">{selectedClient.name}</p>
                  {selectedClient.company && <p className="text-sm text-slate-500">{selectedClient.company}</p>}
                  {selectedClient.email && <p className="text-sm text-slate-500">{selectedClient.email}</p>}
                  {selectedClient.billingAddress && (
                    <p className="text-sm text-slate-500">
                      {selectedClient.billingAddress}
                      {selectedClient.billingCity && `, ${selectedClient.billingCity}`}
                      {selectedClient.billingState && ` ${selectedClient.billingState}`}
                      {selectedClient.billingZip && ` ${selectedClient.billingZip}`}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 italic">No client assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Line Items Summary */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(invoice.lineItems || []).map((item: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                  {(!invoice.lineItems || invoice.lineItems.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-slate-500 py-4">
                        No line items
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {/* Totals */}
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discountPercent > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({invoice.discountPercent}%)</span>
                    <span>-{formatCurrency(invoice.discountAmount || 0)}</span>
                  </div>
                )}
                {invoice.taxPercent > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tax ({invoice.taxPercent}%)</span>
                    <span>{formatCurrency(invoice.taxAmount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.grandTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          {editMode && canEdit ? (
            <div className="space-y-4">
              <div>
                <Label>Payment Terms</Label>
                <Textarea
                  className="mt-2"
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Net 30, Payment due upon receipt..."
                />
              </div>
              <div>
                <Label>Notes for Client</Label>
                <Textarea
                  className="mt-2"
                  value={formData.clientNotes}
                  onChange={(e) => setFormData({ ...formData, clientNotes: e.target.value })}
                  placeholder="Thank you for your business..."
                />
              </div>
              <div>
                <Label>Internal Notes</Label>
                <Textarea
                  className="mt-2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Internal notes (not visible to client)..."
                />
              </div>
            </div>
          ) : (
            <>
              {invoice.terms && (
                <div>
                  <Label className="text-slate-500">Payment Terms</Label>
                  <p className="mt-1">{invoice.terms}</p>
                </div>
              )}
              {invoice.clientNotes && (
                <div>
                  <Label className="text-slate-500">Notes for Client</Label>
                  <p className="mt-1">{invoice.clientNotes}</p>
                </div>
              )}
            </>
          )}

          {/* Void Confirmation */}
          {showVoidConfirm && (
            <Card className="border-2 border-rose-300 bg-rose-50 dark:bg-rose-900/20">
              <CardContent className="pt-4">
                <p className="font-medium text-rose-700 mb-2">Void this invoice?</p>
                <p className="text-sm text-slate-600 mb-3">This will unlock any linked timesheets and mark the invoice as void.</p>
                <div className="space-y-2">
                  <Label>Reason (optional)</Label>
                  <Input
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    placeholder="Reason for voiding..."
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setShowVoidConfirm(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      onVoid(voidReason || undefined);
                      setShowVoidConfirm(false);
                    }}
                  >
                    Confirm Void
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2">
          {editMode ? (
            <>
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <>
              <div className="flex-1 flex gap-2">
                {canApprove && (
                  <Button variant="outline" onClick={onApprove}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                )}
                {canSend && (
                  <Button variant="outline" onClick={onSend}>
                    <Send className="w-4 h-4 mr-2" />
                    Mark as Sent
                  </Button>
                )}
                {canRecordPayment && (
                  <Button variant="outline" onClick={onRecordPayment}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Record Payment
                  </Button>
                )}
                {canVoid && !showVoidConfirm && (
                  <Button variant="outline" className="text-rose-600" onClick={() => setShowVoidConfirm(true)}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Void
                  </Button>
                )}
              </div>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

