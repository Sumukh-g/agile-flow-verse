/**
 * Reports Page
 * 
 * Comprehensive reporting interface for project analytics and insights.
 * 
 * Features:
 * - Multiple report types (Burndown, Velocity, Capacity, Time Tracking)
 * - Interactive charts with drill-down capability
 * - Date range selection
 * - Export to CSV/JSON
 * - Scheduled report generation (placeholder)
 * - Project comparison view
 * 
 * @component
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProjects } from '@/hooks/useProjects';
import { 
  useBurndownReport, 
  useVelocityReport, 
  useCapacityReport, 
  useTimeTrackingReport 
} from '@/hooks/useReports';
import { api } from '@/lib/api';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from 'recharts';
import {
  TrendingDown,
  Zap,
  Users,
  Clock,
  Download,
  Calendar as CalendarIcon,
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  Mail,
  RefreshCw,
  Filter,
  Layers,
  Target,
  AlertTriangle,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Minus,
  FileSpreadsheet,
  FileJson,
  ChevronRight,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface DateRange {
  from: Date;
  to: Date;
}

interface ReportData {
  burndown: any[];
  velocity: any[];
  capacity: any[];
  timeTracking: any;
}

// ============================================================================
// DATA TRANSFORMATION HELPERS
// ============================================================================

/**
 * Transform API burndown data to chart format
 */
const transformBurndownData = (apiData: any[]): any[] => {
  if (!apiData || !Array.isArray(apiData)) return [];
  
  return apiData.map((item: any) => ({
    date: format(new Date(item.date), 'MMM dd'),
    ideal: item.ideal || 0,
    actual: item.actual || item.remaining || 0,
    completed: item.actual || 0,
    remaining: item.remaining || 0,
  }));
};

/**
 * Transform API velocity data to chart format
 */
const transformVelocityData = (apiData: any[]): any[] => {
  if (!apiData || !Array.isArray(apiData)) return [];
  
  return apiData.map((item: any) => ({
    sprint: item.sprint || `Sprint ${item.sprintNumber || ''}`,
    completed: item.completed || item.velocity || 0,
    committed: item.committed || item.planned || 0,
    velocity: item.velocity || item.completed || 0,
    target: 50, // Default target, can be configured
  }));
};

/**
 * Transform API capacity data to chart format
 */
const transformCapacityData = (apiData: any[]): any[] => {
  if (!apiData || !Array.isArray(apiData)) return [];
  
  return apiData.map((item: any) => ({
    name: item.userName || item.name || 'Unknown',
    assigned: item.assignedHours || 0,
    capacity: item.capacity || 0,
    logged: item.loggedHours || 0,
    utilization: item.utilization || 0,
    availability: item.availability || 0,
  }));
};

/**
 * Transform API time tracking data to chart format
 */
const transformTimeTrackingData = (apiData: any): any => {
  if (!apiData) return { byDate: [], byProject: [], byUser: [] };
  
  // Transform byDate data
  const byDate = Object.entries(apiData.byDate || {}).map(([date, entries]: [string, any]) => {
    const totalHours = Array.isArray(entries) 
      ? entries.reduce((sum: number, e: any) => sum + (e.hours || 0), 0)
      : 0;
    
    return {
      date: format(new Date(date), 'MMM dd'),
      hours: totalHours,
      target: 8, // Default target
    };
  });
  
  // Transform byProject data
  const byProject = (apiData.byProject || []).map((item: any) => ({
    name: item.project?.name || 'Unknown Project',
    hours: item.totalHours || 0,
    percentage: 0, // Will be calculated
  }));
  
  // Calculate percentages
  const totalHours = byProject.reduce((sum: number, p: any) => sum + p.hours, 0);
  byProject.forEach((p: any) => {
    p.percentage = totalHours > 0 ? Math.round((p.hours / totalHours) * 100) : 0;
  });
  
  return {
    byDate,
    byProject,
    byUser: apiData.byUser || [],
    summary: apiData.summary || {},
  };
};

