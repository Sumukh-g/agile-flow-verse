import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, Eye, FileText, Filter, MoreHorizontal, Paperclip, Plus, Search, User, Users } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

// Types
export type GanttTask = {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  dependencies?: string[];
  assignee?: string;
  status: 'done' | 'working-on-it' | 'stuck' | 'not-started';
  priority: 'low' | 'medium' | 'high';
  duration: number;
  notes?: string;
  files?: number;
  groupId: string;
};

export type TaskGroup = {
  id: string;
  name: string;
  collapsed: boolean;
  color: string;
};

const INITIAL_GROUPS: TaskGroup[] = [
  { id: 'planning', name: 'Planning', collapsed: false, color: '#2563eb' },
  { id: 'execution', name: 'Execution', collapsed: false, color: '#dc2626' },
  { id: 'launch', name: 'Launch', collapsed: false, color: '#16a34a' }
];

const INITIAL_TASKS: GanttTask[] = [
  {
    id: '1',
    title: 'Task 1',
    startDate: new Date(2024, 4, 26),
    endDate: new Date(2024, 4, 29),
    progress: 100,
    status: 'done',
    priority: 'low',
    duration: 3,
    assignee: 'John Doe',
    notes: 'Action items',
    files: 1,
    groupId: 'planning'
  },
  {
    id: '2',
    title: 'Task 2',
    startDate: new Date(2024, 4, 29),
    endDate: new Date(2024, 4, 29),
    progress: 0,
    dependencies: ['1'],
    status: 'working-on-it',
    priority: 'medium',
    duration: 0,
    assignee: 'Jane Smith',
    notes: 'Meeting notes',
    groupId: 'planning'
  },
  {
    id: '3',
    title: 'Task 3',
    startDate: new Date(2024, 4, 30),
    endDate: new Date(2024, 5, 2),
    progress: 0,
    status: 'stuck',
    priority: 'high',
    duration: 3,
    groupId: 'planning'
  }
];

const STATUS_COLORS = {
  'done': '#00c875',
  'working-on-it': '#fdab3d',
  'stuck': '#e2445c',
  'not-started': '#c4c4c4'
};

const PRIORITY_COLORS = {
  'low': '#00c875',
  'medium': '#fdab3d',
  'high': '#e2445c'
};

const TEMPLATES = [
  {
    id: 'software-dev',
    name: 'Software Development',
    groups: [
      { id: 'planning', name: 'Planning', color: '#2563eb' },
      { id: 'development', name: 'Development', color: '#dc2626' },
      { id: 'testing', name: 'Testing', color: '#16a34a' },
      { id: 'deployment', name: 'Deployment', color: '#7c3aed' }
    ],
    tasks: [
      { title: 'Requirements Analysis', groupId: 'planning', duration: 5, priority: 'high' },
      { title: 'System Design', groupId: 'planning', duration: 7, priority: 'high' },
      { title: 'Frontend Development', groupId: 'development', duration: 14, priority: 'medium' },
      { title: 'Backend Development', groupId: 'development', duration: 21, priority: 'medium' },
      { title: 'Unit Testing', groupId: 'testing', duration: 7, priority: 'medium' },
      { title: 'Integration Testing', groupId: 'testing', duration: 5, priority: 'high' },
      { title: 'Production Deployment', groupId: 'deployment', duration: 2, priority: 'high' }
    ]
  },
  {
    id: 'marketing-campaign',
    name: 'Marketing Campaign',
    groups: [
      { id: 'research', name: 'Research', color: '#2563eb' },
      { id: 'creative', name: 'Creative', color: '#dc2626' },
      { id: 'execution', name: 'Execution', color: '#16a34a' },
      { id: 'analysis', name: 'Analysis', color: '#7c3aed' }
    ],
    tasks: [
      { title: 'Market Research', groupId: 'research', duration: 7, priority: 'high' },
      { title: 'Competitor Analysis', groupId: 'research', duration: 5, priority: 'medium' },
      { title: 'Creative Brief', groupId: 'creative', duration: 3, priority: 'high' },
      { title: 'Design Assets', groupId: 'creative', duration: 10, priority: 'medium' },
      { title: 'Campaign Launch', groupId: 'execution', duration: 1, priority: 'high' },
      { title: 'Performance Analysis', groupId: 'analysis', duration: 7, priority: 'medium' }
    ]
  }
];

