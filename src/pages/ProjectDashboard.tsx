
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  MessageSquare, 
  FileText,
  Layers,
  Zap,
  Settings,
  ArrowUpRight
} from 'lucide-react';
import ProjectAutomationPanel from "@/components/projects/ProjectAutomationPanel";
import ProjectTasksList from "@/components/projects/ProjectTasksList";
import ProjectBoardView from "@/components/projects/ProjectBoardView";
import ProjectTimelineView from "@/components/projects/ProjectTimelineView";
import ProjectSettingsPanel from "@/components/projects/ProjectSettingsPanel";
import { toast } from "sonner";

const ProjectDashboard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch project data based on projectId
    // This is a mock implementation - in a real app, you would fetch from an API
    setTimeout(() => {
      const mockProject = {
        id: projectId,
        name: `Project ${projectId}`,
        description: "This is a detailed project description that provides context about goals and scope.",
        status: "In Progress",
        progress: 45,
        startDate: "2023-05-01",
        dueDate: "2023-06-30",
        owner: "JD",
        team: ["AS", "RM", "TW"],
        tasks: {
          total: 25,
          completed: 12,
          inProgress: 8,
          todo: 5
        },
        recentActivities: [
          { id: 'a1', user: 'JD', action: 'commented on', item: 'Task A', time: '2 hours ago', icon: MessageSquare },
          { id: 'a2', user: 'AS', action: 'completed', item: 'Task B', time: '4 hours ago', icon: CheckCircle2 },
          { id: 'a3', user: 'RM', action: 'created', item: 'Document C', time: '1 day ago', icon: FileText }
        ],
        automations: [
          { id: 'r1', name: 'Assign overdue tasks', status: 'active', lastRun: '2 days ago' },
          { id: 'r2', name: 'Notify on milestone completion', status: 'active', lastRun: '1 week ago' }
        ]
      };
      
      setProject(mockProject);
      setLoading(false);
    }, 800);
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-center">
          <p className="text-lg">Loading project dashboard...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
        <p className="text-muted-foreground mb-6">The requested project could not be found.</p>
        <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <span className="inline-flex items-center rounded-md bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800">
              {project.status}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            {project.description}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/projects/${projectId}/edit`)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button>
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Actions
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Project Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tasks</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <h3 className="text-2xl font-bold">{project.tasks.total}</h3>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      <span className="text-green-500">{project.tasks.completed} </span>
                      completed
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-blue-100">
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Timeline</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <h3 className="text-2xl font-bold">{project.progress}%</h3>
                      <p className="text-xs text-muted-foreground">Complete</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Due {project.dueDate}
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-amber-100">
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Issues</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <h3 className="text-2xl font-bold">3</h3>
                      <p className="text-xs text-muted-foreground">Open</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      <span className="text-red-500">1 </span>
                      blocker
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-red-100">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Milestones</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <h3 className="text-2xl font-bold">2</h3>
                      <p className="text-xs text-muted-foreground">Upcoming</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Next in 5 days
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-indigo-100">
                    <Sparkles className="h-5 w-5 text-indigo-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Project Progress</CardTitle>
                <CardDescription>Overall project completion status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Overall Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4">
                  <div className="flex flex-col gap-1">
                    <div className="text-muted-foreground">To Do</div>
                    <div className="font-medium">{project.tasks.todo} tasks</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-muted-foreground">In Progress</div>
                    <div className="font-medium">{project.tasks.inProgress} tasks</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-muted-foreground">Completed</div>
                    <div className="font-medium">{project.tasks.completed} tasks</div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    variant="outline" 
                    className="w-full text-center" 
                    onClick={() => setActiveTab("tasks")}
                  >
                    View All Tasks
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Recent Activities</CardTitle>
                <CardDescription>Latest updates on this project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.recentActivities.map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{activity.user}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center">
                        <p className="text-sm font-medium">{activity.user}</p>
                        <Separator orientation="vertical" className="mx-2 h-4" />
                        <p className="text-sm text-muted-foreground">{activity.time}</p>
                      </div>
                      <p className="text-sm">
                        {activity.action} <span className="font-medium">{activity.item}</span>
                      </p>
                    </div>
                    <div className="p-1.5 rounded-full bg-blue-100 text-blue-600">
                      <activity.icon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                ))}
                
                <div className="pt-2">
                  <Button 
                    variant="ghost" 
                    className="w-full text-center text-sm"
                    onClick={() => toast.info("Activity history coming soon")}
                  >
                    View All Activity
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Automation Rules Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Automation Rules</CardTitle>
              <CardDescription>Active automation workflows for this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.automations.map((rule: any) => (
                <div key={rule.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-full bg-purple-100 text-purple-600">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">Last run: {rule.lastRun}</p>
                    </div>
                  </div>
                  <div>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      {rule.status}
                    </span>
                  </div>
                </div>
              ))}
              
              <div className="pt-2">
                <Button 
                  onClick={() => setActiveTab("automation")} 
                  className="w-full text-center"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Manage Automations
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tasks">
          <ProjectTasksList projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="board">
          <ProjectBoardView projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="timeline">
          <ProjectTimelineView projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="automation">
          <ProjectAutomationPanel projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDashboard;
