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
import { ProjectMembersView } from "@/components/projects/ProjectMembersView";
import FinanceBoard from "@/components/finance/FinanceBoard";
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
    DollarSign,
    FileText,
    FormInput,
    Layers,
    MessageSquare,
    Paperclip,
    Share,
    Sparkles,
    StickyNote,
    Users
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useProject, useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useNotes } from '@/hooks/useNotesEnhanced';

const ProjectDashboard = () => {
  const params = useParams();
  const projectId = params.id; // Route uses :id, not :projectId
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("summary");
  
  // Fetch real project data from API - refetch when projectId changes
  const { data: projectData, isLoading: loading, error, refetch } = useProject(projectId || '');
  
  // Handle both direct project object and wrapped responses
  const project = projectData?.data || projectData;
  
  // Fetch all projects to determine project number
  const { data: allProjects = [] } = useProjects();
  
  // Calculate project number based on position in sorted list (by createdAt desc)
  // Projects are sorted by createdAt desc, so newest is first
  // We want P1 for the newest, P2 for second newest, etc.
  const sortedProjects = React.useMemo(() => {
    return [...allProjects].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
  }, [allProjects]);
  
  const projectNumber = React.useMemo(() => {
    if (!projectId) return 1;
    const index = sortedProjects.findIndex(p => p.id === projectId);
    return index >= 0 ? index + 1 : 1; // P1, P2, P3, etc.
  }, [projectId, sortedProjects]);
  
  // Fetch tasks for this project - refetch when projectId changes
  const { data: tasks = [] } = useTasks(projectId || undefined);
  
  // Fetch notes for this project
  const { data: notesData } = useNotes(projectId);
  const notes = notesData?.data || notesData || [];
  
  // Force refetch when projectId changes - use queryClient to invalidate cache
  const queryClient = useQueryClient();
  React.useEffect(() => {
    if (projectId) {
      // Invalidate all project-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      // Then refetch
      refetch();
    }
  }, [projectId, refetch, queryClient]);
  
  // Calculate real task stats
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    todo: tasks.filter(t => t.status === 'todo').length
  };
  
  React.useEffect(() => {
    if (error) {
      console.error('Project error:', error);
    }
  }, [project, error]);

  // Always show the interface - use fallback data if project is not loaded
  // This ensures users can see all tabs and features even if data is still loading
  const displayProject = project || {
    id: projectId,
    name: projectId || 'Project',
    status: 'active',
    description: 'Loading project details...',
    progress: 0
  };

  // Don't render if projectId is missing
  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-2xl font-bold mb-4">Invalid Project</h2>
        <p className="text-muted-foreground mb-6">No project ID provided in the URL.</p>
        <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" key={projectId}>
      {/* Error Banner - show but don't block */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              {(error as any)?.response?.status === 401 
                ? 'Authentication Error - Please log out and log back in'
                : (error as any)?.response?.status === 403
                ? 'Access Denied - You do not have permission to view this project'
                : (error as any)?.response?.status === 404
                ? 'Project Not Found'
                : 'Error loading project data'}
            </p>
            <p className="text-xs text-red-600 mt-1">
              {(error as any)?.response?.data?.message || (error as any)?.message || 'Unknown error'}
            </p>
            {(error as any)?.response?.status === 403 && (
              <p className="text-xs text-red-600 mt-2">
                If you believe you should have access, please contact the project owner or administrator.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/projects')} variant="outline" size="sm">
              Back to Projects
            </Button>
            <Button onClick={() => refetch()} variant="outline" size="sm">Retry</Button>
          </div>
        </div>
      )}
      
      {/* Loading Indicator */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">Loading project data...</p>
        </div>
      )}
      
      {/* Project Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <span className="text-xl font-bold">P{projectNumber}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {displayProject.name || projectId || 'Project'}
              </h1>
              {displayProject.status && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {displayProject.status}
                </Badge>
              )}
            </div>
            {displayProject.description && (
              <p className="text-muted-foreground mt-1">
                {displayProject.description}
              </p>
            )}
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


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{taskStats.completed}</p>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-xs text-muted-foreground">of {taskStats.total} total tasks</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{taskStats.inProgress}</p>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-xs text-muted-foreground">actively being worked on</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{taskStats.todo}</p>
                <p className="text-sm font-medium text-muted-foreground">To Do</p>
                <p className="text-xs text-muted-foreground">pending tasks</p>
              </div>
              <Sparkles className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{displayProject.progress || 0}%</p>
                <p className="text-sm font-medium text-muted-foreground">Progress</p>
                <p className="text-xs text-muted-foreground">project completion</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6 lg:grid-cols-16 mb-4 h-auto p-1">
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
          <TabsTrigger value="members" className="flex items-center gap-1 text-xs">
            <Users className="h-3 w-3" />
            Members
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
          <TabsTrigger value="finance" className="flex items-center gap-1 text-xs">
            <DollarSign className="h-3 w-3" />
            Finance
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status overview</CardTitle>
                <CardDescription>
                  Overview of all work items in this project
                </CardDescription>
              </CardHeader>
              <CardContent className="py-6">
                <div className="text-6xl font-bold text-muted-foreground/20 mb-4 text-center">
                  {tasks.length + notes.length}
                </div>
                <p className="text-muted-foreground mb-6 text-center">Total work items</p>
                
                <div className="space-y-3 w-full">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium">Tasks</span>
                    </div>
                    <span className="text-sm font-bold">{tasks.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-sm font-medium">Notes</span>
                    </div>
                    <span className="text-sm font-bold">{notes.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-green-50">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium">Completed Tasks</span>
                    </div>
                    <span className="text-sm font-bold">{taskStats.completed}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-orange-50">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-sm font-medium">In Progress</span>
                    </div>
                    <span className="text-sm font-bold">{taskStats.inProgress}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Project Activity</CardTitle>
                <CardDescription>
                  Recent activity and progress
                </CardDescription>
              </CardHeader>
              <CardContent className="py-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tasks</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{tasks.length} total</span>
                      {tasks.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({taskStats.completed} completed)
                        </span>
                      )}
                    </div>
                  </div>
                  {tasks.length > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${(taskStats.completed / tasks.length) * 100}%` }}
                      ></div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-muted-foreground">Notes</span>
                    <span className="text-sm font-medium">{notes.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-muted-foreground">Project Progress</span>
                    <span className="text-sm font-medium">
                      {tasks.length > 0 
                        ? `${Math.round((taskStats.completed / tasks.length) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  {tasks.length > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${(taskStats.completed / tasks.length) * 100}%` }}
                      ></div>
                    </div>
                  )}
                  
                  {tasks.length === 0 && notes.length === 0 && (
                    <div className="text-center py-8">
                      <div className="p-4 rounded-full bg-blue-100 mb-4 inline-block">
                        <CheckCircle2 className="h-8 w-8 text-blue-500" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Create tasks and notes to see activity here.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tasks.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {taskStats.todo} to do
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{taskStats.completed}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {tasks.length > 0 ? `${Math.round((taskStats.completed / tasks.length) * 100)}%` : '0%'} done
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{taskStats.inProgress}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active work
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{notes.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Project notes
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="board">
          <ProjectBoardView projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="list">
          {projectId && <ProjectTasksList key={projectId} projectId={projectId} />}
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
        
        <TabsContent value="members">
          <ProjectMembersView projectId={projectId} />
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
        
        <TabsContent value="finance">
          <FinanceBoard projectId={projectId} projectName={displayProject.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDashboard;
