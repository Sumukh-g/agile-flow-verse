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
    PieChart,
    Plus,
    Search,
    Settings,
    Share,
    TrendingDown,
    TrendingUp,
    Users
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useBurndownReport, useVelocityReport, useCapacityReport, useTimeTrackingReport } from '@/hooks/useReports';

interface ProjectReportsViewProps {
  projectId: string | undefined;
}

const ProjectReportsView: React.FC<ProjectReportsViewProps> = ({ projectId }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState("last_30_days");
  const [activeTab, setActiveTab] = useState("overview");
  const [isCreateReportOpen, setIsCreateReportOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isReportDetailsOpen, setIsReportDetailsOpen] = useState(false);

  // Compute a rolling 30-day window
  const range = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    return { start: iso(start), end: iso(end) };
  }, []);

  const { data: burndown } = useBurndownReport(projectId, range.start, range.end, 'day');
  const { data: velocity } = useVelocityReport(projectId, range.start, range.end);
  const { data: capacity } = useCapacityReport(projectId, range.start, range.end);
  const { data: timeTracking } = useTimeTrackingReport(projectId, range.start, range.end);

  useEffect(() => {
    // Minimal synthesized dashboard from real backend reports
    const remaining = Array.isArray(burndown) && burndown.length ? burndown[burndown.length - 1].remaining ?? 0 : 0;
    const completedTasks = Array.isArray(velocity) ? velocity.reduce((s: number, v: any) => s + (v.completed || 0), 0) : 0;
    const avgUtilization = Array.isArray(capacity) && capacity.length
      ? Math.round(capacity.reduce((s: number, c: any) => s + (c.utilization || 0), 0) / capacity.length)
      : 0;

    setDashboardData({
      projectHealth: { score: Math.max(0, 100 - remaining), trend: 'neutral', change: 0 },
      tasksCompleted: { total: completedTasks, thisWeek: 0, trend: 'neutral', change: 0 },
      teamEfficiency: { score: avgUtilization, trend: 'neutral', change: 0 },
      timeTracking,
    });
  }, [burndown, velocity, capacity, timeTracking]);

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

  const CreateReportForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="reportTitle">Report Title</Label>
        <Input id="reportTitle" placeholder="Enter report title" />
      </div>
      <div>
        <Label htmlFor="reportDescription">Description</Label>
        <Textarea id="reportDescription" placeholder="Describe the report purpose and content..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="time">Time</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="risk">Risk</SelectItem>
              <SelectItem value="quality">Quality</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="type">Report Type</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dashboard">Dashboard</SelectItem>
              <SelectItem value="chart">Chart</SelectItem>
              <SelectItem value="table">Table</SelectItem>
              <SelectItem value="document">Document</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="dataSource">Data Source</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select data source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tasks">Tasks & Issues</SelectItem>
            <SelectItem value="time">Time Tracking</SelectItem>
            <SelectItem value="budget">Budget & Finance</SelectItem>
            <SelectItem value="team">Team Performance</SelectItem>
            <SelectItem value="custom">Custom Query</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        <Label>Scheduling</Label>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="scheduled" />
          <Label htmlFor="scheduled">Schedule automatic generation</Label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="frequency">Frequency</Label>
            <Select>
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
            <Input id="recipients" placeholder="Enter email addresses" />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setIsCreateReportOpen(false)}>Cancel</Button>
        <Button onClick={() => {
          toast.success("Report created successfully!");
          setIsCreateReportOpen(false);
        }}>Create Report</Button>
      </div>
    </div>
  );

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

  const ReportCard = ({ report }: { report: any }) => (
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
            <Button size="sm" variant="ghost" onClick={() => {
              setSelectedReport(report);
              setIsReportDetailsOpen(true);
            }}>
              <Eye className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost">
              <Download className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost">
              <Share className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ReportDetails = ({ report }: { report: any }) => (
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
      
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button 
          variant="outline"
          onClick={() => {
            setIsCreateReportOpen(true);
            toast.info(`Editing report: ${selectedReport.title}`);
          }}
        >
          Edit
        </Button>
        <Button 
          variant="outline"
          onClick={() => {
            toast.success(`Report duplicated: ${selectedReport.title}`);
          }}
        >
          Duplicate
        </Button>
        <Button
          onClick={() => {
            toast.info(`Viewing report: ${selectedReport.title}`);
          }}
        >
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
            onClick={() => toast.info('Report settings coming soon')}
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
              <CreateReportForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                title="Project Health"
                value={`${dashboardData.projectHealth?.score}%`}
                trend={dashboardData.projectHealth?.trend}
                change={dashboardData.projectHealth?.change}
                icon={<BarChart3 className="h-8 w-8 text-blue-500" />}
              />
              <MetricCard
                title="Tasks Completed"
                value={dashboardData.tasksCompleted?.total}
                subtitle={`${dashboardData.tasksCompleted?.thisWeek} this week`}
                trend={dashboardData.tasksCompleted?.trend}
                change={dashboardData.tasksCompleted?.change}
                icon={<FileText className="h-8 w-8 text-green-500" />}
              />
              <MetricCard
                title="Team Efficiency"
                value={`${dashboardData.teamEfficiency?.score}%`}
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
                    <span className="text-sm font-medium">{dashboardData.budgetUtilization?.percentage}%</span>
                  </div>
                  <Progress value={dashboardData.budgetUtilization?.percentage} className="h-3" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Spent</p>
                      <p className="font-medium">{dashboardData.budgetUtilization?.spent}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Remaining</p>
                      <p className="font-medium">{dashboardData.budgetUtilization?.remaining}</p>
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
                      <p className="text-2xl font-bold">{dashboardData.timeTracking?.totalHours}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">This Week</p>
                      <p className="text-2xl font-bold">{dashboardData.timeTracking?.thisWeek}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Overtime Hours</span>
                    <span className="font-medium">{dashboardData.timeTracking?.overtime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quality Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Quality Metrics</CardTitle>
              <CardDescription>Code quality and testing indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{dashboardData.qualityMetrics?.bugRate}%</p>
                  <p className="text-sm text-muted-foreground">Bug Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{dashboardData.qualityMetrics?.testCoverage}%</p>
                  <p className="text-sm text-muted-foreground">Test Coverage</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{dashboardData.qualityMetrics?.codeReview}%</p>
                  <p className="text-sm text-muted-foreground">Code Review Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Completion Trend</CardTitle>
                <CardDescription>Daily task completion over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <LineChart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Chart visualization would appear here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Velocity</CardTitle>
                <CardDescription>Sprint velocity and capacity planning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Velocity chart would appear here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resource Allocation</CardTitle>
              <CardDescription>Team member workload and capacity distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center">
                  <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Resource allocation chart would appear here</p>
                </div>
              </div>
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
              onClick={() => toast.info('Advanced filters coming soon')}
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
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Timeline analysis would appear here</p>
                  </div>
                </div>
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
                    <p className="text-2xl font-bold text-blue-700">March 15, 2024</p>
                    <p className="text-sm text-blue-600">Based on current velocity</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900">Budget Forecast</h4>
                    <p className="text-2xl font-bold text-green-700">$65,400</p>
                    <p className="text-sm text-green-600">Projected final cost</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-medium text-orange-900">Risk Score</h4>
                    <p className="text-2xl font-bold text-orange-700">Medium</p>
                    <p className="text-sm text-orange-600">3 identified risks</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Details Dialog */}
      <Dialog open={isReportDetailsOpen} onOpenChange={setIsReportDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          {selectedReport && <ReportDetails report={selectedReport} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectReportsView; 