const GanttBoard: React.FC = () => {
  const [tasks, setTasks] = useState<GanttTask[]>(INITIAL_TASKS);
  const [groups, setGroups] = useState<TaskGroup[]>(INITIAL_GROUPS);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'quarter'>('month');
  const [editingTask, setEditingTask] = useState<GanttTask | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [newTask, setNewTask] = useState<Partial<GanttTask>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate date ranges for the view
  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    
    switch (viewMode) {
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        end.setDate(start.getDate() + 6);
        break;
      case 'month':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
      case 'quarter':
        start.setMonth(Math.floor(start.getMonth() / 3) * 3);
        start.setDate(1);
        end.setMonth(start.getMonth() + 3);
        end.setDate(0);
        break;
    }
    
    return { start, end };
  };

  // Generate date headers
  const generateDateHeaders = () => {
    const { start, end } = getDateRange();
    const headers = [];
    const current = new Date(start);
    
    while (current <= end) {
      headers.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return headers;
  };

  // Calculate task position and width
  const calculateTaskPosition = (task: GanttTask) => {
    const { start, end } = getDateRange();
    const startTime = start.getTime();
    const endTime = end.getTime();
    const taskStart = Math.max(task.startDate.getTime(), startTime);
    const taskEnd = Math.min(task.endDate.getTime(), endTime);
    
    const left = ((taskStart - startTime) / (endTime - startTime)) * 100;
    const width = ((taskEnd - taskStart) / (endTime - startTime)) * 100;
    
    return { left: `${Math.max(0, left)}%`, width: `${Math.max(0, width)}%` };
  };

  // Filter tasks by search term
  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assignee?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group tasks by groupId
  const groupedTasks = groups.map(group => ({
    ...group,
    tasks: filteredTasks.filter(task => task.groupId === group.id)
  }));

  // Handle template application
  const applyTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const newGroups = template.groups.map(g => ({
      ...g,
      collapsed: false
    }));

    const startDate = new Date();
    let currentDate = new Date(startDate);
    
    const newTasks = template.tasks.map((task, index) => {
      const taskStartDate = new Date(currentDate);
      const taskEndDate = new Date(currentDate);
      taskEndDate.setDate(taskEndDate.getDate() + task.duration);
      
      currentDate.setDate(currentDate.getDate() + task.duration + 1);
      
      return {
        id: `task-${index + 1}`,
        title: task.title,
        startDate: taskStartDate,
        endDate: taskEndDate,
        progress: 0,
        status: 'not-started' as const,
        priority: task.priority as 'low' | 'medium' | 'high',
        duration: task.duration,
        groupId: task.groupId
      };
    });

    setGroups(newGroups);
    setTasks(newTasks);
    setShowTemplateDialog(false);
    toast.success(`Applied ${template.name} template`);
  };

  // Handle task creation
  const handleCreateTask = () => {
    if (!newTask.title || !newTask.groupId) {
      toast.error('Please fill in required fields');
      return;
    }

    const task: GanttTask = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      startDate: newTask.startDate || new Date(),
      endDate: newTask.endDate || new Date(),
      progress: 0,
      status: 'not-started',
      priority: newTask.priority || 'medium',
      duration: newTask.duration || 1,
      groupId: newTask.groupId,
      assignee: newTask.assignee,
      notes: newTask.notes
    };

    setTasks(prev => [...prev, task]);
    setNewTask({});
    setShowNewTaskDialog(false);
    toast.success('Task created successfully');
  };

  // Toggle group collapse
  const toggleGroupCollapse = (groupId: string) => {
    setGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, collapsed: !group.collapsed } : group
    ));
  };

  // Handle date navigation
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'quarter':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
        break;
    }
    setCurrentDate(newDate);
  };

  return (
    <div className="flex flex-col h-[700px] bg-white rounded-lg shadow-lg overflow-hidden border">
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-slate-50">
        <div className="flex items-center gap-4">
          <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New task
              </Button>
            </DialogTrigger>
          </Dialog>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <Button variant="outline" size="sm">
            <User className="h-4 w-4 mr-2" />
            Person
          </Button>
          
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          
          <Button variant="outline" size="sm">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Sort
          </Button>
          
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Hide
          </Button>
          
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Group by
          </Button>

          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Templates
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigateDate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <Button variant="outline" onClick={() => navigateDate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Select value={viewMode} onValueChange={(value: 'week' | 'month' | 'quarter') => setViewMode(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto" ref={containerRef}>
        <div className="min-w-full">
          {/* Column Headers */}
          <div className="sticky top-0 bg-white border-b z-10">
            <div className="flex">
              <div className="w-48 border-r p-3 font-medium text-sm">Task</div>
              <div className="w-32 border-r p-3 font-medium text-sm text-center">Owner</div>
              <div className="w-32 border-r p-3 font-medium text-sm text-center">Status</div>
              <div className="w-32 border-r p-3 font-medium text-sm text-center">Priority</div>
              <div className="w-40 border-r p-3 font-medium text-sm text-center">Timeline</div>
              <div className="w-32 border-r p-3 font-medium text-sm text-center">Dependency</div>
              <div className="w-32 border-r p-3 font-medium text-sm text-center">Duration</div>
              <div className="w-32 border-r p-3 font-medium text-sm text-center">Due date</div>
              <div className="w-32 border-r p-3 font-medium text-sm text-center">Notes</div>
              <div className="w-32 border-r p-3 font-medium text-sm text-center">Files</div>
              <div className="w-8"></div>
            </div>
          </div>

          {/* Task Groups and Tasks */}
          {groupedTasks.map((group) => (
            <div key={group.id}>
              {/* Group Header */}
              <div className="flex items-center bg-gray-50 border-b">
                <div className="w-48 border-r p-3 flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleGroupCollapse(group.id)}
                    className="p-0 h-auto mr-2"
                  >
                    {group.collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <span className="font-medium" style={{ color: group.color }}>
                    {group.name}
                  </span>
                </div>
                <div className="flex-1"></div>
              </div>

              {/* Tasks in Group */}
              {!group.collapsed && group.tasks.map((task) => (
                <div key={task.id} className="flex items-center border-b hover:bg-gray-50">
                  <div className="w-48 border-r p-3">
                    <div className="font-medium text-sm">{task.title}</div>
                  </div>
                  
                  <div className="w-32 border-r p-3 text-center">
                    <div className="w-8 h-8 rounded-full bg-gray-300 mx-auto flex items-center justify-center text-xs font-medium">
                      {task.assignee ? task.assignee.split(' ').map(n => n[0]).join('') : '?'}
                    </div>
                  </div>
                  
                  <div className="w-32 border-r p-3 text-center">
                    <Badge 
                      className="text-white text-xs px-2 py-1"
                      style={{ backgroundColor: STATUS_COLORS[task.status] }}
                    >
                      {task.status === 'working-on-it' ? 'Working on it' : 
                       task.status === 'not-started' ? 'Not started' :
                       task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="w-32 border-r p-3 text-center">
                    <div 
                      className="w-4 h-4 rounded-full mx-auto"
                      style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                    ></div>
                  </div>
                  
                  <div className="w-40 border-r p-3">
                    <div className="relative h-6 bg-gray-200 rounded">
                      <div 
                        className="h-full rounded"
                        style={{ 
                          backgroundColor: STATUS_COLORS[task.status],
                          width: `${task.progress}%`
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                        {task.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {task.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-32 border-r p-3 text-center">
                    {task.dependencies?.length ? (
                      <Badge variant="outline" className="text-xs">
                        Task {task.dependencies[0]}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                  
                  <div className="w-32 border-r p-3 text-center">
                    <span className="text-sm">{task.duration} days</span>
                  </div>
                  
                  <div className="w-32 border-r p-3 text-center">
                    <span className="text-sm">{task.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  
                  <div className="w-32 border-r p-3 text-center">
                    {task.notes && (
                      <FileText className="h-4 w-4 mx-auto text-gray-400" />
                    )}
                  </div>
                  
                  <div className="w-32 border-r p-3 text-center">
                    {task.files && (
                      <div className="flex items-center justify-center">
                        <Paperclip className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="text-sm">{task.files}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="w-8 p-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setEditingTask(task)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}

              {/* Add Task Row */}
              {!group.collapsed && (
                <div className="flex items-center border-b bg-gray-50/50">
                  <div className="w-48 border-r p-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-500 justify-start p-0"
                      onClick={() => {
                        setNewTask({ groupId: group.id });
                        setShowNewTaskDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add task
                    </Button>
                  </div>
                  <div className="flex-1"></div>
                </div>
              )}
            </div>
          ))}

          {/* Add Group Button */}
          <div className="p-4 border-b">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-500"
              onClick={() => {
                const newGroup: TaskGroup = {
                  id: `group-${Date.now()}`,
                  name: `New Group ${groups.length + 1}`,
                  collapsed: false,
                  color: '#2563eb'
                };
                setGroups(prev => [...prev, newGroup]);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add new group
            </Button>
          </div>
        </div>
      </div>

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {TEMPLATES.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:bg-gray-50" onClick={() => applyTemplate(template.id)}>
                <CardContent className="p-4">
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {template.tasks.length} tasks in {template.groups.length} groups
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* New Task Dialog */}
      <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newTask.title || ''}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Group</label>
              <Select value={newTask.groupId} onValueChange={(value) => setNewTask({ ...newTask, groupId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={newTask.startDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setNewTask({ ...newTask, startDate: new Date(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Duration (days)</label>
                <Input
                  type="number"
                  value={newTask.duration || ''}
                  onChange={(e) => {
                    const duration = parseInt(e.target.value);
                    const endDate = newTask.startDate ? new Date(newTask.startDate) : new Date();
                    endDate.setDate(endDate.getDate() + duration);
                    setNewTask({ ...newTask, duration, endDate });
                  }}
                  placeholder="1"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Priority</label>
              <Select value={newTask.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewTask({ ...newTask, priority: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Assignee</label>
              <Input
                value={newTask.assignee || ''}
                onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                placeholder="Enter assignee name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={newTask.notes || ''}
                onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                placeholder="Enter notes"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewTaskDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask}>
                Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Edit Dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={editingTask.startDate.toISOString().split('T')[0]}
                    onChange={(e) => setEditingTask({ ...editingTask, startDate: new Date(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={editingTask.endDate.toISOString().split('T')[0]}
                    onChange={(e) => setEditingTask({ ...editingTask, endDate: new Date(e.target.value) })}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Progress (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={editingTask.progress}
                  onChange={(e) => setEditingTask({ ...editingTask, progress: parseInt(e.target.value) })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={editingTask.status}
                    onValueChange={(value: GanttTask['status']) => setEditingTask({ ...editingTask, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-started">Not Started</SelectItem>
                      <SelectItem value="working-on-it">Working on it</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="stuck">Stuck</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={editingTask.priority}
                    onValueChange={(value: GanttTask['priority']) => setEditingTask({ ...editingTask, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingTask(null)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  setTasks(prev => prev.map(task => task.id === editingTask.id ? editingTask : task));
                  setEditingTask(null);
                  toast.success('Task updated successfully');
                }}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default GanttBoard; 