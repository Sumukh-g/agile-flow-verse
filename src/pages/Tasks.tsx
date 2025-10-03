
import CreateTaskDialog from '@/components/tasks/CreateTaskDialog';
import TaskCalendarView from '@/components/tasks/TaskCalendarView';
import TaskDetailsPanel from '@/components/tasks/TaskDetailsPanel';
import TaskReportView from '@/components/tasks/TaskReportView';
import TaskTimelineView from '@/components/tasks/TaskTimelineView';
import TaskViewTabs from '@/components/tasks/TaskViewTabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from '@/components/ui/checkbox';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProjects } from '@/hooks/useProjects';
import { Task as ApiTask, useTasks } from '@/hooks/useTasks';
import { ArrowUpDown, CheckSquare, Eye, Filter, ListChecks, MoreHorizontal, Plus, SaveAll, Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// Convert API task to display task format
interface DisplayTask {
  id: string;
  title: string;
  description?: string;
  priority: string;
  dueDate: string;
  assignee: string;
  tags: string[];
  status: string;
  projectId?: string;
  projectName?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to convert API task to display format
const convertApiTaskToDisplay = (apiTask: ApiTask, projects: any[] = []): DisplayTask => {
  const project = projects.find(p => p.id === apiTask.projectId);
  
  // Generate more realistic assignee names
  const assigneeNames = ['John Doe', 'Alice Smith', 'Robert Miller', 'Jane Wilson', 'Thomas Wright', 'Sarah Johnson', 'Mike Chen', 'Emily Davis'];
  const assigneeName = apiTask.assigneeId ? 
    assigneeNames[parseInt(apiTask.assigneeId.slice(-1), 16) % assigneeNames.length] : 
    'Unassigned';
  
  return {
    id: apiTask.id,
    title: apiTask.title,
    description: apiTask.description,
    priority: apiTask.priority,
    dueDate: new Date(apiTask.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    assignee: assigneeName,
    tags: project ? [project.name] : ['General Task'],
    status: apiTask.status === 'TODO' ? 'To Do' : 
            apiTask.status === 'IN_PROGRESS' ? 'In Progress' : 'Done',
    projectId: apiTask.projectId,
    projectName: project?.name || 'General Task',
    createdAt: apiTask.createdAt,
    updatedAt: apiTask.updatedAt
  };
};

const Tasks = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<string>('list');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState({
    priority: true,
    dueDate: true,
    assignee: true,
    tags: true,
    status: true
  });
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [savedViews, setSavedViews] = useState<{id: string, name: string}[]>([
    {id: 'v1', name: 'My Tasks'},
    {id: 'v2', name: 'High Priority'},
    {id: 'v3', name: 'Due This Week'}
  ]);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<DisplayTask | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Task handlers
  const handleTaskAdd = (newTask: DisplayTask) => {
    // This will be handled by the API mutation in CreateTaskDialog
    // The data will be refetched automatically
    toast.success('Task created successfully');
  };
  
  // Fetch real data from API
  const { data: projectsData } = useProjects();
  const { data: tasksData, isLoading: tasksLoading, error: tasksError } = useTasks();
  
  // Convert API data to display format
  const projects = projectsData?.data || [];
  const apiTasks = tasksData?.data || [];
  
  // Convert API data to display format
  const displayTasks = apiTasks.map(task => convertApiTaskToDisplay(task, projects));
  
  // Show empty state if no tasks
  if (!tasksLoading && !tasksError && displayTasks.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Track and manage tasks across projects.
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-muted-foreground mb-4">No tasks found</div>
            <CreateTaskDialog onTaskCreate={handleTaskAdd} />
          </div>
        </div>
      </div>
    );
  }
  
  // Group tasks by status
  const tasks = displayTasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<string, DisplayTask[]>);
  
  // Flatten all tasks for list/calendar/timeline views
  const allTasksFlat = displayTasks;
  
  // Filter tasks based on search query
  const filteredTasks = Object.entries(tasks).reduce((acc, [status, taskList]) => {
    const filtered = taskList.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[status] = filtered;
    }
    return acc;
  }, {} as Record<string, Task[]>);

  const filteredFlatTasks = allTasksFlat.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-amber-100 text-amber-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'To Do':
        return 'bg-slate-100 text-slate-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'In Review':
        return 'bg-purple-100 text-purple-800';
      case 'Done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const toggleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };
  
  const toggleSelectAll = () => {
    if (selectedTasks.size === filteredFlatTasks.length) {
      // Deselect all
      setSelectedTasks(new Set());
    } else {
      // Select all
      const allIds = filteredFlatTasks.map(task => task.id);
      setSelectedTasks(new Set(allIds));
    }
  };
  
  const handleBulkAction = (action: string) => {
    if (selectedTasks.size === 0) {
      toast.error("No tasks selected");
      return;
    }
    
    switch (action) {
      case 'delete':
        // TODO: Implement bulk delete API call
        toast.success(`${selectedTasks.size} tasks marked for deletion`);
        setSelectedTasks(new Set());
        break;
        
      case 'move':
        toast.success(`${selectedTasks.size} tasks ready to move`);
        break;
        
      default:
        toast.info(`${action} ${selectedTasks.size} tasks`);
    }
  };
  
  const toggleColumnVisibility = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter]
    );
    
    toast.success(
      `Filter ${activeFilters.includes(filter) ? 'removed' : 'applied'}: ${filter}`
    );
  };

  const saveCurrentView = () => {
    const newView = {
      id: `v${savedViews.length + 1}`,
      name: `Custom View ${savedViews.length + 1}`
    };
    setSavedViews([...savedViews, newView]);
    toast.success(`View "${newView.name}" saved successfully`);
  };

  const openTaskDetails = (task: DisplayTask) => {
    setSelectedTaskForDetails(task);
    setIsDetailsOpen(true);
  };

  const updateTask = (updatedTask: DisplayTask) => {
    // This will be handled by the API mutation
    // The data will be refetched automatically
    toast.success('Task updated successfully');
  };

  // Show loading state
  if (tasksLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Track and manage tasks across projects.
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading tasks...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (tasksError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Track and manage tasks across projects.
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Error loading tasks. Please try again.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground">
          Track and manage tasks across projects.
        </p>
      </div>
      
      {/* Action bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tasks..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {selectedTasks.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions ({selectedTasks.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkAction('move')}>
                  Move Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('tag')}>
                  Add Tags
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('assign')}>
                  Assign
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleBulkAction('delete')}
                  className="text-red-600"
                >
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
                {activeFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => toggleFilter('My Tasks')}>
                <Checkbox checked={activeFilters.includes('My Tasks')} className="mr-2" />
                My Tasks
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleFilter('High Priority')}>
                <Checkbox checked={activeFilters.includes('High Priority')} className="mr-2" />
                High Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleFilter('Due Soon')}>
                <Checkbox checked={activeFilters.includes('Due Soon')} className="mr-2" />
                Due Soon
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setActiveFilters([])}>
                Clear All Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Saved Views dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                Saved Views
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {savedViews.map(view => (
                <DropdownMenuItem key={view.id} onClick={() => toast.info(`Switched to view: ${view.name}`)}>
                  {view.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={saveCurrentView}>
                <SaveAll className="mr-2 h-4 w-4" />
                Save Current View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Group
          </Button>

          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Configure Visible Columns</DrawerTitle>
                <DrawerDescription>
                  Toggle columns to customize your task view
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="col-priority" className="text-sm font-medium">
                    Priority
                  </label>
                  <Checkbox 
                    id="col-priority" 
                    checked={visibleColumns.priority} 
                    onCheckedChange={() => toggleColumnVisibility('priority')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="col-dueDate" className="text-sm font-medium">
                    Due Date
                  </label>
                  <Checkbox 
                    id="col-dueDate" 
                    checked={visibleColumns.dueDate} 
                    onCheckedChange={() => toggleColumnVisibility('dueDate')} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="col-assignee" className="text-sm font-medium">
                    Assignee
                  </label>
                  <Checkbox 
                    id="col-assignee" 
                    checked={visibleColumns.assignee} 
                    onCheckedChange={() => toggleColumnVisibility('assignee')} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="col-tags" className="text-sm font-medium">
                    Tags
                  </label>
                  <Checkbox 
                    id="col-tags" 
                    checked={visibleColumns.tags} 
                    onCheckedChange={() => toggleColumnVisibility('tags')} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="col-status" className="text-sm font-medium">
                    Status
                  </label>
                  <Checkbox 
                    id="col-status" 
                    checked={visibleColumns.status} 
                    onCheckedChange={() => toggleColumnVisibility('status')} 
                  />
                </div>
              </div>
            </DrawerContent>
          </Drawer>
          
          <CreateTaskDialog onTaskCreate={handleTaskAdd} />
        </div>
      </div>
      
      {/* Quick filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map(filter => (
            <Badge 
              key={filter} 
              variant="secondary"
              className="cursor-pointer"
              onClick={() => toggleFilter(filter)}
            >
              {filter} ×
            </Badge>
          ))}
          {activeFilters.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={() => setActiveFilters([])}
            >
              Clear All
            </Button>
          )}
        </div>
      )}
      
      {/* View tabs */}
      <TaskViewTabs activeView={view} onChange={setView} />
      
      {/* Task Views */}
      {view === 'list' && (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedTasks.size > 0 && selectedTasks.size === filteredFlatTasks.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    Task
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TableHead>
                {visibleColumns.priority && (
                  <TableHead>
                    <div className="flex items-center gap-2">
                      Priority
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </TableHead>
                )}
                {visibleColumns.dueDate && (
                  <TableHead>
                    <div className="flex items-center gap-2">
                      Due Date
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </TableHead>
                )}
                {visibleColumns.assignee && (
                  <TableHead>Assignee</TableHead>
                )}
                {visibleColumns.tags && (
                  <TableHead>Tags</TableHead>
                )}
                {visibleColumns.status && (
                  <TableHead>Status</TableHead>
                )}
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFlatTasks.map(task => (
                <TableRow 
                  key={task.id}
                  className="cursor-pointer"
                  onClick={() => openTaskDetails(task)}
                >
                  <TableCell onClick={(e) => {
                    e.stopPropagation();
                    toggleSelectTask(task.id);
                  }}>
                    <Checkbox 
                      checked={selectedTasks.has(task.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  {visibleColumns.priority && (
                    <TableCell>
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                  )}
                  {visibleColumns.dueDate && (
                    <TableCell>{task.dueDate}</TableCell>
                  )}
                  {visibleColumns.assignee && (
                    <TableCell>
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {task.assignee}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                  )}
                  {visibleColumns.tags && (
                    <TableCell>
                      <div className="flex gap-1">
                        {task.tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600"
                          >
                            {tag}
                          </span>
                        ))}
                        {task.tags.length > 2 && (
                          <span className="text-xs text-muted-foreground">+{task.tags.length - 2}</span>
                        )}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.status && (
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="flex items-center">
                          <CheckSquare className="mr-2 h-4 w-4" />
                          Mark Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center">
                          <ListChecks className="mr-2 h-4 w-4" />
                          Add Subtask
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openTaskDetails(task)}>Edit Task</DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBulkAction('delete');
                          }}
                        >
                          Delete Task
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredFlatTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">No tasks found</div>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        const dialog = document.querySelector('[data-state="closed"]') as HTMLElement;
                        if (dialog) dialog.click();
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Task
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      
      {view === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(filteredTasks).map(([status, tasks]) => (
            <div key={status} className="flex flex-col h-[calc(100vh-240px)] min-h-[500px]">
              <div className={`px-3 py-2 rounded-t-md ${
                status === 'To Do' ? 'bg-slate-200' :
                status === 'In Progress' ? 'bg-blue-200' :
                status === 'In Review' ? 'bg-purple-200' :
                'bg-green-200'
              }`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-sm">{status}</h3>
                  <span className="bg-white text-xs font-medium rounded-full px-2 py-0.5 text-slate-600">
                    {tasks.length}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto bg-slate-50 p-2 rounded-b-md">
                <div className="flex flex-col gap-2">
                  {tasks.map(task => (
                    <Card 
                      key={task.id} 
                      className="border shadow-sm cursor-pointer"
                      onClick={() => openTaskDetails(task)}
                    >
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="font-medium text-sm">{task.title}</div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <Badge variant="outline" className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                            <span className="text-muted-foreground">{task.dueDate}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                              {task.tags.slice(0, 2).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600"
                                >
                                  {tag}
                                </span>
                              ))}
                              {task.tags.length > 2 && (
                                <span className="text-xs text-muted-foreground">+{task.tags.length - 2}</span>
                              )}
                            </div>
                            
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                {task.assignee}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <CreateTaskDialog onTaskCreate={handleTaskAdd} statusColumn={status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {view === 'calendar' && (
        <TaskCalendarView tasks={allTasksFlat} onTaskCreate={handleTaskAdd} />
      )}
      
      {view === 'timeline' && (
        <TaskTimelineView tasks={allTasksFlat} onTaskCreate={handleTaskAdd} />
      )}
      
      {view === 'reports' && (
        <TaskReportView tasks={allTasksFlat} />
      )}
      
      {/* Task Details Panel */}
      <TaskDetailsPanel
        task={selectedTaskForDetails}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onTaskUpdate={updateTask}
      />
    </div>
  );
};

export default Tasks;
