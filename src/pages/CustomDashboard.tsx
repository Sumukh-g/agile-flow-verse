import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  LayoutDashboard, 
  BarChart, 
  LineChart, 
  PieChart,
  Plus,
  Trash,
  Pencil,
  Move,
  Settings,
  Table,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

interface Widget {
  id: string;
  type: string;
  title: string;
  width: 1 | 2 | 3 | 4; // Column width (out of 4)
  height: 1 | 2; // Row height (1 = normal, 2 = double)
  data?: any;
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: Widget[];
}

const WIDGET_TYPES = [
  { id: 'taskMetrics', type: 'taskMetrics', title: 'Task Metrics', icon: BarChart },
  { id: 'projectProgress', type: 'projectProgress', title: 'Project Progress', icon: PieChart },
  { id: 'timeTracking', type: 'timeTracking', title: 'Time Tracking', icon: LineChart },
  { id: 'quickActions', type: 'quickActions', title: 'Quick Actions', icon: Settings },
  { id: 'recentActivity', type: 'recentActivity', title: 'Recent Activity', icon: Table }
];

const DEFAULT_DASHBOARD: Dashboard = {
  id: 'default',
  name: 'Main Dashboard',
  description: 'Overview of key metrics and activities',
  widgets: [
    {
      id: 'widget-1',
      type: 'taskMetrics',
      title: 'Task Status Overview',
      width: 2,
      height: 1,
      data: {
        metrics: [
          { name: 'To Do', value: 12, color: '#e0e0e0' },
          { name: 'In Progress', value: 8, color: '#3b82f6' },
          { name: 'In Review', value: 5, color: '#8b5cf6' },
          { name: 'Done', value: 18, color: '#22c55e' }
        ]
      }
    },
    {
      id: 'widget-2',
      type: 'projectProgress',
      title: 'Project Progress',
      width: 2,
      height: 1,
      data: {
        projects: [
          { name: 'Website Redesign', progress: 75 },
          { name: 'Mobile App Development', progress: 32 },
          { name: 'Product Launch', progress: 89 },
          { name: 'Marketing Campaign', progress: 54 }
        ]
      }
    },
    {
      id: 'widget-3',
      type: 'recentActivity',
      title: 'Recent Activity',
      width: 2,
      height: 1,
      data: {
        activities: [
          { user: 'John D.', action: 'completed task', target: 'Create wireframes', time: '2 hours ago' },
          { user: 'Alice S.', action: 'commented on', target: 'API Integration', time: '4 hours ago' },
          { user: 'Robert M.', action: 'created task', target: 'QA Testing', time: '1 day ago' },
          { user: 'Jane W.', action: 'updated', target: 'Project Timeline', time: '1 day ago' }
        ]
      }
    },
    {
      id: 'widget-4',
      type: 'timeTracking',
      title: 'Time Tracking',
      width: 2,
      height: 1,
      data: {
        weeklyHours: [
          { day: 'Mon', hours: 6.5 },
          { day: 'Tue', hours: 8.2 },
          { day: 'Wed', hours: 7.0 },
          { day: 'Thu', hours: 7.8 },
          { day: 'Fri', hours: 5.5 },
          { day: 'Sat', hours: 2.0 },
          { day: 'Sun', hours: 0.5 }
        ]
      }
    }
  ]
};

