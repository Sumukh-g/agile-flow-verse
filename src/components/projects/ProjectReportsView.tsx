import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import {
    BarChart3,
    Calendar,
    Clock,
    Download,
    Eye,
    FileText,
    Filter,
    LineChart,
    Mail,
    PieChart,
    Plus,
    Search,
    Settings,
    Share,
    TrendingDown,
    TrendingUp,
    Users,
    Trash2,
    Copy
} from 'lucide-react';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useBurndownReport, useVelocityReport, useCapacityReport, useTimeTrackingReport, useProjectSummaryReport } from '@/hooks/useReports';
import { useProjectAnalytics } from '@/hooks/useAnalytics';
import ReportEmailDialog from './ReportEmailDialog';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { api } from '@/lib/api';
import { format } from 'date-fns';

interface ProjectReportsViewProps {
  projectId: string | undefined;
}

interface CustomReport {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  dataSource: string;
  status: 'active' | 'draft' | 'archived';
  createdBy: string;
  createdDate: string;
  lastUpdated: string;
  views: number;
  exports: number;
  isScheduled: boolean;
  frequency?: string;
  nextRun?: string;
  recipients?: string[];
  reportData?: any; // The actual generated report data
}

interface CreateReportFormProps {
  reportTitle: string;
  reportDescription: string;
  reportCategory: string;
  reportType: string;
  reportDataSource: string;
  isScheduled: boolean;
  reportFrequency: string;
  reportRecipients: string;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onCategoryChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onDataSourceChange: (value: string) => void;
  onScheduledChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFrequencyChange: (value: string) => void;
  onRecipientsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onCreate: () => void;
}

