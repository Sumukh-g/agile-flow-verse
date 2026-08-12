import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/lib/auth-context';
import { useDashboard } from '@/hooks/useDashboard';
import {
    Briefcase,
    CheckCircle2,
    ClipboardList,
    Clock,
    TrendingUp,
    Users,
    Zap,
    Building2,
    Target,
    BarChart3,
    Activity
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface UserSetupData {
  name?: string; // name is from user, not setup data for display here
  companyName?: string;
  teamSize?: string;
  industry?: string;
  projectTypes?: string[];
  workflowDescription?: string;
  completed?: boolean;
  setupDate?: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [userSetupData, setUserSetupData] = useState<UserSetupData | null>(null);
  
  // Use dashboard API for optimized data fetching
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useDashboard();
  const { data: projects = [], isLoading: projectsLoading, error: projectsError, refetch: refetchProjects } = useProjects();
  
  React.useEffect(() => {
    if (dashboardError) {
      console.error('Dashboard error:', dashboardError);
    }
  }, [dashboardData, dashboardError]);

  useEffect(() => {
    const setupDataString = localStorage.getItem('userSetup');
    if (setupDataString) {
      try {
        const parsedData = JSON.parse(setupDataString);
        setUserSetupData(parsedData);
      } catch (error) {
        console.error("Failed to parse user setup data from localStorage", error);
      }
    }
  }, []);

  // Extract stats from dashboard data
  const taskStats = dashboardData?.taskStats || { total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 };
  const projectStats = dashboardData?.projectStats || { total: 0, active: 0, completed: 0, onHold: 0 };
  const crmStats = dashboardData?.crmStats || { totalProjects: 0, totalClients: 0, totalDeals: 0, activeProjects: 0 };
  const analytics = dashboardData?.analytics || { tasksCreatedLast7Days: 0, tasksCreatedLast30Days: 0, projectsCreatedLast30Days: 0, completionRate: 0 };
  const recentTasks = dashboardData?.recentTasks || [];

  // Calculate dashboard stats
  const totalProjects = projectStats.total;
  const totalTasks = taskStats.total;
  const completedTasks = taskStats.done;
  const pendingTasks = taskStats.todo;
  const inProgressTasks = taskStats.inProgress;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name || 'User'}! Here's an overview of your workspace.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => refetchDashboard()} 
              disabled={dashboardLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              {dashboardLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </div>

      {/* User Setup Information Card */}
      {userSetupData && userSetupData.completed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Briefcase className="mr-2 h-5 w-5 text-indigo-500" />
              Workspace Profile
            </CardTitle>
            <CardDescription>
              This workspace is configured based on your setup choices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {userSetupData.companyName && (
              <div className="flex items-center">
                <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                <strong>Company:</strong><span className="ml-1">{userSetupData.companyName}</span>
              </div>
            )}
            {userSetupData.industry && (
              <div className="flex items-center">
                <Zap className="mr-2 h-4 w-4 text-muted-foreground" />
                <strong>Industry:</strong><span className="ml-1">{userSetupData.industry}</span>
              </div>
            )}
            {userSetupData.teamSize && (
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                <strong>Team Size:</strong><span className="ml-1">{userSetupData.teamSize.charAt(0).toUpperCase() + userSetupData.teamSize.slice(1)}</span>
              </div>
            )}
            {userSetupData.projectTypes && userSetupData.projectTypes.length > 0 && (
              <div className="flex items-start">
                <ClipboardList className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <strong>Project Focus:</strong>
                  <ul className="list-disc list-inside ml-1">
                    {userSetupData.projectTypes.map(type => <li key={type}>{type}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {dashboardError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">
              Error loading dashboard data. Please try refreshing.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardLoading ? '...' : totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {projectStats.active} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardLoading ? '...' : totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks} completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardLoading ? '...' : inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">
              {pendingTasks} pending
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardLoading || totalTasks === 0 ? '0' : analytics.completionRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              of tasks completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CRM Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CRM Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardLoading ? '...' : crmStats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {crmStats.activeProjects} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CRM Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardLoading ? '...' : crmStats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              total clients
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardLoading ? '...' : crmStats.totalDeals}</div>
            <p className="text-xs text-muted-foreground">
              in pipeline
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardLoading ? '...' : taskStats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Overview
          </CardTitle>
          <CardDescription>
            Activity metrics and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Tasks Created (7 days)</p>
              <p className="text-2xl font-bold">{dashboardLoading ? '...' : analytics.tasksCreatedLast7Days}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Tasks Created (30 days)</p>
              <p className="text-2xl font-bold">{dashboardLoading ? '...' : analytics.tasksCreatedLast30Days}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Projects Created (30 days)</p>
              <p className="text-2xl font-bold">{dashboardLoading ? '...' : analytics.projectsCreatedLast30Days}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>
            Your latest projects and their progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="text-center py-4">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No projects yet. Create your first project to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {projects.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{project.name}</h4>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
          <CardDescription>
            Your latest tasks and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardLoading ? (
            <div className="text-center py-4">Loading tasks...</div>
          ) : recentTasks.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No tasks yet. Create your first task to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {recentTasks.slice(0, 5).map((task: any) => (
                <div key={task.id} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{task.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {task.project?.name ? `Project: ${task.project.name}` : task.description || 'No description'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      task.status === 'done' ? 'bg-green-100 text-green-800' :
                      task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status?.toUpperCase() || 'TODO'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