const CustomDashboard = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([DEFAULT_DASHBOARD]);
  const [activeDashboard, setActiveDashboard] = useState<string>(DEFAULT_DASHBOARD.id);
  const [editMode, setEditMode] = useState(false);
  const [newDashboardData, setNewDashboardData] = useState({
    name: '',
    description: ''
  });
  const [editWidgetId, setEditWidgetId] = useState<string | null>(null);
  const [newWidgetData, setNewWidgetData] = useState<{
    type: string;
    title: string;
    width: 1 | 2 | 3 | 4;
    height: 1 | 2;
  }>({
    type: '',
    title: '',
    width: 2, // Default width
    height: 1  // Default height
  });

  const currentDashboard = dashboards.find(d => d.id === activeDashboard) || DEFAULT_DASHBOARD;

  const handleCreateDashboard = () => {
    const newDashboard: Dashboard = {
      id: `dashboard-${Date.now()}`,
      name: newDashboardData.name || 'New Dashboard',
      description: newDashboardData.description || 'Custom dashboard',
      widgets: []
    };
    
    setDashboards([...dashboards, newDashboard]);
    setActiveDashboard(newDashboard.id);
    setNewDashboardData({ name: '', description: '' });
    toast.success(`Dashboard "${newDashboard.name}" created`);
  };

  const handleDeleteDashboard = (id: string) => {
    if (dashboards.length <= 1) {
      toast.error("Cannot delete the only dashboard");
      return;
    }
    
    const updatedDashboards = dashboards.filter(d => d.id !== id);
    setDashboards(updatedDashboards);
    setActiveDashboard(updatedDashboards[0].id);
    toast.success("Dashboard deleted");
  };

  const handleAddWidget = () => {
    if (!newWidgetData.type || !newWidgetData.title) {
      toast.error("Widget type and title are required");
      return;
    }

    const widgetType = WIDGET_TYPES.find(w => w.type === newWidgetData.type);
    if (!widgetType) return;

    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: newWidgetData.type,
      title: newWidgetData.title,
      width: newWidgetData.width,
      height: newWidgetData.height,
      data: {}
    };

    const updatedDashboards = dashboards.map(dash => {
      if (dash.id === activeDashboard) {
        return {
          ...dash,
          widgets: [...dash.widgets, newWidget]
        };
      }
      return dash;
    });

    setDashboards(updatedDashboards);
    setNewWidgetData({
      type: '',
      title: '',
      width: 2,
      height: 1
    });
    toast.success("Widget added to dashboard");
  };

  const handleDeleteWidget = (widgetId: string) => {
    const updatedDashboards = dashboards.map(dash => {
      if (dash.id === activeDashboard) {
        return {
          ...dash,
          widgets: dash.widgets.filter(w => w.id !== widgetId)
        };
      }
      return dash;
    });

    setDashboards(updatedDashboards);
    toast.success("Widget removed");
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    const updatedDashboards = dashboards.map(dash => {
      if (dash.id === activeDashboard) {
        const updatedWidgets = [...dash.widgets];
        const [removed] = updatedWidgets.splice(sourceIndex, 1);
        updatedWidgets.splice(destinationIndex, 0, removed);
        return { ...dash, widgets: updatedWidgets };
      }
      return dash;
    });
    
    setDashboards(updatedDashboards);
  };

  // Widget Components
  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'taskMetrics':
        return <TaskMetricsWidget widget={widget} />;
      case 'projectProgress':
        return <ProjectProgressWidget widget={widget} />;
      case 'timeTracking':
        return <TimeTrackingWidget widget={widget} />;
      case 'quickActions':
        return <QuickActionsWidget widget={widget} />;
      case 'recentActivity':
        return <RecentActivityWidget widget={widget} />;
      default:
        return <div>Unknown widget type</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Custom Dashboard</h1>
        <p className="text-muted-foreground">
          Customize your dashboard with the widgets that matter most to you.
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="dashboard-select">Dashboard:</Label>
          <select
            id="dashboard-select"
            value={activeDashboard}
            onChange={(e) => setActiveDashboard(e.target.value)}
            className="bg-background border border-input rounded-md p-2 text-sm"
          >
            {dashboards.map((dash) => (
              <option key={dash.id} value={dash.id}>{dash.name}</option>
            ))}
          </select>
          {dashboards.length > 1 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleDeleteDashboard(activeDashboard)}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Dashboard
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Dashboard</DialogTitle>
                <DialogDescription>
                  Create a new custom dashboard to organize your widgets.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="dashboard-name">Name</Label>
                  <Input
                    id="dashboard-name"
                    value={newDashboardData.name}
                    onChange={(e) => setNewDashboardData({...newDashboardData, name: e.target.value})}
                    placeholder="My Dashboard"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dashboard-description">Description</Label>
                  <Input
                    id="dashboard-description"
                    value={newDashboardData.description}
                    onChange={(e) => setNewDashboardData({...newDashboardData, description: e.target.value})}
                    placeholder="Dashboard description..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateDashboard}>Create Dashboard</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant={editMode ? "default" : "outline"}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? "Done" : "Edit Layout"}
          </Button>
          
          {editMode && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widget
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Widget</DialogTitle>
                  <DialogDescription>
                    Select a widget type to add to your dashboard.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="widget-type">Widget Type</Label>
                    <select
                      id="widget-type"
                      value={newWidgetData.type}
                      onChange={(e) => setNewWidgetData({...newWidgetData, type: e.target.value})}
                      className="bg-background border border-input rounded-md p-2 text-sm"
                    >
                      <option value="">Select widget type</option>
                      {WIDGET_TYPES.map((widgetType) => (
                        <option key={widgetType.id} value={widgetType.type}>{widgetType.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="widget-title">Title</Label>
                    <Input
                      id="widget-title"
                      value={newWidgetData.title}
                      onChange={(e) => setNewWidgetData({...newWidgetData, title: e.target.value})}
                      placeholder="Widget title"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="widget-width">Width</Label>
                      <select
                        id="widget-width"
                        value={newWidgetData.width}
                        onChange={(e) => setNewWidgetData({...newWidgetData, width: Number(e.target.value) as 1 | 2 | 3 | 4})}
                        className="bg-background border border-input rounded-md p-2 text-sm"
                      >
                        <option value="1">Small (1/4)</option>
                        <option value="2">Medium (2/4)</option>
                        <option value="3">Large (3/4)</option>
                        <option value="4">Full Width (4/4)</option>
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="widget-height">Height</Label>
                      <select
                        id="widget-height"
                        value={newWidgetData.height}
                        onChange={(e) => setNewWidgetData({...newWidgetData, height: Number(e.target.value) as 1 | 2})}
                        className="bg-background border border-input rounded-md p-2 text-sm"
                      >
                        <option value="1">Normal</option>
                        <option value="2">Double</option>
                      </select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddWidget}>Add Widget</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      {/* Dashboard description */}
      <div className="text-sm text-muted-foreground">
        {currentDashboard.description}
      </div>
      
      {/* Widgets Grid */}
      <div className="grid grid-cols-4 gap-4">
        {editMode ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="dashboard-widgets" direction="horizontal">
              {(provided) => (
                <div 
                  className="grid grid-cols-4 gap-4 w-full" 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {currentDashboard.widgets.map((widget, index) => (
                    <Draggable key={widget.id} draggableId={widget.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`col-span-${widget.width} row-span-${widget.height} relative group`}
                        >
                          <div {...provided.dragHandleProps} className="absolute right-2 top-2 bg-background/80 p-1 rounded-md border opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Move className="h-4 w-4 cursor-move" />
                          </div>
                          <div className="absolute right-8 top-2 bg-background/80 p-1 rounded-md border opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Trash 
                              className="h-4 w-4 cursor-pointer text-red-500" 
                              onClick={() => handleDeleteWidget(widget.id)}
                            />
                          </div>
                          <Card className="h-full">
                            {renderWidget(widget)}
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <>
            {currentDashboard.widgets.map(widget => (
              <Card 
                key={widget.id} 
                className={`col-span-${widget.width} row-span-${widget.height} h-full`}
              >
                {renderWidget(widget)}
              </Card>
            ))}
          </>
        )}
      </div>
      
      {currentDashboard.widgets.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/20">
          <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Widgets Added</h3>
          <p className="text-muted-foreground text-center mb-4">
            This dashboard is empty. Add widgets to customize your view.
          </p>
          {editMode && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Widget
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Widget</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="widget-type-first">Widget Type</Label>
                    <select
                      id="widget-type-first"
                      value={newWidgetData.type}
                      onChange={(e) => setNewWidgetData({...newWidgetData, type: e.target.value})}
                      className="bg-background border border-input rounded-md p-2 text-sm"
                    >
                      <option value="">Select widget type</option>
                      {WIDGET_TYPES.map((widgetType) => (
                        <option key={widgetType.id} value={widgetType.type}>{widgetType.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="widget-title-first">Title</Label>
                    <Input
                      id="widget-title-first"
                      value={newWidgetData.title}
                      onChange={(e) => setNewWidgetData({...newWidgetData, title: e.target.value})}
                      placeholder="Widget title"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddWidget}>Add Widget</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
    </div>
  );
};

// Individual Widget Components
const TaskMetricsWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  return (
    <>
      <CardHeader>
        <CardTitle>{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {widget.data?.metrics?.map((metric: any, index: number) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{metric.name}</span>
                <span className="font-medium">{metric.value}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-secondary">
                <div
                  className="h-full"
                  style={{ 
                    width: `${(metric.value / widget.data.metrics.reduce((total: number, m: any) => total + m.value, 0)) * 100}%`, 
                    backgroundColor: metric.color 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </>
  );
};

const ProjectProgressWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  return (
    <>
      <CardHeader>
        <CardTitle>{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {widget.data?.projects?.map((project: any, index: number) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{project.name}</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-secondary">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </>
  );
};

const TimeTrackingWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  return (
    <>
      <CardHeader>
        <CardTitle>{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-[120px] items-end gap-2">
          {widget.data?.weeklyHours?.map((day: any, index: number) => (
            <div key={index} className="relative flex flex-1 flex-col justify-end">
              <div 
                className="bg-primary rounded-md w-full" 
                style={{ height: `${(day.hours / 10) * 100}%` }}
              />
              <span className="mt-1 text-center text-xs">{day.day}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 text-center text-sm text-muted-foreground">
          Total: {widget.data?.weeklyHours?.reduce((sum: number, day: any) => sum + day.hours, 0).toFixed(1)} hours
        </div>
      </CardContent>
    </>
  );
};

const QuickActionsWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  return (
    <>
      <CardHeader>
        <CardTitle>{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="flex flex-col h-auto py-4" onClick={() => toast.info("Creating new task")}>
            <Plus className="h-5 w-5 mb-1" />
            <span className="text-xs">New Task</span>
          </Button>
          <Button variant="outline" className="flex flex-col h-auto py-4" onClick={() => toast.info("Starting timer")}>
            <Clock className="h-5 w-5 mb-1" />
            <span className="text-xs">Start Timer</span>
          </Button>
          <Button variant="outline" className="flex flex-col h-auto py-4" onClick={() => toast.info("Creating new project")}>
            <LayoutDashboard className="h-5 w-5 mb-1" />
            <span className="text-xs">New Project</span>
          </Button>
          <Button variant="outline" className="flex flex-col h-auto py-4" onClick={() => toast.info("Creating report")}>
            <BarChart className="h-5 w-5 mb-1" />
            <span className="text-xs">Generate Report</span>
          </Button>
        </div>
      </CardContent>
    </>
  );
};

const RecentActivityWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  return (
    <>
      <CardHeader>
        <CardTitle>{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {widget.data?.activities?.map((activity: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                {activity.user.charAt(0)}
              </div>
              <span>
                <span className="font-medium">{activity.user}</span> {activity.action}{" "}
                <span className="font-medium">{activity.target}</span>
                <span className="text-xs text-muted-foreground block">
                  {activity.time}
                </span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </>
  );
};

export default CustomDashboard;