// ============================================================================
// CHART COLORS
// ============================================================================

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
const STATUS_COLORS = {
  todo: '#94a3b8',
  'in-progress': '#3b82f6',
  review: '#8b5cf6',
  done: '#22c55e',
};

// ============================================================================
// CUSTOM TOOLTIP COMPONENTS
// ============================================================================

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ReportsPage: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Fetch projects
  const { data: projects = [] } = useProjects();
  
  // Format dates for API
  const startDate = format(dateRange.from, 'yyyy-MM-dd');
  const endDate = format(dateRange.to, 'yyyy-MM-dd');
  const projectId = selectedProject === 'all' ? undefined : selectedProject;
  
  // Fetch real report data from API
  const { 
    data: burndownData, 
    isLoading: burndownLoading,
    error: burndownError 
  } = useBurndownReport(projectId, startDate, endDate, 'day');
  
  const { 
    data: velocityData, 
    isLoading: velocityLoading,
    error: velocityError 
  } = useVelocityReport(projectId, startDate, endDate);
  
  const { 
    data: capacityData, 
    isLoading: capacityLoading,
    error: capacityError 
  } = useCapacityReport(projectId, startDate, endDate);
  
  const { 
    data: timeTrackingData, 
    isLoading: timeTrackingLoading,
    error: timeTrackingError 
  } = useTimeTrackingReport(projectId, startDate, endDate);
  
  // Transform API data to chart format (memoized for performance)
  const reportData = useMemo(() => {
    const burndown = burndownData?.data ? transformBurndownData(burndownData.data) : [];
    const velocity = velocityData?.data ? transformVelocityData(velocityData.data) : [];
    const capacity = capacityData?.data ? transformCapacityData(capacityData.data) : [];
    const timeTracking = timeTrackingData?.data ? transformTimeTrackingData(timeTrackingData.data) : { byDate: [], byProject: [], byUser: [] };
    
    return {
      burndown,
      velocity,
      capacity,
      timeTracking: timeTracking.byDate,
      timeByProject: timeTracking.byProject,
      timeByUser: timeTracking.byUser,
      timeSummary: timeTracking.summary,
    };
  }, [burndownData, velocityData, capacityData, timeTrackingData]);
  
  // Loading state
  const isLoading = burndownLoading || velocityLoading || capacityLoading || timeTrackingLoading;
  
  // Error state
  const hasError = burndownError || velocityError || capacityError || timeTrackingError;
  
  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const velocity = reportData.velocity || [];
    const avgVelocity = velocity.length > 0 
      ? velocity.reduce((sum, v) => sum + (v.completed || 0), 0) / velocity.length 
      : 0;
    const lastVelocity = velocity.length > 0 ? (velocity[velocity.length - 1]?.completed || 0) : 0;
    const velocityTrend = velocity.length > 0 
      ? (lastVelocity > avgVelocity ? 'up' : lastVelocity < avgVelocity ? 'down' : 'stable')
      : 'stable';
    
    const capacity = reportData.capacity || [];
    const avgUtilization = capacity.length > 0
      ? capacity.reduce((sum, c) => sum + (c.utilization || 0), 0) / capacity.length
      : 0;
    const overloaded = capacity.filter(c => (c.utilization || 0) > 100).length;
    
    const timeData = reportData.timeTracking || [];
    const totalHours = timeData.length > 0
      ? timeData.reduce((sum: number, t: any) => sum + (t.hours || 0), 0)
      : (reportData.timeSummary?.totalHours || 0);
    const avgDaily = timeData.length > 0 
      ? totalHours / timeData.length 
      : (totalHours / 30); // Default to 30 days if no data
    
    return {
      avgVelocity: Math.round(avgVelocity),
      lastVelocity,
      velocityTrend,
      avgUtilization: Math.round(avgUtilization),
      overloadedMembers: overloaded,
      totalHours: Math.round(totalHours),
      avgDailyHours: avgDaily > 0 ? avgDaily.toFixed(1) : '0.0',
    };
  }, [reportData]);
  
  // Quick date range presets
  const datePresets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 14 days', days: 14 },
    { label: 'Last 30 days', days: 30 },
    { label: 'This month', type: 'month' },
    { label: 'Last 3 months', days: 90 },
  ];
  
  const handleDatePreset = (preset: any) => {
    if (preset.type === 'month') {
      setDateRange({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      });
    } else {
      setDateRange({
        from: subDays(new Date(), preset.days),
        to: new Date(),
      });
    }
  };
  
  // Export handler - uses real API
  const handleExport = async (exportFormat: 'csv' | 'json') => {
    setIsExporting(true);
    
    try {
      // Determine report type based on active tab
      let reportType: 'burndown' | 'velocity' | 'capacity' | 'time-tracking' = 'burndown';
      if (activeTab === 'velocity') reportType = 'velocity';
      else if (activeTab === 'capacity') reportType = 'capacity';
      else if (activeTab === 'time') reportType = 'time-tracking';
      
      // Call API export endpoint
      const response = await api.reports.exportReport(
        reportType,
        exportFormat,
        {
          projectId: projectId,
          startDate,
          endDate,
        }
      );
      
      // Create blob and download
      const blob = new Blob(
        [exportFormat === 'json' ? JSON.stringify(response.data, null, 2) : response.data],
        { type: exportFormat === 'json' ? 'application/json' : 'text/csv' }
      );
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;
      a.click();
      
      URL.revokeObjectURL(url);
      toast.success(`Report exported as ${exportFormat.toUpperCase()}`);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error?.response?.data?.message || 'Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };
  
  // Get trend icon component
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your project performance
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Project Filter */}
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project: any) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Date Range Picker */}
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 border-b">
                <div className="flex flex-wrap gap-2">
                  {datePresets.map((preset, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleDatePreset(preset);
                        setIsDatePickerOpen(false);
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          
          {/* Export Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="end">
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => handleExport('csv')}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export as CSV
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => handleExport('json')}
                >
                  <FileJson className="mr-2 h-4 w-4" />
                  Export as JSON
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Loading/Error States */}
      {isLoading && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Loading report data...</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">Please wait while we fetch your analytics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {hasError && !isLoading && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">Error loading report data</p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {burndownError?.message || velocityError?.message || capacityError?.message || timeTrackingError?.message || 'Failed to load report data'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Velocity</p>
                <p className="text-2xl font-bold">{summaryMetrics.avgVelocity}</p>
                <p className="text-xs text-muted-foreground">pts/sprint</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon(summaryMetrics.velocityTrend)}
              <span className="text-xs text-muted-foreground">
                Last sprint: {summaryMetrics.lastVelocity} pts
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Utilization</p>
                <p className="text-2xl font-bold">{summaryMetrics.avgUtilization}%</p>
                <p className="text-xs text-muted-foreground">average capacity</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
            {summaryMetrics.overloadedMembers > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-amber-600">
                  {summaryMetrics.overloadedMembers} overloaded
                </span>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{summaryMetrics.totalHours}</p>
                <p className="text-xs text-muted-foreground">this period</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">
                Avg: {summaryMetrics.avgDailyHours} hrs/day
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sprint Progress</p>
                <p className="text-2xl font-bold">72%</p>
                <p className="text-xs text-muted-foreground">8 days remaining</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Target className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <Progress value={72} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="burndown">Burndown</TabsTrigger>
          <TabsTrigger value="velocity">Velocity</TabsTrigger>
          <TabsTrigger value="capacity">Capacity</TabsTrigger>
          <TabsTrigger value="time">Time Tracking</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Burndown Preview */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-blue-600" />
                      Sprint Burndown
                    </CardTitle>
                    <CardDescription>Track progress vs ideal</CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setActiveTab('burndown')}
                  >
                    View Details <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData.burndown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="linear" dataKey="ideal" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Velocity Preview */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-500" />
                      Team Velocity
                    </CardTitle>
                    <CardDescription>Story points per sprint</CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setActiveTab('velocity')}
                  >
                    View Details <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.velocity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="sprint" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <ReferenceLine y={summaryMetrics.avgVelocity} stroke="#f59e0b" strokeDasharray="5 5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Team Workload Preview */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-600" />
                      Team Workload
                    </CardTitle>
                    <CardDescription>Capacity utilization</CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setActiveTab('capacity')}
                  >
                    View Details <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.capacity.slice(0, 4).map((member, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-24 truncate text-sm font-medium">{member.name.split(' ')[0]}</div>
                      <div className="flex-1">
                        <div className="h-2 rounded-full overflow-hidden bg-secondary">
                          <div
                            className={`h-full transition-all ${
                              member.utilization > 100 ? 'bg-red-500' :
                              member.utilization >= 70 ? 'bg-green-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, member.utilization)}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-12 text-right text-sm font-medium">
                        {member.utilization}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Time by Project Preview */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-600" />
                      Time by Project
                    </CardTitle>
                    <CardDescription>Hours distribution</CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setActiveTab('time')}
                  >
                    View Details <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.timeByProject}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="hours"
                        nameKey="name"
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        labelLine={false}
                      >
                        {reportData.timeByProject.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Burndown Tab */}
        <TabsContent value="burndown" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-blue-600" />
                    Sprint Burndown Chart
                  </CardTitle>
                  <CardDescription>
                    Track remaining work against the ideal burndown rate
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  On Track
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Points</p>
                  <p className="text-xl font-bold text-blue-600">100</p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-xl font-bold text-green-600">72</p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className="text-xl font-bold text-amber-600">28</p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">Days Left</p>
                  <p className="text-xl font-bold text-purple-600">4</p>
                </div>
              </div>
              
              {/* Chart */}
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={reportData.burndown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="completed" 
                      fill="#22c55e" 
                      fillOpacity={0.2}
                      stroke="#22c55e"
                      name="Completed"
                    />
                    <Line 
                      type="linear" 
                      dataKey="ideal" 
                      stroke="#94a3b8" 
                      strokeDasharray="5 5" 
                      strokeWidth={2}
                      dot={false}
                      name="Ideal Burndown"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6, fill: '#2563eb' }}
                      name="Actual Remaining"
                    />
                    <ReferenceLine
                      x="Dec 03"
                      stroke="#f59e0b"
                      strokeDasharray="3 3"
                      label={{ value: 'Today', fontSize: 11, fill: '#f59e0b' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Velocity Tab */}
        <TabsContent value="velocity" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    Team Velocity Report
                  </CardTitle>
                  <CardDescription>
                    Historical velocity and completion rate analysis
                  </CardDescription>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  Improving (+8%)
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">Average</p>
                  <p className="text-xl font-bold text-blue-600">{summaryMetrics.avgVelocity}</p>
                  <p className="text-xs text-muted-foreground">pts/sprint</p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">Best</p>
                  <p className="text-xl font-bold text-green-600">62</p>
                  <p className="text-xs text-muted-foreground">pts</p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="text-xl font-bold text-amber-600">50</p>
                  <p className="text-xs text-muted-foreground">pts</p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">Completion</p>
                  <p className="text-xl font-bold text-purple-600">87%</p>
                  <p className="text-xs text-muted-foreground">avg rate</p>
                </div>
              </div>
              
              {/* Chart */}
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={reportData.velocity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="committed" 
                      fill="#e5e7eb" 
                      name="Committed"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                    <Bar 
                      dataKey="completed" 
                      fill="#3b82f6" 
                      name="Completed"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke="#f59e0b" 
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      dot={false}
                      name="Target"
                    />
                    <ReferenceLine
                      y={summaryMetrics.avgVelocity}
                      stroke="#22c55e"
                      strokeDasharray="3 3"
                      label={{ 
                        value: `Avg: ${summaryMetrics.avgVelocity}`, 
                        fontSize: 11, 
                        fill: '#22c55e',
                        position: 'right'
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Capacity Tab */}
        <TabsContent value="capacity" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    Team Capacity Report
                  </CardTitle>
                  <CardDescription>
                    Workload distribution and utilization metrics
                  </CardDescription>
                </div>
                {summaryMetrics.overloadedMembers > 0 && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {summaryMetrics.overloadedMembers} Overloaded
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">Team Size</p>
                  <p className="text-xl font-bold text-blue-600">{reportData.capacity.length}</p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">Avg Utilization</p>
                  <p className="text-xl font-bold text-green-600">{summaryMetrics.avgUtilization}%</p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">Overloaded</p>
                  <p className="text-xl font-bold text-red-600">{summaryMetrics.overloadedMembers}</p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">Available</p>
                  <p className="text-xl font-bold text-amber-600">
                    {reportData.capacity.filter(c => c.utilization < 70).length}
                  </p>
                </div>
              </div>
              
              {/* Chart and List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.capacity} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 120]} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        tick={{ fontSize: 11 }} 
                        width={100}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="utilization" 
                        name="Utilization %"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={30}
                      >
                        {reportData.capacity.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`}
                            fill={
                              entry.utilization > 100 ? '#ef4444' :
                              entry.utilization >= 70 ? '#22c55e' : '#f59e0b'
                            }
                          />
                        ))}
                      </Bar>
                      <ReferenceLine x={100} stroke="#ef4444" strokeDasharray="3 3" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Detailed List */}
                <div className="space-y-3">
                  {reportData.capacity.map((member, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{member.name}</span>
                        <Badge 
                          variant="outline"
                          className={
                            member.utilization > 100 ? 'bg-red-100 text-red-800' :
                            member.utilization >= 70 ? 'bg-green-100 text-green-800' : 
                            'bg-amber-100 text-amber-800'
                          }
                        >
                          {member.utilization > 100 ? 'Overloaded' :
                           member.utilization >= 70 ? 'Optimal' : 'Available'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Assigned:</span>
                          <span className="ml-1 font-medium">{member.assigned}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Capacity:</span>
                          <span className="ml-1 font-medium">{member.capacity}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Logged:</span>
                          <span className="ml-1 font-medium">{member.logged}h</span>
                        </div>
                      </div>
                      <Progress 
                        value={Math.min(100, member.utilization)} 
                        className="mt-2 h-2" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Time Tracking Tab */}
        <TabsContent value="time" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Time Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  Daily Time Logged
                </CardTitle>
                <CardDescription>Hours tracked per day vs target</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={reportData.timeTracking}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} domain={[0, 10]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar 
                        dataKey="hours" 
                        fill="#8b5cf6" 
                        name="Logged Hours"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={30}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="target" 
                        stroke="#f59e0b" 
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        dot={false}
                        name="Target"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Time by Project Pie */}
            <Card>
              <CardHeader>
                <CardTitle>Time by Project</CardTitle>
                <CardDescription>Hours distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.timeByProject}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="hours"
                        nameKey="name"
                      >
                        {reportData.timeByProject.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {reportData.timeByProject.map((project, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="truncate max-w-[120px]">{project.name}</span>
                      </div>
                      <span className="font-medium">{project.hours}h</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Time Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">{summaryMetrics.totalHours}</p>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{summaryMetrics.avgDailyHours}</p>
                  <p className="text-sm text-muted-foreground">Avg Daily</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">92%</p>
                  <p className="text-sm text-muted-foreground">Billable</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-600">5</p>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;

