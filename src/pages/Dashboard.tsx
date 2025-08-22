import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateProject, useProjects } from '@/hooks/useProjects';
import { useCreateTask, useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/lib/auth-context';
import {
    Briefcase,
    CheckCircle2, // For Team Size
    ClipboardList,
    Clock,
    Plus, // For Project Types
    TrendingUp, // For Company/Industry
    Users,
    Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
  
  // Use API hooks to fetch real data
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  
  // Use mutation hooks for creating data
  const createProject = useCreateProject();
  const createTask = useCreateTask();

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

  // Calculate dashboard stats
  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const pendingTasks = tasks.filter(t => t.status === 'TODO').length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;

  const createTestData = async () => {
    try {
      // Create a test project
      const project = await createProject.mutateAsync({
        name: `Test Project ${Date.now()}`,
        description: 'This is a test project created from the dashboard'
      });

      // Create some test tasks for the project
      await createTask.mutateAsync({
        title: 'Complete project setup',
        description: 'Set up the initial project structure',
        status: 'TODO',
        priority: 'HIGH',
        projectId: project.id
      });

      await createTask.mutateAsync({
        title: 'Design user interface',
        description: 'Create wireframes and mockups',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        projectId: project.id
      });

      await createTask.mutateAsync({
        title: 'Write documentation',
        description: 'Document the project requirements',
        status: 'DONE',
        priority: 'LOW',
        projectId: project.id
      });

      toast.success('Test data created successfully!');
    } catch (error) {
      console.error('Failed to create test data:', error);
      toast.error('Failed to create test data. Please try again.');
    }
  };

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
          <Button 
            onClick={createTestData} 
            disabled={createProject.isPending || createTask.isPending}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {createProject.isPending || createTask.isPending ? 'Creating...' : 'Create Test Data'}
          </Button>
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

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectsLoading ? '...' : totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {/* completedProjects */}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksLoading ? '...' : totalTasks}</div>
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
            <div className="text-2xl font-bold">{tasksLoading ? '...' : inProgressTasks}</div>
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
              {tasksLoading || totalTasks === 0 ? '0' : Math.round((completedTasks / totalTasks) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              of tasks completed
            </p>
          </CardContent>
        </Card>
      </div>

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
          {tasksLoading ? (
            <div className="text-center py-4">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No tasks yet. Create your first task to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{task.title}</h4>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      task.status === 'DONE' ? 'bg-green-100 text-green-800' :
                      task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status}
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
