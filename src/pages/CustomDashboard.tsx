
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  LayoutDashboard, 
  Trash2, 
  Settings, 
  MoveVertical, 
  Save, 
  LineChart,
  ListChecks, 
  CalendarDays, 
  MessageSquare, 
  FileText,
  Users, 
  Activity, 
  Clock,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

// Define types for dashboard widgets
interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  width: 'full' | 'half' | 'third';
  height: 'small' | 'medium' | 'large';
  config?: Record<string, any>;
}

// Widget options to choose from
const WIDGET_TYPES = [
  { id: 'tasks', name: 'Tasks', icon: ListChecks, description: 'Show your tasks and to-dos' },
  { id: 'calendar', name: 'Calendar', icon: CalendarDays, description: 'Upcoming events and deadlines' },
  { id: 'chart', name: 'Chart', icon: LineChart, description: 'Visualize data with charts' },
  { id: 'activity', name: 'Activity', icon: Activity, description: 'Recent activity feed' },
  { id: 'notes', name: 'Notes', icon: FileText, description: 'Quick notes and reminders' },
  { id: 'timer', name: 'Timer', icon: Clock, description: 'Time tracking widget' },
  { id: 'team', name: 'Team', icon: Users, description: 'Team members and workload' },
  { id: 'metrics', name: 'Metrics', icon: BarChart3, description: 'Key metrics and stats' }
];