// Extract form as separate component to prevent re-renders
const CreateReportFormComponent: React.FC<CreateReportFormProps> = React.memo(({
  reportTitle,
  reportDescription,
  reportCategory,
  reportType,
  reportDataSource,
  isScheduled,
  reportFrequency,
  reportRecipients,
  onTitleChange,
  onDescriptionChange,
  onCategoryChange,
  onTypeChange,
  onDataSourceChange,
  onScheduledChange,
  onFrequencyChange,
  onRecipientsChange,
  onCancel,
  onCreate
}) => (
    <div className="space-y-4">
      <div>
      <Label htmlFor="reportTitle">Report Title *</Label>
      <Input 
        id="reportTitle" 
        placeholder="Enter report title" 
        value={reportTitle}
        onChange={onTitleChange}
      />
      </div>
      <div>
        <Label htmlFor="reportDescription">Description</Label>
      <Textarea 
        id="reportDescription" 
        placeholder="Describe the report purpose and content..." 
        value={reportDescription}
        onChange={onDescriptionChange}
      />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
        <Label htmlFor="category">Category *</Label>
        <Select value={reportCategory} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tasks">Tasks & Issues</SelectItem>
              <SelectItem value="time">Time Tracking</SelectItem>
              <SelectItem value="budget">Budget & Finance</SelectItem>
              <SelectItem value="team">Team Performance</SelectItem>
              <SelectItem value="approvals">Approvals</SelectItem>
              <SelectItem value="overall">Overall Project</SelectItem>
              <SelectItem value="performance">Performance Metrics</SelectItem>
              <SelectItem value="quality">Quality & Bugs</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
        <Label htmlFor="type">Report Type *</Label>
        <Select value={reportType} onValueChange={onTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="table">Table (Detailed Data)</SelectItem>
              <SelectItem value="document">Document (Summary Report)</SelectItem>
              <SelectItem value="chart">Chart (Visual Analytics)</SelectItem>
              <SelectItem value="dashboard">Dashboard (Overview)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="dataSource">Data Source</Label>
      <Select value={reportDataSource} onValueChange={onDataSourceChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select data source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overall">Overall Project (All Data)</SelectItem>
            <SelectItem value="tasks">Tasks & Issues</SelectItem>
            <SelectItem value="time">Time Tracking</SelectItem>
            <SelectItem value="budget">Budget & Finance</SelectItem>
            <SelectItem value="team">Team Performance</SelectItem>
            <SelectItem value="approvals">Approvals</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          id="scheduled" 
          checked={isScheduled}
          onChange={onScheduledChange}
          className="rounded"
        />
          <Label htmlFor="scheduled">Schedule automatic generation</Label>
        </div>
      {isScheduled && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="frequency">Frequency</Label>
            <Select value={reportFrequency} onValueChange={onFrequencyChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="recipients">Recipients</Label>
            <Input 
              id="recipients" 
              placeholder="email1@example.com, email2@example.com" 
              value={reportRecipients}
              onChange={onRecipientsChange}
            />
          </div>
        </div>
      )}
      </div>
      <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={onCancel}>Cancel</Button>
      <Button onClick={onCreate}>Create Report</Button>
      </div>
    </div>
));

const STORAGE_KEY = 'project_reports';

const ProjectReportsView: React.FC<ProjectReportsViewProps> = ({ projectId }) => {
  const [reports, setReports] = useState<CustomReport[]>([]);
  const [dashboardData, setDashboardData] = useState<any>({
    projectHealth: { score: 0, trend: 'neutral', change: 0 },
    tasksCompleted: { total: 0, thisWeek: 0, trend: 'neutral', change: 0 },
    teamEfficiency: { score: 0, trend: 'neutral', change: 0 },
    timeTracking: { totalHours: 0, thisWeek: 0, overtime: 0 },
    budgetUtilization: { percentage: 0, spent: '$0.00', remaining: '$0.00' },
    qualityMetrics: { bugRate: null, testCoverage: null, codeReview: null }
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState("last_30_days");
  const [activeTab, setActiveTab] = useState("overview");
  const [isCreateReportOpen, setIsCreateReportOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CustomReport | null>(null);
  const [isReportDetailsOpen, setIsReportDetailsOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  
  // Create Report Form State
  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportCategory, setReportCategory] = useState("");
  const [reportType, setReportType] = useState("");
  const [reportDataSource, setReportDataSource] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [reportFrequency, setReportFrequency] = useState("");
  const [reportRecipients, setReportRecipients] = useState("");

  // Load reports from localStorage on mount
  useEffect(() => {
    if (projectId) {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${projectId}`);
      if (stored) {
        try {
          setReports(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to load reports:', e);
        }
      }
    }
  }, [projectId]);

  // Save reports to localStorage
  const saveReports = (newReports: CustomReport[]) => {
    if (projectId) {
      localStorage.setItem(`${STORAGE_KEY}_${projectId}`, JSON.stringify(newReports));
      setReports(newReports);
    }
  };

  // Compute date range based on selection
  const range = useMemo(() => {
    const end = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case 'last_7_days':
        start.setDate(end.getDate() - 7);
        break;
      case 'last_30_days':
        start.setDate(end.getDate() - 30);
        break;
      case 'last_90_days':
        start.setDate(end.getDate() - 90);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }
    
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    return { start: iso(start), end: iso(end) };
  }, [dateRange]);

  const { data: burndownData, isLoading: burndownLoading } = useBurndownReport(projectId, range.start, range.end, 'day');
  const { data: velocityData, isLoading: velocityLoading } = useVelocityReport(projectId, range.start, range.end);
  const { data: capacityData, isLoading: capacityLoading } = useCapacityReport(projectId, range.start, range.end);
  const { data: timeTrackingData, isLoading: timeTrackingLoading } = useTimeTrackingReport(projectId, range.start, range.end);
  const { data: projectAnalytics, isLoading: analyticsLoading } = useProjectAnalytics(projectId, range.start, range.end);
  const { data: summaryReport, isLoading: summaryLoading } = useProjectSummaryReport(projectId);
  const summary = summaryReport?.data || summaryReport;

  // Memoize chart data transformations for performance
  const tasksByStatusChartData = useMemo(() => {
    if (!summary?.tasksByStatus) return [];
    return summary.tasksByStatus;
  }, [summary?.tasksByStatus]);

  const createdVsCompletedChartData = useMemo(() => {
    if (!summary?.createdVsCompleted) return [];
    return summary.createdVsCompleted.map((item: any) => ({
      week: format(new Date(item.week), 'MMM dd'),
      created: item.created,
      completed: item.completed
    }));
  }, [summary?.createdVsCompleted]);

  const workloadByAssigneeChartData = useMemo(() => {
    if (!summary?.workloadByAssignee) return [];
    return summary.workloadByAssignee;
  }, [summary?.workloadByAssignee]);

  // Extract data from API responses
  const burndown = burndownData?.data || burndownData || [];
  const velocity = velocityData?.data || velocityData || [];
  const capacity = capacityData?.data || capacityData || [];
  const timeTracking = timeTrackingData?.data || timeTrackingData || {};
  const analytics = projectAnalytics?.data || projectAnalytics || {};

  useEffect(() => {
    // Calculate dashboard metrics from real backend reports
    const remaining = Array.isArray(burndown) && burndown.length ? burndown[burndown.length - 1]?.remaining ?? 0 : 0;
    const completedTasks = Array.isArray(velocity) ? velocity.reduce((s: number, v: any) => s + (v.completed || 0), 0) : 0;
    const avgUtilization = Array.isArray(capacity) && capacity.length
      ? Math.round(capacity.reduce((s: number, c: any) => s + (c.utilization || 0), 0) / capacity.length)
      : 0;

    // Calculate this week's tasks
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);
    const thisWeekTasks = Array.isArray(velocity) 
      ? velocity.filter((v: any) => {
          const vDate = v.date ? new Date(v.date) : null;
          return vDate && vDate >= thisWeekStart;
        }).reduce((s: number, v: any) => s + (v.completed || 0), 0)
      : 0;

    // Extract time tracking data from backend response
    const timeTrackingSummary = timeTracking?.summary || {};
    const totalHours = timeTrackingSummary?.totalHours || 0;
    
    // Calculate this week's hours from time tracking byDate
    const thisWeekHours = timeTracking?.byDate ? Object.keys(timeTracking.byDate)
      .filter(dateStr => {
        const date = new Date(dateStr);
        return date >= thisWeekStart;
      })
      .reduce((sum, dateStr) => {
        const entries = timeTracking.byDate[dateStr] || [];
        return sum + entries.reduce((entrySum: number, entry: any) => entrySum + (entry.hours || 0), 0);
      }, 0) : 0;

    // Extract budget data from analytics
    const budget = analytics?.project?.budget || 0;
    const spent = analytics?.project?.spent || 0;
    const budgetPercentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;
    const remainingBudget = Math.max(0, budget - spent);

    setDashboardData({
      projectHealth: { 
        score: Math.max(0, Math.min(100, 100 - remaining)), 
        trend: remaining < 10 ? 'up' : remaining > 50 ? 'down' : 'neutral', 
        change: remaining 
      },
      tasksCompleted: { 
        total: completedTasks, 
        thisWeek: thisWeekTasks, 
        trend: thisWeekTasks > 0 ? 'up' : 'neutral', 
        change: thisWeekTasks 
      },
      teamEfficiency: { 
        score: avgUtilization, 
        trend: avgUtilization > 80 ? 'up' : avgUtilization < 50 ? 'down' : 'neutral', 
        change: avgUtilization 
      },
      timeTracking: {
        totalHours,
        thisWeek: thisWeekHours,
        overtime: 0 // Calculate overtime if needed from timesheet data
      },
      budgetUtilization: {
        percentage: budgetPercentage,
        spent: budget > 0 ? `$${(spent / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00',
        remaining: budget > 0 ? `$${(remainingBudget / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'
      },
      // Quality metrics not available in backend - remove or show as N/A
      qualityMetrics: {
        bugRate: null,
        testCoverage: null,
        codeReview: null
      }
    });
  }, [burndown, velocity, capacity, timeTracking, analytics]);

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || report.category.toLowerCase() === categoryFilter.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'performance': return 'bg-blue-100 text-blue-800';
      case 'time': return 'bg-purple-100 text-purple-800';
      case 'finance': return 'bg-green-100 text-green-800';
      case 'team': return 'bg-orange-100 text-orange-800';
      case 'risk': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'dashboard': return <BarChart3 className="h-4 w-4" />;
      case 'chart': return <LineChart className="h-4 w-4" />;
      case 'table': return <FileText className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleCreateReport = useCallback(async () => {
    if (!reportTitle.trim()) {
      toast.error('Please enter a report title');
      return;
    }
    if (!reportCategory) {
      toast.error('Please select a category');
      return;
    }
    if (!reportType) {
      toast.error('Please select a report type');
      return;
    }
    if (!projectId) {
      toast.error('Project ID is required');
      return;
    }

    try {
      toast.loading('Generating report...', { id: 'generate-report' });

      // Determine what to include based on category and data source
      // Category can override data source for better UX
      const finalDataSource = reportDataSource || reportCategory || 'overall';
      
      const includeTasks = finalDataSource === 'tasks' || finalDataSource === 'overall' || reportCategory === 'tasks';
      const includeIssues = finalDataSource === 'tasks' || finalDataSource === 'overall' || reportCategory === 'tasks';
      const includeApprovals = finalDataSource === 'approvals' || finalDataSource === 'overall' || reportCategory === 'approvals';
      const includeTeam = finalDataSource === 'team' || finalDataSource === 'overall' || reportCategory === 'team';
      const includeBudget = finalDataSource === 'budget' || finalDataSource === 'overall' || reportCategory === 'budget';
      const includeTimeTracking = finalDataSource === 'time' || finalDataSource === 'overall' || reportCategory === 'time';

      // Generate comprehensive report
      const reportDataResponse = await api.reports.generateComprehensiveReport(projectId, {
        category: reportCategory,
        type: reportType,
        dataSource: finalDataSource,
        includeTasks,
        includeIssues,
        includeApprovals,
        includeTeam,
        includeBudget,
        includeTimeTracking,
      });

      const reportData = reportDataResponse?.data || reportDataResponse;

      const newReport: CustomReport = {
        id: `report_${Date.now()}`,
        title: reportTitle,
        description: reportDescription,
        category: reportCategory,
        type: reportType,
        dataSource: reportDataSource || 'overall',
        status: 'active',
        createdBy: 'Current User', // In real app, get from auth context
        createdDate: format(new Date(), 'MMM dd, yyyy'),
        lastUpdated: format(new Date(), 'MMM dd, yyyy'),
        views: 0,
        exports: 0,
        isScheduled: isScheduled,
        frequency: reportFrequency || undefined,
        nextRun: isScheduled ? format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'MMM dd, yyyy') : undefined,
        recipients: reportRecipients ? reportRecipients.split(',').map(r => r.trim()) : [],
        reportData, // Store the actual generated report data
      };

      const updatedReports = [...reports, newReport];
      saveReports(updatedReports);
      
      toast.success('Report generated successfully!', { id: 'generate-report' });
      
      // Reset form
      setReportTitle("");
      setReportDescription("");
      setReportCategory("");
      setReportType("");
      setReportDataSource("");
      setIsScheduled(false);
      setReportFrequency("");
      setReportRecipients("");
      setIsCreateReportOpen(false);

      // Automatically open the report view
      setSelectedReport(newReport);
      setIsReportDetailsOpen(true);
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error(`Failed to generate report: ${error?.response?.data?.message || error.message}`, { id: 'generate-report' });
    }
  }, [reportTitle, reportDescription, reportCategory, reportType, reportDataSource, isScheduled, reportFrequency, reportRecipients, reports, saveReports, projectId]);

  const handleDeleteReport = (reportId: string) => {
    const updatedReports = reports.filter(r => r.id !== reportId);
    saveReports(updatedReports);
    toast.success('Report deleted successfully');
    if (selectedReport?.id === reportId) {
      setIsReportDetailsOpen(false);
      setSelectedReport(null);
    }
  };

  const handleDuplicateReport = (report: CustomReport) => {
    const duplicatedReport: CustomReport = {
      ...report,
      id: `report_${Date.now()}`,
      title: `${report.title} (Copy)`,
      createdDate: format(new Date(), 'MMM dd, yyyy'),
      lastUpdated: format(new Date(), 'MMM dd, yyyy'),
      views: 0,
      exports: 0
    };
    const updatedReports = [...reports, duplicatedReport];
    saveReports(updatedReports);
    toast.success('Report duplicated successfully!');
  };

  const handleViewReport = (report: CustomReport) => {
    const updatedReports = reports.map(r => 
      r.id === report.id ? { ...r, views: r.views + 1 } : r
    );
    saveReports(updatedReports);
    setSelectedReport({ ...report, views: report.views + 1 });
    setIsReportDetailsOpen(true);
  };

  const handleExportReport = async (report: CustomReport, exportFormat: 'csv' | 'json' | 'pdf' = 'csv') => {
    try {
      if (!report.reportData) {
        toast.error('No report data available to export. Please regenerate the report.');
        return;
      }

      const reportData = report.reportData;
      const fileName = `${report.title.replace(/[^a-z0-9]/gi, '_')}_${format(new Date(), 'yyyy-MM-dd')}`;

      // Format date helper (used in both PDF and CSV exports)
      const formatDate = (dateStr: string | Date, formatStr: string) => {
        try {
          const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
          return format(date, formatStr);
        } catch {
          return String(dateStr);
        }
      };

      if (exportFormat === 'pdf') {
        // Use browser's print to PDF functionality
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          toast.error('Please allow popups to export PDF');
          return;
        }

        const generatedDate = formatDate(reportData.generatedAt, 'MMMM dd, yyyy HH:mm');

        // Create comprehensive HTML content for PDF
        let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>${report.title}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6; }
    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
    h2 { color: #1e40af; margin-top: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
    h3 { color: #374151; margin-top: 20px; font-size: 16px; }
    .metadata { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .metadata p { margin: 5px 0; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
    .summary-card { background: #f3f4f6; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
    .summary-card h3 { margin: 0 0 10px 0; font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
    .summary-card .value { font-size: 28px; font-weight: bold; color: #111827; }
    .summary-card .subtext { font-size: 11px; color: #6b7280; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; page-break-inside: avoid; font-size: 12px; }
    th, td { padding: 10px; text-align: left; border: 1px solid #e5e7eb; }
    th { background-color: #f9fafb; font-weight: 600; color: #374151; }
    tr:nth-child(even) { background-color: #f9fafb; }
    .section { margin: 30px 0; page-break-inside: avoid; }
    .section-header { background: #f3f4f6; padding: 10px; border-radius: 6px; margin-bottom: 15px; }
    @media print {
      .page-break { page-break-after: always; }
      body { padding: 10px; }
    }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  <div class="metadata">
    <p><strong>Project:</strong> ${reportData.project?.name || 'N/A'}</p>
    <p><strong>Description:</strong> ${report.description || 'N/A'}</p>
    <p><strong>Generated:</strong> ${generatedDate}</p>
    <p><strong>Category:</strong> ${report.category} | <strong>Type:</strong> ${report.type} | <strong>Data Source:</strong> ${report.dataSource || 'overall'}</p>
  </div>
`;

        // Add Executive Summary
        if (reportData.summary) {
          htmlContent += `
  <h2>Executive Summary</h2>
  <div class="summary-grid">
    <div class="summary-card">
      <h3>Total Tasks</h3>
      <div class="value">${reportData.summary.totalTasks || 0}</div>
      <div class="subtext">${reportData.summary.completedTasks || 0} completed</div>
    </div>
    <div class="summary-card">
      <h3>Open Tasks</h3>
      <div class="value">${reportData.summary.openTasks || 0}</div>
    </div>
    ${reportData.summary.totalIssues !== undefined ? `
    <div class="summary-card">
      <h3>Total Issues</h3>
      <div class="value">${reportData.summary.totalIssues}</div>
      <div class="subtext">${reportData.summary.openIssues || 0} open</div>
    </div>
    ` : ''}
    ${reportData.summary.totalApprovals !== undefined ? `
    <div class="summary-card">
      <h3>Approvals</h3>
      <div class="value">${reportData.summary.totalApprovals}</div>
      <div class="subtext">${reportData.summary.pendingApprovals || 0} pending</div>
    </div>
    ` : ''}
    <div class="summary-card">
      <h3>Team Size</h3>
      <div class="value">${reportData.summary.teamSize || 0}</div>
    </div>
    ${reportData.summary.totalHours > 0 ? `
    <div class="summary-card">
      <h3>Total Hours</h3>
      <div class="value">${reportData.summary.totalHours.toFixed(1)}</div>
    </div>
    ` : ''}
  </div>
  ${reportData.summary.totalBudget > 0 ? `
  <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px;">
    <h3 style="margin-top: 0;">Budget Summary</h3>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
      <div><strong>Allocated:</strong> $${reportData.summary.totalBudget.toLocaleString()}</div>
      <div><strong>Spent:</strong> $${reportData.summary.spentBudget.toLocaleString()}</div>
      <div><strong>Remaining:</strong> $${(reportData.summary.totalBudget - reportData.summary.spentBudget).toLocaleString()}</div>
    </div>
  </div>
  ` : ''}
`;
        }

        // Add Tasks
        if (reportData.tasks && reportData.tasks.details && reportData.tasks.details.length > 0) {
          htmlContent += `
  <div class="section page-break">
    <div class="section-header">
      <h2 style="margin: 0;">Tasks</h2>
      <p style="margin: 5px 0 0 0; color: #6b7280;">Total: ${reportData.tasks.total} | Completed: ${reportData.tasks.completed} | Remaining: ${reportData.tasks.remaining} | In Progress: ${reportData.tasks.inProgress}</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Assignees</th>
          <th>Due Date</th>
          <th>Hours</th>
        </tr>
      </thead>
      <tbody>
        ${reportData.tasks.details.map((task: any) => `
        <tr>
          <td>${(task.title || 'Untitled Task').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
          <td>${task.status || 'N/A'}</td>
          <td>${task.priority || 'N/A'}</td>
          <td>${task.assignees?.map((a: any) => a.name).join(', ') || 'Unassigned'}</td>
          <td>${task.dueDate ? formatDate(task.dueDate, 'MMM dd, yyyy') : 'N/A'}</td>
          <td>${task.actualHours || task.estimatedHours || 'N/A'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
`;
        }

        // Add Issues
        if (reportData.issues && reportData.issues.details && reportData.issues.details.length > 0) {
          htmlContent += `
  <div class="section page-break">
    <div class="section-header">
      <h2 style="margin: 0;">Issues</h2>
      <p style="margin: 5px 0 0 0; color: #6b7280;">Total: ${reportData.issues.total} | Open: ${reportData.issues.open || 0} | Closed: ${reportData.issues.closed || 0}</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Type</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Assignee</th>
          <th>Reporter</th>
        </tr>
      </thead>
      <tbody>
        ${reportData.issues.details.map((issue: any) => `
        <tr>
          <td>${(issue.title || 'Untitled Issue').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
          <td>${issue.type || 'N/A'}</td>
          <td>${issue.status || 'N/A'}</td>
          <td>${issue.priority || 'N/A'}</td>
          <td>${issue.assignee?.name || 'Unassigned'}</td>
          <td>${issue.reporter?.name || 'N/A'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
`;
        }

        // Add Approvals
        if (reportData.approvals && reportData.approvals.details && reportData.approvals.details.length > 0) {
          htmlContent += `
  <div class="section page-break">
    <div class="section-header">
      <h2 style="margin: 0;">Approvals</h2>
      <p style="margin: 5px 0 0 0; color: #6b7280;">Total: ${reportData.approvals.total} | Pending: ${reportData.approvals.pending} | Approved: ${reportData.approvals.approved} | Rejected: ${reportData.approvals.rejected}</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Type</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Requester</th>
          <th>Current Approver</th>
        </tr>
      </thead>
      <tbody>
        ${reportData.approvals.details.map((approval: any) => `
        <tr>
          <td>${(approval.title || 'Untitled Approval').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
          <td>${approval.type || 'N/A'}</td>
          <td>${approval.status || 'N/A'}</td>
          <td>${approval.priority || 'N/A'}</td>
          <td>${approval.requester || 'N/A'}</td>
          <td>${approval.currentApprover || 'N/A'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
`;
        }

        // Add Team
        if (reportData.team && reportData.team.members && reportData.team.members.length > 0) {
          htmlContent += `
  <div class="section page-break">
    <div class="section-header">
      <h2 style="margin: 0;">Team</h2>
      <p style="margin: 5px 0 0 0; color: #6b7280;">Total Members: ${reportData.team.totalMembers}</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Joined</th>
        </tr>
      </thead>
      <tbody>
        ${reportData.team.members.map((member: any) => `
        <tr>
          <td>${member.name || 'N/A'}</td>
          <td>${member.email || 'N/A'}</td>
          <td>${member.role || 'N/A'}</td>
          <td>${formatDate(member.joinedAt, 'MMM dd, yyyy')}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
`;
        }

        // Add Budget
        if (reportData.budget) {
          htmlContent += `
  <div class="section">
    <div class="section-header">
      <h2 style="margin: 0;">Budget & Finance</h2>
    </div>
    <div class="summary-grid">
      <div class="summary-card">
        <h3>Allocated</h3>
        <div class="value">$${reportData.budget.allocated?.toLocaleString() || '0'}</div>
      </div>
      <div class="summary-card">
        <h3>Spent</h3>
        <div class="value">$${reportData.budget.spent?.toLocaleString() || '0'}</div>
      </div>
      <div class="summary-card">
        <h3>Remaining</h3>
        <div class="value">$${reportData.budget.remaining?.toLocaleString() || '0'}</div>
      </div>
    </div>
    <p style="margin-top: 15px;"><strong>Utilization:</strong> ${reportData.budget.utilization?.toFixed(1) || '0'}%</p>
    ${reportData.budget.timeTracking ? `
    <p><strong>Time Tracking:</strong> ${reportData.budget.timeTracking.totalHours} hours | Cost: $${reportData.budget.timeTracking.totalCost?.toLocaleString() || '0'}</p>
    ` : ''}
  </div>
`;
        }

        // Add Time Tracking
        if (reportData.timeTracking && reportData.timeTracking.recentEntries && reportData.timeTracking.recentEntries.length > 0) {
          htmlContent += `
  <div class="section page-break">
    <div class="section-header">
      <h2 style="margin: 0;">Time Tracking</h2>
      <p style="margin: 5px 0 0 0; color: #6b7280;">Total Hours: ${reportData.timeTracking.totalHours} | Total Entries: ${reportData.timeTracking.totalEntries}</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>User</th>
          <th>Task</th>
          <th>Hours</th>
        </tr>
      </thead>
      <tbody>
        ${reportData.timeTracking.recentEntries.map((entry: any) => `
        <tr>
          <td>${formatDate(entry.date, 'MMM dd, yyyy')}</td>
          <td>${entry.user?.name || 'N/A'}</td>
          <td>${(entry.task?.title || 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
          <td>${entry.hours}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
`;
        }

        // Add Notes
        if (reportData.notes && reportData.notes.details && reportData.notes.details.length > 0) {
          htmlContent += `
  <div class="section page-break">
    <div class="section-header">
      <h2 style="margin: 0;">Notes (${reportData.notes.total})</h2>
    </div>
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Type</th>
          <th>Created</th>
          <th>Updated</th>
        </tr>
      </thead>
      <tbody>
        ${reportData.notes.details.map((note: any) => `
        <tr>
          <td>${(note.title || 'Untitled').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
          <td>${note.type || 'note'}</td>
          <td>${formatDate(note.createdAt, 'MMM dd, yyyy')}</td>
          <td>${formatDate(note.updatedAt, 'MMM dd, yyyy')}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
`;
        }

        // Add Attachments
        if (reportData.attachments && reportData.attachments.details && reportData.attachments.details.length > 0) {
          htmlContent += `
  <div class="section page-break">
    <div class="section-header">
      <h2 style="margin: 0;">Attachments (${reportData.attachments.total})</h2>
      <p style="margin: 5px 0 0 0; color: #6b7280;">Total Size: ${reportData.attachments.totalSizeMB} MB</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>Filename</th>
          <th>Type</th>
          <th>Size</th>
          <th>Uploaded By</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${reportData.attachments.details.map((att: any) => `
        <tr>
          <td>${(att.filename || 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
          <td>${att.mimeType || 'N/A'}</td>
          <td>${(att.sizeBytes / 1024).toFixed(2)} KB</td>
          <td>${att.uploadedBy?.name || 'N/A'}</td>
          <td>${formatDate(att.createdAt, 'MMM dd, yyyy')}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
`;
        }

        // Add Board
        if (reportData.board && reportData.board.columns && reportData.board.columns.length > 0) {
          htmlContent += `
  <div class="section">
    <div class="section-header">
      <h2 style="margin: 0;">Board / List View</h2>
      <p style="margin: 5px 0 0 0; color: #6b7280;">Total Tasks: ${reportData.board.totalTasks}</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>Status</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>
        ${reportData.board.columns.map((col: any) => `
        <tr>
          <td>${col.status || 'Unknown'}</td>
          <td>${col.count}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
`;
        }

        // Add Calendar
        if (reportData.calendar) {
          htmlContent += `
  <div class="section page-break">
    <div class="section-header">
      <h2 style="margin: 0;">Calendar</h2>
      <p style="margin: 5px 0 0 0; color: #6b7280;">Total: ${reportData.calendar.totalTasksWithDueDates} | Upcoming: ${reportData.calendar.upcoming} | Overdue: ${reportData.calendar.overdue}</p>
    </div>
    ${reportData.calendar.overdueTasks && reportData.calendar.overdueTasks.length > 0 ? `
    <h3>Overdue Tasks</h3>
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Due Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${reportData.calendar.overdueTasks.map((task: any) => `
        <tr>
          <td>${(task.title || 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
          <td>${formatDate(task.dueDate, 'MMM dd, yyyy')}</td>
          <td>${task.status || 'N/A'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}
  </div>
`;
        }

        // Add Timeline
        if (reportData.timeline && reportData.timeline.byMonth) {
          htmlContent += `
  <div class="section">
    <div class="section-header">
      <h2 style="margin: 0;">Timeline</h2>
      <p style="margin: 5px 0 0 0; color: #6b7280;">Total Tasks: ${reportData.timeline.totalTasks}</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>Month</th>
          <th>Tasks Created</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(reportData.timeline.byMonth).map(([month, count]: [string, any]) => `
        <tr>
          <td>${new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</td>
          <td>${count}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
`;
        }

        htmlContent += `
</body>
</html>
`;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load, then trigger print
        setTimeout(() => {
          printWindow.print();
        }, 250);

        toast.success('PDF export initiated - use your browser\'s print dialog to save as PDF');
      } else if (exportFormat === 'csv') {
        // Export as CSV
        const csvRows: string[] = [];
        
        // Add summary
        csvRows.push('Section,Field,Value');
        if (reportData.summary) {
          csvRows.push(`Summary,Total Tasks,${reportData.summary.totalTasks || 0}`);
          csvRows.push(`Summary,Completed Tasks,${reportData.summary.completedTasks || 0}`);
          csvRows.push(`Summary,Open Tasks,${reportData.summary.openTasks || 0}`);
          if (reportData.summary.totalIssues !== undefined) {
            csvRows.push(`Summary,Total Issues,${reportData.summary.totalIssues}`);
            csvRows.push(`Summary,Open Issues,${reportData.summary.openIssues || 0}`);
          }
          if (reportData.summary.totalApprovals !== undefined) {
            csvRows.push(`Summary,Total Approvals,${reportData.summary.totalApprovals}`);
            csvRows.push(`Summary,Pending Approvals,${reportData.summary.pendingApprovals || 0}`);
          }
          csvRows.push(`Summary,Team Size,${reportData.summary.teamSize || 0}`);
          csvRows.push(`Summary,Total Hours,${reportData.summary.totalHours || 0}`);
        }
        
        // Add tasks
        if (reportData.tasks && reportData.tasks.details && reportData.tasks.details.length > 0) {
          csvRows.push('');
          csvRows.push('Tasks');
          csvRows.push('Title,Status,Priority,Assignees,Due Date,Estimated Hours,Actual Hours');
          reportData.tasks.details.forEach((task: any) => {
            csvRows.push([
              `"${(task.title || '').replace(/"/g, '""')}"`,
              task.status || '',
              task.priority || '',
              `"${(task.assignees?.map((a: any) => a.name).join(', ') || 'Unassigned').replace(/"/g, '""')}"`,
              task.dueDate ? formatDate(task.dueDate, 'yyyy-MM-dd') : '',
              task.estimatedHours || '',
              task.actualHours || ''
            ].join(','));
          });
        }
        
        // Add issues
        if (reportData.issues && reportData.issues.details && reportData.issues.details.length > 0) {
          csvRows.push('');
          csvRows.push('Issues');
          csvRows.push('Title,Type,Status,Priority,Assignee,Reporter');
          reportData.issues.details.forEach((issue: any) => {
            csvRows.push([
              `"${(issue.title || '').replace(/"/g, '""')}"`,
              issue.type || '',
              issue.status || '',
              issue.priority || '',
              issue.assignee?.name || 'Unassigned',
              issue.reporter?.name || ''
            ].join(','));
          });
        }
        
        // Add approvals
        if (reportData.approvals && reportData.approvals.details && reportData.approvals.details.length > 0) {
          csvRows.push('');
          csvRows.push('Approvals');
          csvRows.push('Title,Type,Status,Priority,Requester,Current Approver');
          reportData.approvals.details.forEach((approval: any) => {
            csvRows.push([
              `"${(approval.title || '').replace(/"/g, '""')}"`,
              approval.type || '',
              approval.status || '',
              approval.priority || '',
              approval.requester || '',
              approval.currentApprover || ''
            ].join(','));
          });
        }
        
        // Add team
        if (reportData.team && reportData.team.members && reportData.team.members.length > 0) {
          csvRows.push('');
          csvRows.push('Team');
          csvRows.push('Name,Email,Role,Joined');
          reportData.team.members.forEach((member: any) => {
            csvRows.push([
              `"${(member.name || '').replace(/"/g, '""')}"`,
              member.email || '',
              member.role || '',
              formatDate(member.joinedAt, 'yyyy-MM-dd')
            ].join(','));
          });
        }
        
        // Add notes
        if (reportData.notes && reportData.notes.details && reportData.notes.details.length > 0) {
          csvRows.push('');
          csvRows.push('Notes');
          csvRows.push('Title,Type,Created,Updated');
          reportData.notes.details.forEach((note: any) => {
            csvRows.push([
              `"${(note.title || '').replace(/"/g, '""')}"`,
              note.type || 'note',
              formatDate(note.createdAt, 'yyyy-MM-dd'),
              formatDate(note.updatedAt, 'yyyy-MM-dd')
            ].join(','));
          });
        }
        
        // Add attachments
        if (reportData.attachments && reportData.attachments.details && reportData.attachments.details.length > 0) {
          csvRows.push('');
          csvRows.push('Attachments');
          csvRows.push('Filename,Type,Size (KB),Uploaded By,Date');
          reportData.attachments.details.forEach((att: any) => {
            csvRows.push([
              `"${(att.filename || '').replace(/"/g, '""')}"`,
              att.mimeType || '',
              (att.sizeBytes / 1024).toFixed(2),
              att.uploadedBy?.name || '',
              formatDate(att.createdAt, 'yyyy-MM-dd')
            ].join(','));
          });
        }
        
        // Add board
        if (reportData.board && reportData.board.columns && reportData.board.columns.length > 0) {
          csvRows.push('');
          csvRows.push('Board');
          csvRows.push('Status,Count');
          reportData.board.columns.forEach((col: any) => {
            csvRows.push([
              col.status || 'Unknown',
              col.count
            ].join(','));
          });
        }
        
        // Add calendar
        if (reportData.calendar && reportData.calendar.overdueTasks && reportData.calendar.overdueTasks.length > 0) {
          csvRows.push('');
          csvRows.push('Calendar - Overdue Tasks');
          csvRows.push('Title,Due Date,Status');
          reportData.calendar.overdueTasks.forEach((task: any) => {
            csvRows.push([
              `"${(task.title || '').replace(/"/g, '""')}"`,
              formatDate(task.dueDate, 'yyyy-MM-dd'),
              task.status || ''
            ].join(','));
          });
        }
        
        // Add timeline
        if (reportData.timeline && reportData.timeline.byMonth) {
          csvRows.push('');
          csvRows.push('Timeline');
          csvRows.push('Month,Tasks Created');
          Object.entries(reportData.timeline.byMonth).forEach(([month, count]: [string, any]) => {
            csvRows.push([
              month,
              count
            ].join(','));
          });
        }
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else if (exportFormat === 'json') {
        // Export as JSON
        const jsonContent = JSON.stringify(reportData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      // Update export count
      const updatedReports = reports.map(r => 
        r.id === report.id ? { ...r, exports: r.exports + 1 } : r
      );
      saveReports(updatedReports);
      toast.success(`Report exported as ${exportFormat.toUpperCase()}`);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(`Failed to export report: ${error?.response?.data?.message || error.message}`);
    }
  };

  const handleShareReport = (report: CustomReport) => {
    const shareUrl = `${window.location.origin}/projects/${projectId}/reports/${report.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: report.title,
        text: report.description,
        url: shareUrl
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareUrl);
        toast.success('Report link copied to clipboard!');
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Report link copied to clipboard!');
    }
  };

  // Prepare chart data
  const burndownChartData = Array.isArray(burndown) ? burndown.map((item: any) => ({
    date: item.date ? format(new Date(item.date), 'MMM dd') : '',
    planned: item.planned || 0,
    actual: item.actual || 0,
    ideal: item.ideal || 0,
    remaining: item.remaining || 0
  })) : [];

  const velocityChartData = Array.isArray(velocity) ? velocity.map((item: any) => ({
    sprint: item.sprint || item.date || '',
    completed: item.completed || 0,
    planned: item.planned || 0
  })) : [];

  const capacityChartData = Array.isArray(capacity) ? capacity.map((item: any) => ({
    name: item.userName || item.user || 'User',
    utilization: item.utilization || 0,
    assigned: item.assignedHours || 0,
    available: item.availableHours || 0
  })) : [];

  // Memoize handlers to prevent re-renders
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setReportTitle(e.target.value);
  }, []);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReportDescription(e.target.value);
  }, []);

  const handleRecipientsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setReportRecipients(e.target.value);
  }, []);

  const handleScheduledChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIsScheduled(e.target.checked);
  }, []);

  const handleCancel = useCallback(() => {
    setIsCreateReportOpen(false);
    // Reset form
    setReportTitle("");
    setReportDescription("");
    setReportCategory("");
    setReportType("");
    setReportDataSource("");
    setIsScheduled(false);
    setReportFrequency("");
    setReportRecipients("");
  }, []);


  const MetricCard = ({ title, value, subtitle, trend, change, icon }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            {icon}
            {trend && (
              <div className={`flex items-center gap-1 text-sm ${
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : 
                 trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
                <span>{change}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ReportCard = ({ report }: { report: CustomReport }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getTypeIcon(report.type)}
            <h3 className="font-semibold">{report.title}</h3>
          </div>
          <Badge className={getStatusColor(report.status)}>
            {report.status}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {report.description}
        </p>
        
        <div className="flex items-center gap-2 mb-3">
          <Badge className={getCategoryColor(report.category)}>
            {report.category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {report.type}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{report.createdBy}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{report.createdDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{report.views} views</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-3 w-3" />
            <span>{report.exports} exports</span>
          </div>
        </div>
        
        {report.isScheduled && (
          <div className="p-2 bg-blue-50 rounded-lg mb-3">
            <div className="flex items-center gap-1 text-xs text-blue-700">
              <Clock className="h-3 w-3" />
              <span>Scheduled {report.frequency} • Next: {report.nextRun}</span>
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center pt-3 border-t">
          <span className="text-xs text-muted-foreground">
            Updated: {report.lastUpdated}
          </span>
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={(e) => {
                e.stopPropagation();
                handleViewReport(report);
              }}
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleExportReport(report, 'csv');
              }}
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleShareReport(report);
              }}
            >
              <Share className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ReportDetails = ({ report }: { report: CustomReport }) => (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {getTypeIcon(report.type)}
            <h3 className="text-xl font-semibold">{report.title}</h3>
            <Badge className={getStatusColor(report.status)}>
              {report.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">{report.description}</p>
          {report.reportData?.project && (
              <div className="mt-2 text-sm text-muted-foreground">
                Project: {report.reportData.project.name} | Generated: {format(new Date(report.reportData.generatedAt), 'MMM dd, yyyy HH:mm')}
              </div>
            )}
        </div>
        <Badge className={getCategoryColor(report.category)}>
          {report.category}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Created by</p>
          <p className="font-medium">{report.createdBy}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Created date</p>
          <p className="font-medium">{report.createdDate}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Views</p>
          <p className="font-medium">{report.views}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Exports</p>
          <p className="font-medium">{report.exports}</p>
        </div>
      </div>
      
      {report.isScheduled && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-2">Scheduling Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Frequency</p>
              <p className="font-medium">{report.frequency}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Next Run</p>
              <p className="font-medium">{report.nextRun}</p>
            </div>
          </div>
        </div>
      )}
      
      {report.recipients && report.recipients.length > 0 && (
      <div>
        <h4 className="font-medium mb-2">Recipients</h4>
        <div className="flex flex-wrap gap-2">
          {report.recipients.map((recipient: string, index: number) => (
            <Badge key={index} variant="secondary">
              {recipient}
            </Badge>
          ))}
        </div>
      </div>
      )}

      {/* Report Data Display */}
      {report.reportData ? (
        <div className="space-y-8">
          {/* Executive Summary */}
          {report.reportData.summary && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl">Executive Summary</CardTitle>
                <CardDescription>Key metrics at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Total Tasks</p>
                    <p className="text-2xl font-bold">{report.reportData.summary.totalTasks || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {report.reportData.summary.completedTasks || 0} completed
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Open Tasks</p>
                    <p className="text-2xl font-bold">{report.reportData.summary.openTasks || 0}</p>
                  </div>
                  {report.reportData.summary.totalIssues !== undefined && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Total Issues</p>
                      <p className="text-2xl font-bold">{report.reportData.summary.totalIssues}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {report.reportData.summary.openIssues || 0} open
                      </p>
                    </div>
                  )}
                  {report.reportData.summary.totalApprovals !== undefined && (
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Approvals</p>
                      <p className="text-2xl font-bold">{report.reportData.summary.totalApprovals}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {report.reportData.summary.pendingApprovals || 0} pending
                      </p>
                    </div>
                  )}
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Team Size</p>
                    <p className="text-2xl font-bold">{report.reportData.summary.teamSize || 0}</p>
                  </div>
                  {report.reportData.summary.totalHours > 0 && (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Total Hours</p>
                      <p className="text-2xl font-bold">{report.reportData.summary.totalHours.toFixed(1)}</p>
                    </div>
                  )}
                </div>
                {report.reportData.summary.totalBudget > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Budget Allocated</p>
                        <p className="text-lg font-semibold">${report.reportData.summary.totalBudget.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Budget Spent</p>
                        <p className="text-lg font-semibold">${report.reportData.summary.spentBudget.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                        <p className="text-lg font-semibold">
                          ${(report.reportData.summary.totalBudget - report.reportData.summary.spentBudget).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Project Overview */}
          {report.reportData.project && (
            <Card>
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-semibold">{report.reportData.project.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Progress</p>
                    <p className="font-semibold">{report.reportData.project.progress}%</p>
                  </div>
                  {report.reportData.project.budget && (
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="font-semibold">${report.reportData.project.budget.toLocaleString()}</p>
                    </div>
                  )}
                  {report.reportData.project.spent !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">Spent</p>
                      <p className="font-semibold">${report.reportData.project.spent.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tasks Section */}
          {report.reportData.tasks && (
            <Card>
              <CardHeader>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>
                  Total: {report.reportData.tasks.total} | 
                  Completed: {report.reportData.tasks.completed} | 
                  Remaining: {report.reportData.tasks.remaining} | 
                  In Progress: {report.reportData.tasks.inProgress}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report.type === 'table' && report.reportData.tasks.details ? (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 font-semibold sticky left-0 bg-muted">Title</th>
                          <th className="text-left p-3 font-semibold">Status</th>
                          <th className="text-left p-3 font-semibold">Priority</th>
                          <th className="text-left p-3 font-semibold">Assignees</th>
                          <th className="text-left p-3 font-semibold">Due Date</th>
                          <th className="text-left p-3 font-semibold">Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.reportData.tasks.details.slice(0, 100).map((task: any) => (
                          <tr key={task.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="p-3 font-medium sticky left-0 bg-background">{task.title || 'Untitled Task'}</td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-xs">{task.status || 'N/A'}</Badge>
                            </td>
                            <td className="p-3">{task.priority || <span className="text-muted-foreground">-</span>}</td>
                            <td className="p-3">
                              {task.assignees && task.assignees.length > 0 
                                ? task.assignees.map((a: any) => a.name).join(', ')
                                : <span className="text-muted-foreground italic">Unassigned</span>}
                            </td>
                            <td className="p-3">
                              {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : <span className="text-muted-foreground">-</span>}
                            </td>
                            <td className="p-3">
                              {task.actualHours || task.estimatedHours || <span className="text-muted-foreground">-</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {report.reportData.tasks.details.length > 100 && (
                      <div className="p-3 bg-muted text-center text-sm text-muted-foreground border-t">
                        Showing first 100 of {report.reportData.tasks.details.length} tasks. Export to PDF/CSV to see all.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(report.reportData.tasks.byStatus || {}).map(([status, count]: [string, any]) => (
                        <div key={status} className="p-3 bg-muted rounded-md">
                          <p className="text-sm text-muted-foreground">{status}</p>
                          <p className="text-2xl font-bold">{count}</p>
                        </div>
                      ))}
                    </div>
                    {report.reportData.tasks.details && report.reportData.tasks.details.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold mb-2">Recent Tasks:</p>
                        <div className="space-y-2">
                          {report.reportData.tasks.details.slice(0, 10).map((task: any) => (
                            <div key={task.id} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span>{task.title}</span>
                              <Badge variant="outline">{task.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Issues Section */}
          {report.reportData.issues && (
            <Card>
              <CardHeader>
                <CardTitle>Issues</CardTitle>
                <CardDescription>
                  Total: {report.reportData.issues.total} | 
                  By Type: {Object.entries(report.reportData.issues.byType || {}).map(([type, count]: [string, any]) => `${type}: ${count}`).join(', ')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report.type === 'table' && report.reportData.issues.details ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Title</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Priority</th>
                          <th className="text-left p-2">Assignee</th>
                          <th className="text-left p-2">Reporter</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.reportData.issues.details.slice(0, 50).map((issue: any) => (
                          <tr key={issue.id} className="border-b">
                            <td className="p-2">{issue.title}</td>
                            <td className="p-2">{issue.type}</td>
                            <td className="p-2">
                              <Badge variant="outline">{issue.status}</Badge>
                            </td>
                            <td className="p-2">{issue.priority}</td>
                            <td className="p-2">{issue.assignee?.name || 'Unassigned'}</td>
                            <td className="p-2">{issue.reporter?.name || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {report.reportData.issues.details.length > 50 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Showing first 50 of {report.reportData.issues.details.length} issues
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(report.reportData.issues.byStatus || {}).map(([status, count]: [string, any]) => (
                        <div key={status} className="p-3 bg-muted rounded-md">
                          <p className="text-sm text-muted-foreground">{status}</p>
                          <p className="text-2xl font-bold">{count}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Approvals Section */}
          {report.reportData.approvals && (
            <Card>
              <CardHeader>
                <CardTitle>Approvals</CardTitle>
                <CardDescription>
                  Total: {report.reportData.approvals.total} | 
                  Pending: {report.reportData.approvals.pending} | 
                  Approved: {report.reportData.approvals.approved} | 
                  Rejected: {report.reportData.approvals.rejected}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report.type === 'table' && report.reportData.approvals.details ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Title</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Priority</th>
                          <th className="text-left p-2">Requester</th>
                          <th className="text-left p-2">Current Approver</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.reportData.approvals.details.map((approval: any) => (
                          <tr key={approval.id} className="border-b">
                            <td className="p-2">{approval.title}</td>
                            <td className="p-2">{approval.type}</td>
                            <td className="p-2">
                              <Badge variant="outline">{approval.status}</Badge>
                            </td>
                            <td className="p-2">{approval.priority}</td>
                            <td className="p-2">{approval.requester || 'N/A'}</td>
                            <td className="p-2">{approval.currentApprover || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {report.reportData.approvals.details?.slice(0, 10).map((approval: any) => (
                      <div key={approval.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span>{approval.title}</span>
                        <Badge variant="outline">{approval.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Team Section */}
          {report.reportData.team && (
            <Card>
              <CardHeader>
                <CardTitle>Team</CardTitle>
                <CardDescription>Total Members: {report.reportData.team.totalMembers}</CardDescription>
              </CardHeader>
              <CardContent>
                {report.type === 'table' && report.reportData.team.members ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Role</th>
                          <th className="text-left p-2">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.reportData.team.members.map((member: any) => (
                          <tr key={member.id} className="border-b">
                            <td className="p-2">{member.name}</td>
                            <td className="p-2">{member.email}</td>
                            <td className="p-2">
                              <Badge variant="outline">{member.role}</Badge>
                            </td>
                            <td className="p-2">
                              {format(new Date(member.joinedAt), 'MMM dd, yyyy')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {report.reportData.team.members?.map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        <Badge variant="outline">{member.role}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Budget Section */}
          {report.reportData.budget && (
            <Card>
              <CardHeader>
                <CardTitle>Budget & Finance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Allocated</p>
                      <p className="text-xl font-bold">${report.reportData.budget.allocated?.toLocaleString() || '0'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Spent</p>
                      <p className="text-xl font-bold">${report.reportData.budget.spent?.toLocaleString() || '0'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className="text-xl font-bold">${report.reportData.budget.remaining?.toLocaleString() || '0'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Utilization</p>
                      <p className="text-xl font-bold">{report.reportData.budget.utilization?.toFixed(1) || '0'}%</p>
                    </div>
                  </div>
                  {report.reportData.budget.timeTracking && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Time Tracking Summary</p>
                      <p className="text-sm">Total Hours: {report.reportData.budget.timeTracking.totalHours}</p>
                      <p className="text-sm">Total Cost: ${report.reportData.budget.timeTracking.totalCost?.toLocaleString() || '0'}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Time Tracking Section */}
          {report.reportData.timeTracking && (
            <Card>
              <CardHeader>
                <CardTitle>Time Tracking</CardTitle>
                <CardDescription>
                  Total Hours: {report.reportData.timeTracking.totalHours} | 
                  Total Entries: {report.reportData.timeTracking.totalEntries}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report.type === 'table' && report.reportData.timeTracking.recentEntries ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Date</th>
                          <th className="text-left p-2">User</th>
                          <th className="text-left p-2">Task</th>
                          <th className="text-left p-2">Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.reportData.timeTracking.recentEntries.map((entry: any, idx: number) => (
                          <tr key={idx} className="border-b">
                            <td className="p-2">{format(new Date(entry.date), 'MMM dd, yyyy')}</td>
                            <td className="p-2">{entry.user?.name || 'N/A'}</td>
                            <td className="p-2">{entry.task?.title || 'N/A'}</td>
                            <td className="p-2">{entry.hours}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {report.reportData.timeTracking.byUser?.slice(0, 10).map((user: any) => (
                      <div key={user.userId} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span>{user.userName}</span>
                        <span className="font-semibold">{user.totalHours} hours</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes Section */}
          {report.reportData.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <CardDescription>
                  Total: {report.reportData.notes.total} notes
                  {report.reportData.notes.byType && Object.keys(report.reportData.notes.byType).length > 0 && (
                    <> | By Type: {Object.entries(report.reportData.notes.byType).map(([type, count]) => `${type}: ${count}`).join(', ')}</>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report.type === 'table' && report.reportData.notes.details ? (
                  <div className="overflow-x-auto border rounded-md">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 font-semibold">Title</th>
                          <th className="text-left p-3 font-semibold">Type</th>
                          <th className="text-left p-3 font-semibold">Created</th>
                          <th className="text-left p-3 font-semibold">Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.reportData.notes.details.map((note: any) => (
                          <tr key={note.id} className="border-b hover:bg-muted/50">
                            <td className="p-3 font-medium">{note.title || 'Untitled'}</td>
                            <td className="p-3"><Badge variant="outline">{note.type || 'note'}</Badge></td>
                            <td className="p-3">{format(new Date(note.createdAt), 'MMM dd, yyyy')}</td>
                            <td className="p-3">{format(new Date(note.updatedAt), 'MMM dd, yyyy')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Notes</p>
                      <p className="text-2xl font-bold">{report.reportData.notes.total}</p>
                    </div>
                    {report.reportData.notes.byType && Object.entries(report.reportData.notes.byType).map(([type, count]: [string, any]) => (
                      <div key={type} className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-muted-foreground capitalize">{type}</p>
                        <p className="text-2xl font-bold">{count}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attachments Section */}
          {report.reportData.attachments && (
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
                <CardDescription>
                  Total: {report.reportData.attachments.total} files | Size: {report.reportData.attachments.totalSizeMB} MB
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report.type === 'table' && report.reportData.attachments.details ? (
                  <div className="overflow-x-auto border rounded-md">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 font-semibold">Filename</th>
                          <th className="text-left p-3 font-semibold">Type</th>
                          <th className="text-left p-3 font-semibold">Size</th>
                          <th className="text-left p-3 font-semibold">Uploaded By</th>
                          <th className="text-left p-3 font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.reportData.attachments.details.map((att: any) => (
                          <tr key={att.id} className="border-b hover:bg-muted/50">
                            <td className="p-3 font-medium">{att.filename}</td>
                            <td className="p-3"><Badge variant="outline">{att.mimeType}</Badge></td>
                            <td className="p-3">{(att.sizeBytes / 1024).toFixed(2)} KB</td>
                            <td className="p-3">{att.uploadedBy?.name || 'N/A'}</td>
                            <td className="p-3">{format(new Date(att.createdAt), 'MMM dd, yyyy')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-indigo-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Files</p>
                        <p className="text-2xl font-bold">{report.reportData.attachments.total}</p>
                      </div>
                      <div className="p-4 bg-indigo-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Size</p>
                        <p className="text-2xl font-bold">{report.reportData.attachments.totalSizeMB} MB</p>
                      </div>
                      {report.reportData.attachments.byType && Object.entries(report.reportData.attachments.byType).slice(0, 2).map(([type, count]: [string, any]) => (
                        <div key={type} className="p-4 bg-indigo-50 rounded-lg">
                          <p className="text-sm text-muted-foreground capitalize">{type}</p>
                          <p className="text-2xl font-bold">{count}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Board Section */}
          {report.reportData.board && (
            <Card>
              <CardHeader>
                <CardTitle>Board / List View</CardTitle>
                <CardDescription>
                  Tasks organized by status columns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {report.reportData.board.columns.map((col: any) => (
                    <div key={col.status} className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-muted-foreground capitalize">{col.status || 'Unknown'}</p>
                      <p className="text-2xl font-bold">{col.count}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Total Tasks: <span className="font-semibold">{report.reportData.board.totalTasks}</span></p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calendar Section */}
          {report.reportData.calendar && (
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>
                  Tasks with due dates: {report.reportData.calendar.totalTasksWithDueDates} | Upcoming: {report.reportData.calendar.upcoming} | Overdue: {report.reportData.calendar.overdue}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Upcoming</p>
                    <p className="text-2xl font-bold">{report.reportData.calendar.upcoming}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Overdue</p>
                    <p className="text-2xl font-bold">{report.reportData.calendar.overdue}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total with Due Dates</p>
                    <p className="text-2xl font-bold">{report.reportData.calendar.totalTasksWithDueDates}</p>
                  </div>
                </div>
                {report.reportData.calendar.overdueTasks && report.reportData.calendar.overdueTasks.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2 text-red-600">Overdue Tasks</h4>
                    <div className="space-y-2">
                      {report.reportData.calendar.overdueTasks.slice(0, 5).map((task: any) => (
                        <div key={task.id} className="flex justify-between items-center p-2 bg-red-50 rounded border border-red-200">
                          <span className="font-medium">{task.title}</span>
                          <span className="text-sm text-muted-foreground">{format(new Date(task.dueDate), 'MMM dd, yyyy')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline Section */}
          {report.reportData.timeline && (
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
                <CardDescription>
                  Task activity over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-50 rounded-lg mb-4">
                  <p className="text-sm text-muted-foreground">Total Tasks Tracked</p>
                  <p className="text-2xl font-bold">{report.reportData.timeline.totalTasks}</p>
                </div>
                {report.reportData.timeline.byMonth && Object.keys(report.reportData.timeline.byMonth).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold mb-2">Tasks Created by Month</h4>
                    {Object.entries(report.reportData.timeline.byMonth).slice(0, 6).map(([month, count]: [string, any]) => (
                      <div key={month} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>{new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        <span className="font-semibold">{count} tasks</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Report Data</h3>
            <p className="text-muted-foreground text-center">
              This report was created before the report generation feature was implemented.
            </p>
          </CardContent>
        </Card>
      )}
      
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button 
          variant="outline"
          onClick={() => {
            handleDuplicateReport(report);
          }}
        >
          <Copy className="h-4 w-4 mr-2" />
          Duplicate
        </Button>
        <Button 
          variant="outline"
          onClick={() => {
            handleExportReport(report, 'csv');
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button 
          variant="outline"
          onClick={() => {
            handleExportReport(report, 'json');
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Export JSON
        </Button>
        <Button 
          variant="outline"
          onClick={() => {
            handleExportReport(report, 'pdf');
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            if (confirm('Are you sure you want to delete this report?')) {
              handleDeleteReport(report.id);
            }
          }}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
        <Button
          onClick={() => {
            handleViewReport(report);
            toast.info(`Viewing report: ${report.title}`);
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          View Report
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reports & Analytics</h2>
          <p className="text-muted-foreground">Comprehensive project insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => {
              toast.info('Report settings configuration coming soon');
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Dialog open={isCreateReportOpen} onOpenChange={setIsCreateReportOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Report</DialogTitle>
                <DialogDescription>
                  Build a custom report for your project analytics
                </DialogDescription>
              </DialogHeader>
              <CreateReportFormComponent
                reportTitle={reportTitle}
                reportDescription={reportDescription}
                reportCategory={reportCategory}
                reportType={reportType}
                reportDataSource={reportDataSource}
                isScheduled={isScheduled}
                reportFrequency={reportFrequency}
                reportRecipients={reportRecipients}
                onTitleChange={handleTitleChange}
                onDescriptionChange={handleDescriptionChange}
                onCategoryChange={setReportCategory}
                onTypeChange={setReportType}
                onDataSourceChange={setReportDataSource}
                onScheduledChange={handleScheduledChange}
                onFrequencyChange={setReportFrequency}
                onRecipientsChange={handleRecipientsChange}
                onCancel={handleCancel}
                onCreate={handleCreateReport}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {/* Summary Tab Header */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Project Summary Report</h3>
              <p className="text-sm text-muted-foreground">Key metrics and insights for project progress</p>
            </div>
            <Button onClick={() => setIsEmailDialogOpen(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Send Report
            </Button>
          </div>

          {summaryLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading report data...</p>
            </div>
          ) : summary ? (
            <>
              {/* Summary Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Open vs Done</p>
                        <p className="text-2xl font-bold">
                          {summary.summary.openTasks} / {summary.summary.doneTasks}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {summary.summary.openTasks + summary.summary.doneTasks > 0
                            ? `${Math.round((summary.summary.doneTasks / (summary.summary.openTasks + summary.summary.doneTasks)) * 100)}% completed`
                            : 'No tasks'}
                        </p>
                      </div>
                      <FileText className="h-8 w-8 text-blue-500" />
                    </div>
                    <Progress 
                      value={summary.summary.openTasks + summary.summary.doneTasks > 0
                        ? (summary.summary.doneTasks / (summary.summary.openTasks + summary.summary.doneTasks)) * 100
                        : 0} 
                      className="mt-4 h-2" 
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Work in Progress</p>
                        <p className="text-2xl font-bold">{summary.summary.workInProgress}</p>
                        <p className="text-xs text-muted-foreground mt-1">Active tasks</p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Average Cycle Time</p>
                        <p className="text-2xl font-bold">{summary.summary.averageCycleTime} days</p>
                        <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tasks by Status Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tasks by Status</CardTitle>
                    <CardDescription>Distribution of tasks across different statuses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tasksByStatusChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={tasksByStatusChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ status, count }) => `${status}: ${count}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {tasksByStatusChartData.map((entry: any, index: number) => {
                              const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82CA9D'];
                              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                            })}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-64 flex items-center justify-center">
                        <p className="text-muted-foreground">No task data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Created vs Completed Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Created vs Completed</CardTitle>
                    <CardDescription>Task creation and completion trends over the last 8 weeks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {createdVsCompletedChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsLineChart data={createdVsCompletedChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="created" stroke="#8884d8" name="Created" />
                          <Line type="monotone" dataKey="completed" stroke="#82ca9d" name="Completed" />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-64 flex items-center justify-center">
                        <p className="text-muted-foreground">No data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Workload by Assignee Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Workload by Assignee</CardTitle>
                  <CardDescription>Task distribution across team members</CardDescription>
                </CardHeader>
                <CardContent>
                  {workloadByAssigneeChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={workloadByAssigneeChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="userName" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="openTasks" fill="#8884d8" name="Open Tasks" />
                        <Bar dataKey="inProgressTasks" fill="#82ca9d" name="In Progress" />
                        <Bar dataKey="totalTasks" fill="#ffc658" name="Total Tasks" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center">
                      <p className="text-muted-foreground">No assignee data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No report data available</h3>
                <p className="text-muted-foreground text-center">
                  Unable to load project summary report
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                title="Project Health"
                value={`${dashboardData.projectHealth?.score || 0}%`}
                trend={dashboardData.projectHealth?.trend}
                change={dashboardData.projectHealth?.change}
                icon={<BarChart3 className="h-8 w-8 text-blue-500" />}
              />
              <MetricCard
                title="Tasks Completed"
                value={dashboardData.tasksCompleted?.total || 0}
                subtitle={`${dashboardData.tasksCompleted?.thisWeek || 0} this week`}
                trend={dashboardData.tasksCompleted?.trend}
                change={dashboardData.tasksCompleted?.change}
                icon={<FileText className="h-8 w-8 text-green-500" />}
              />
              <MetricCard
                title="Team Efficiency"
                value={`${dashboardData.teamEfficiency?.score || 0}%`}
                trend={dashboardData.teamEfficiency?.trend}
                change={dashboardData.teamEfficiency?.change}
                icon={<Users className="h-8 w-8 text-purple-500" />}
              />
            </div>
          </div>

          {/* Budget & Time */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget Utilization</CardTitle>
                <CardDescription>Current spending vs allocated budget</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <span className="text-sm font-medium">{dashboardData.budgetUtilization?.percentage || 0}%</span>
                  </div>
                  <Progress value={dashboardData.budgetUtilization?.percentage || 0} className="h-3" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Spent</p>
                      <p className="font-medium">{dashboardData.budgetUtilization?.spent || '$0'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Remaining</p>
                      <p className="font-medium">{dashboardData.budgetUtilization?.remaining || '$0'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Tracking</CardTitle>
                <CardDescription>Hours logged and productivity metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Hours</p>
                      <p className="text-2xl font-bold">{dashboardData.timeTracking?.totalHours || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">This Week</p>
                      <p className="text-2xl font-bold">{dashboardData.timeTracking?.thisWeek || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Overtime Hours</span>
                    <span className="font-medium">{dashboardData.timeTracking?.overtime || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quality Metrics - Only show if data is available */}
          {dashboardData.qualityMetrics && 
           (dashboardData.qualityMetrics.bugRate !== null || 
            dashboardData.qualityMetrics.testCoverage !== null || 
            dashboardData.qualityMetrics.codeReview !== null) && (
          <Card>
            <CardHeader>
              <CardTitle>Quality Metrics</CardTitle>
              <CardDescription>Code quality and testing indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {dashboardData.qualityMetrics.bugRate !== null ? `${dashboardData.qualityMetrics.bugRate}%` : 'N/A'}
                    </p>
                  <p className="text-sm text-muted-foreground">Bug Rate</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {dashboardData.qualityMetrics.testCoverage !== null ? `${dashboardData.qualityMetrics.testCoverage}%` : 'N/A'}
                    </p>
                  <p className="text-sm text-muted-foreground">Test Coverage</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {dashboardData.qualityMetrics.codeReview !== null ? `${dashboardData.qualityMetrics.codeReview}%` : 'N/A'}
                    </p>
                  <p className="text-sm text-muted-foreground">Code Review Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Burndown Chart</CardTitle>
                <CardDescription>Planned vs actual progress over time</CardDescription>
              </CardHeader>
              <CardContent>
                {burndownLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground">Loading chart data...</p>
                  </div>
                ) : burndownChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={burndownChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="planned" stroke="#8884d8" name="Planned" />
                      <Line type="monotone" dataKey="actual" stroke="#82ca9d" name="Actual" />
                      <Line type="monotone" dataKey="ideal" stroke="#ffc658" name="Ideal" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                ) : (
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <LineChart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No burndown data available</p>
                  </div>
                </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Velocity</CardTitle>
                <CardDescription>Sprint velocity and capacity planning</CardDescription>
              </CardHeader>
              <CardContent>
                {velocityLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground">Loading chart data...</p>
                  </div>
                ) : velocityChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={velocityChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sprint" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" fill="#82ca9d" name="Completed" />
                      <Bar dataKey="planned" fill="#8884d8" name="Planned" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No velocity data available</p>
                  </div>
                </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resource Allocation</CardTitle>
              <CardDescription>Team member workload and capacity distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {capacityLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">Loading chart data...</p>
                </div>
              ) : capacityChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={capacityChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="utilization" fill="#8884d8" name="Utilization %" />
                    <Bar dataKey="assigned" fill="#82ca9d" name="Assigned Hours" />
                    <Bar dataKey="available" fill="#ffc658" name="Available Hours" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
              <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center">
                  <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No capacity data available</p>
                </div>
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="time">Time</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="risk">Risk</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7_days">Last 7 days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 days</SelectItem>
                  <SelectItem value="last_90_days">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline"
              onClick={() => {
                toast.info('Advanced filters: Add more filter options here');
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </div>

          {/* Reports Grid */}
          {filteredReports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || categoryFilter !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "Create your first report to get started"
                  }
                </p>
                <Button onClick={() => setIsCreateReportOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Report
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline Analysis</CardTitle>
                <CardDescription>Milestone progress and deadline tracking</CardDescription>
              </CardHeader>
              <CardContent>
                {burndownChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={burndownChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="remaining" stroke="#8884d8" name="Remaining Work" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                ) : (
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Timeline analysis would appear here</p>
                  </div>
                </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Analysis</CardTitle>
                <CardDescription>Budget breakdown and cost trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Cost analysis chart would appear here</p>
                    <p className="text-xs text-muted-foreground mt-2">Budget data integration coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Predictive Analytics</CardTitle>
              <CardDescription>AI-powered insights and project forecasting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900">Completion Forecast</h4>
                    <p className="text-2xl font-bold text-blue-700">
                      {burndownChartData.length > 0 
                        ? format(new Date(Date.now() + (burndownChartData.length * 24 * 60 * 60 * 1000)), 'MMM dd, yyyy')
                        : 'N/A'}
                    </p>
                    <p className="text-sm text-blue-600">Based on current velocity</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900">Budget Forecast</h4>
                    <p className="text-2xl font-bold text-green-700">
                      {analytics?.project?.budget 
                        ? `$${((analytics.project.budget || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : 'N/A'}
                    </p>
                    <p className="text-sm text-green-600">
                      {analytics?.project?.budget ? 'Total budget' : 'No budget data'}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-medium text-orange-900">Project Status</h4>
                    <p className="text-2xl font-bold text-orange-700">
                      {analytics?.project?.status || 'N/A'}
                    </p>
                    <p className="text-sm text-orange-600">
                      {analytics?.project?.progress !== undefined ? `${analytics.project.progress}% complete` : 'No data'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Details Dialog */}
      <Dialog open={isReportDetailsOpen} onOpenChange={setIsReportDetailsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              {selectedReport?.description || 'View and export your generated report'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            {selectedReport && <ReportDetails report={selectedReport} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Report Dialog */}
      <ReportEmailDialog
        projectId={projectId}
        open={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
        reportType="summary"
      />
    </div>
  );
};

export default ProjectReportsView; 
