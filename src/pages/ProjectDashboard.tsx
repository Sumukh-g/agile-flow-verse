import ProjectAllWorkView from "@/components/projects/ProjectAllWorkView";
import ProjectApprovalsView from "@/components/projects/ProjectApprovalsView";
import ProjectAttachmentsView from "@/components/projects/ProjectAttachmentsView";
import ProjectBoardView from "@/components/projects/ProjectBoardView";
import ProjectCRM from "@/components/projects/ProjectCRM";
import ProjectCalendarView from "@/components/projects/ProjectCalendarView";
import ProjectFormsView from "@/components/projects/ProjectFormsView";
import ProjectIssueTracker from "@/components/projects/ProjectIssueTracker";
import ProjectNotesView from "@/components/projects/ProjectNotesView";
import ProjectPagesView from "@/components/projects/ProjectPagesView";
import ProjectReportsView from "@/components/projects/ProjectReportsView";
import ProjectTasksList from "@/components/projects/ProjectTasksList";
import ProjectTimelineView from "@/components/projects/ProjectTimelineView";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    BarChart3,
    Building2,
    Calendar,
    CheckCircle2,
    CheckSquare,
    ClipboardList,
    Clock,
    FileText,
    Filter,
    FormInput,
    Layers,
    MessageSquare,
    Paperclip,
    Share,
    Sparkles,
    StickyNote,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const ProjectDashboard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("summary");
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch project data based on projectId
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
      {/* Project Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <span className="text-xl font-bold">P1</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {project.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {project.description}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700">
            <Sparkles className="h-4 w-4 mr-2" />
            Automation
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Filter</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">0 completed</p>
                <p className="text-xs text-muted-foreground">in the last 7 days</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">0 updated</p>
                <p className="text-xs text-muted-foreground">in the last 7 days</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">0 created</p>
                <p className="text-xs text-muted-foreground">in the last 7 days</p>
              </div>
              <Sparkles className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">0 due soon</p>
                <p className="text-xs text-muted-foreground">in the next 7 days</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6 lg:grid-cols-14 mb-4 h-auto p-1">
          <TabsTrigger value="summary" className="flex items-center gap-1 text-xs">
            <BarChart3 className="h-3 w-3" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="board" className="flex items-center gap-1 text-xs">
            <Layers className="h-3 w-3" />
            Board
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-1 text-xs">
            <ClipboardList className="h-3 w-3" />
            List
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-1 text-xs">
            <StickyNote className="h-3 w-3" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-1 text-xs">
            <CheckSquare className="h-3 w-3" />
            Approvals
          </TabsTrigger>
          <TabsTrigger value="forms" className="flex items-center gap-1 text-xs">
            <FormInput className="h-3 w-3" />
            Forms
          </TabsTrigger>
          <TabsTrigger value="pages" className="flex items-center gap-1 text-xs">
            <FileText className="h-3 w-3" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="attachments" className="flex items-center gap-1 text-xs">
            <Paperclip className="h-3 w-3" />
            Attachments
          </TabsTrigger>
          <TabsTrigger value="allwork" className="flex items-center gap-1 text-xs">
            <Users className="h-3 w-3" />
            All work
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-1 text-xs">
            <BarChart3 className="h-3 w-3" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="crm" className="flex items-center gap-1 text-xs">
            <Building2 className="h-3 w-3" />
            CRM
          </TabsTrigger>
          <TabsTrigger value="issuetracker" className="flex items-center gap-1 text-xs">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-1.5 1.5M5 7l1.5 1.5M12 3v2m0 14v2m7-7h2m-18 0h2m15.07-4.93l-1.41 1.41M6.34 17.66l-1.41-1.41M17.66 17.66l-1.41-1.41M6.34 6.34l-1.41 1.41"/><circle cx="12" cy="12" r="7"/></svg>
            Issue Tracker
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status overview</CardTitle>
                <CardDescription>
                  The status overview for this project will display here after you{' '}
                  <span className="text-purple-600 underline cursor-pointer">create some work items</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-8xl font-bold text-muted-foreground/20 mb-4">0</div>
                <p className="text-muted-foreground mb-6">Total work items</p>
                
                <div className="space-y-2 w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm">To Do</span>
                    </div>
                    <span className="text-sm font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-sm">Testing</span>
                    </div>
                    <span className="text-sm font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                      <span className="text-sm">Design</span>
                    </div>
                    <span className="text-sm font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm">Concepting</span>
                    </div>
                    <span className="text-sm font-medium">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>No activity yet</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-4 rounded-full bg-blue-100 mb-4">
                  <CheckCircle2 className="h-12 w-12 text-blue-500" />
                </div>
                <p className="text-center text-muted-foreground mb-6">
                  Create a few work items and invite some teammates to your project to see activity here.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="board">
          <ProjectBoardView projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="list">
          <ProjectTasksList projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="calendar">
          <ProjectCalendarView projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="timeline">
          <ProjectTimelineView projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="notes">
          <ProjectNotesView projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="approvals">
          <ProjectApprovalsView projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="forms">
          <ProjectFormsView projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="pages">
          <ProjectPagesView projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="attachments">
          <ProjectAttachmentsView projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="allwork">
          <ProjectAllWorkView projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="reports">
          <ProjectReportsView projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="crm">
          <ProjectCRM projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="issuetracker">
          <ProjectIssueTracker projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDashboard;