const CustomDashboard = () => {
  const [editMode, setEditMode] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [savedDashboards, setSavedDashboards] = useState<{id: string, name: string}[]>([
    { id: 'd1', name: 'My Dashboard' }
  ]);
  const [activeDashboard, setActiveDashboard] = useState('d1');
  const [newWidgetType, setNewWidgetType] = useState('');
  const [newWidgetConfig, setNewWidgetConfig] = useState<Partial<DashboardWidget>>({
    title: '',
    width: 'half',
    height: 'medium'
  });
  const [widgetDialogOpen, setWidgetDialogOpen] = useState(false);
  
  useEffect(() => {
    // Simulate loading saved widgets
    setTimeout(() => {
      const savedWidgets: DashboardWidget[] = [
        {
          id: 'w1',
          type: 'tasks',
          title: 'My Tasks',
          width: 'half',
          height: 'medium',
          config: { 
            filter: 'assigned-to-me',
            status: 'open',
            limit: 5
          }
        },
        {
          id: 'w2',
          type: 'chart',
          title: 'Task Completion',
          width: 'half',
          height: 'medium',
          config: { 
            chartType: 'line',
            timeRange: 'week'
          }
        },
        {
          id: 'w3',
          type: 'calendar',
          title: 'Upcoming Deadlines',
          width: 'full',
          height: 'small',
          config: { 
            view: 'week',
            showCompleted: false
          }
        },
        {
          id: 'w4',
          type: 'notes',
          title: 'Quick Notes',
          width: 'third',
          height: 'medium',
          config: { 
            sortBy: 'recent'
          }
        },
        {
          id: 'w5',
          type: 'activity',
          title: 'Recent Activity',
          width: 'third',
          height: 'medium',
          config: { 
            types: ['comments', 'updates', 'mentions'],
            limit: 5
          }
        },
        {
          id: 'w6',
          type: 'team',
          title: 'Team Status',
          width: 'third',
          height: 'medium',
          config: { 
            showAvailability: true
          }
        }
      ];
      setWidgets(savedWidgets);
    }, 500);
  }, [activeDashboard]);
  
  const addNewWidget = () => {
    if (!newWidgetType) {
      toast.error('Please select a widget type');
      return;
    }
    
    if (!newWidgetConfig.title) {
      toast.error('Please enter a widget title');
      return;
    }
    
    const selectedType = WIDGET_TYPES.find(type => type.id === newWidgetType);
    if (!selectedType) return;
    
    const newWidget: DashboardWidget = {
      id: `w${Date.now()}`,
      type: newWidgetType,
      title: newWidgetConfig.title || selectedType.name,
      width: newWidgetConfig.width || 'half',
      height: newWidgetConfig.height || 'medium',
      config: {}
    };
    
    setWidgets([...widgets, newWidget]);
    setWidgetDialogOpen(false);
    setNewWidgetType('');
    setNewWidgetConfig({
      title: '',
      width: 'half',
      height: 'medium'
    });
    
    toast.success('Widget added successfully');
  };
  
  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(widget => widget.id !== id));
    toast.success('Widget removed');
  };
  
  const saveDashboard = () => {
    // In a real app, this would save to an API or localStorage
    toast.success('Dashboard saved successfully');
    setEditMode(false);
  };
  
  const renderWidgetContent = (widget: DashboardWidget) => {
    switch (widget.type) {
      case 'tasks':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Pending Tasks</h4>
              <span className="text-xs text-muted-foreground">View all</span>
            </div>
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center">
                <div className="mr-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-sm">Task {i+1} - Due {i+1} days</div>
              </div>
            ))}
          </div>
        );
      
      case 'chart':
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <LineChart className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">
                Chart visualization will appear here
              </p>
            </div>
          </div>
        );
      
      case 'calendar':
        return (
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="font-medium">{day}</div>
            ))}
            {Array(7).fill(0).map((_, i) => (
              <div key={i} className="aspect-square flex items-center justify-center border rounded-sm">
                {i + 1}
              </div>
            ))}
          </div>
        );
      
      case 'activity':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Recent Activity</h4>
              <span className="text-xs text-muted-foreground">View all</span>
            </div>
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium">User {i+1}</span>
                <span className="text-muted-foreground"> updated </span>
                <span className="font-medium">Item {i+1}</span>
              </div>
            ))}
          </div>
        );
      
      case 'notes':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Notes</h4>
              <span className="text-xs text-muted-foreground">View all</span>
            </div>
            <div className="bg-muted/50 p-3 rounded-md text-sm">
              Sample note content will appear here. Click to edit.
            </div>
          </div>
        );
      
      case 'timer':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <Clock className="h-8 w-8 mb-2 text-muted-foreground" />
            <div className="text-2xl font-mono">00:00:00</div>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm">Start</Button>
              <Button variant="outline" size="sm">Reset</Button>
            </div>
          </div>
        );
      
      case 'team':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Team Members</h4>
              <span className="text-xs text-muted-foreground">View all</span>
            </div>
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-xs text-white flex items-center justify-center">
                    U{i+1}
                  </div>
                  <span className="text-sm">User {i+1}</span>
                </div>
                <span className={`text-xs ${i === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                  {i === 0 ? 'Available' : 'Busy'}
                </span>
              </div>
            ))}
          </div>
        );
      
      case 'metrics':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 border rounded-md">
              <div className="text-xs text-muted-foreground">Tasks</div>
              <div className="font-medium">24</div>
            </div>
            <div className="p-2 border rounded-md">
              <div className="text-xs text-muted-foreground">Projects</div>
              <div className="font-medium">5</div>
            </div>
            <div className="p-2 border rounded-md">
              <div className="text-xs text-muted-foreground">Completed</div>
              <div className="font-medium">18</div>
            </div>
            <div className="p-2 border rounded-md">
              <div className="text-xs text-muted-foreground">Pending</div>
              <div className="font-medium">6</div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Widget content
          </div>
        );
    }
  };
  
  const getWidgetIcon = (type: string) => {
    const widgetType = WIDGET_TYPES.find(t => t.id === type);
    const IconComponent = widgetType?.icon || LayoutDashboard;
    return <IconComponent className="h-4 w-4" />;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custom Dashboard</h1>
          <p className="text-muted-foreground">
            Create your personalized dashboard with the widgets you need
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button onClick={saveDashboard}>
                <Save className="mr-2 h-4 w-4" />
                Save Layout
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Edit Dashboard
            </Button>
          )}
        </div>
      </div>
      
      {/* Dashboard selector */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              <Select value={activeDashboard} onValueChange={setActiveDashboard}>
                <SelectTrigger className="w-[180px] border-none shadow-none focus:ring-0 p-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {savedDashboards.map(dashboard => (
                    <SelectItem key={dashboard.id} value={dashboard.id}>
                      {dashboard.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              {editMode && (
                <Dialog open={widgetDialogOpen} onOpenChange={setWidgetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Widget
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Widget</DialogTitle>
                      <DialogDescription>
                        Choose a widget type and configure its settings
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Tabs defaultValue="select" className="mt-4">
                      <TabsList className="mb-4">
                        <TabsTrigger value="select">Select Widget</TabsTrigger>
                        <TabsTrigger value="configure">Configure</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="select" className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {WIDGET_TYPES.map(widget => (
                            <div 
                              key={widget.id} 
                              className={`border rounded-md p-4 cursor-pointer transition-all ${
                                newWidgetType === widget.id ? 
                                'border-primary bg-primary/5' : 
                                'hover:border-primary/50'
                              }`}
                              onClick={() => setNewWidgetType(widget.id)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-md bg-primary/10">
                                  <widget.icon className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h3 className="font-medium">{widget.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {widget.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="configure" className="space-y-4">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor="widget-title">Widget Title</Label>
                            <Input 
                              id="widget-title" 
                              value={newWidgetConfig.title} 
                              onChange={(e) => setNewWidgetConfig({...newWidgetConfig, title: e.target.value})}
                              placeholder="Enter title for widget"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label htmlFor="widget-width">Width</Label>
                              <Select 
                                value={newWidgetConfig.width} 
                                onValueChange={(value) => setNewWidgetConfig({
                                  ...newWidgetConfig, 
                                  width: value as 'full' | 'half' | 'third'
                                })}
                              >
                                <SelectTrigger id="widget-width">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="full">Full Width</SelectItem>
                                  <SelectItem value="half">Half Width</SelectItem>
                                  <SelectItem value="third">One Third</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-1">
                              <Label htmlFor="widget-height">Height</Label>
                              <Select 
                                value={newWidgetConfig.height} 
                                onValueChange={(value) => setNewWidgetConfig({
                                  ...newWidgetConfig, 
                                  height: value as 'small' | 'medium' | 'large'
                                })}
                              >
                                <SelectTrigger id="widget-height">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="small">Small</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="large">Large</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setWidgetDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={addNewWidget}>
                        Add Widget
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {/* Dashboard widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/5">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Your dashboard is empty</h3>
            <p className="text-center text-muted-foreground mb-4">
              Add widgets to customize your dashboard
            </p>
            <Button onClick={() => {
              setEditMode(true);
              setTimeout(() => setWidgetDialogOpen(true), 100);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Widget
            </Button>
          </div>
        ) : (
          <>
            {widgets.map((widget) => {
              const colSpan = 
                widget.width === 'full' ? 'col-span-full' : 
                widget.width === 'half' ? 'lg:col-span-2 md:col-span-2' : '';
              
              const height = 
                widget.height === 'small' ? 'h-[120px]' : 
                widget.height === 'large' ? 'h-[300px]' : 
                'h-[200px]';
              
              return (
                <Card 
                  key={widget.id} 
                  className={`${colSpan} ${editMode ? 'border-dashed border-2' : ''}`}
                >
                  <CardHeader className="p-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {getWidgetIcon(widget.type)}
                      {widget.title}
                    </CardTitle>
                    
                    {editMode && (
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => toast.info('Move widget')}
                        >
                          <MoveVertical className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500"
                          onClick={() => removeWidget(widget.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className={`p-4 ${height} overflow-hidden`}>
                    {renderWidgetContent(widget)}
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomDashboard;
