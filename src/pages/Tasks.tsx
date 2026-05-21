
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Filter, Plus, SlidersHorizontal, Lock, ArrowUpDown, Eye, EyeOff, MoreHorizontal, CheckSquare, ListChecks, SaveAll } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import TaskViewTabs from '@/components/tasks/TaskViewTabs';
import CreateTaskDialog from '@/components/tasks/CreateTaskDialog';
import TaskCalendarView from '@/components/tasks/TaskCalendarView';
import TaskTimelineView from '@/components/tasks/TaskTimelineView';
import TaskReportView from '@/components/tasks/TaskReportView';
import TaskDetailsPanel from '@/components/tasks/TaskDetailsPanel';
import { toast } from 'sonner';
import { useTasks, Task as ApiTask } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';

// Task data
const INITIAL_TASKS = {
  'To Do': [
    {
      id: 't1',
      title: 'Research competitor features',
      priority: 'Medium',
      dueDate: 'May 20',
      assignee: 'JD',
      tags: ['Research', 'Product'],
      status: 'To Do'
    },
    {
      id: 't2',
      title: 'Review design mockups',
      priority: 'High',
      dueDate: 'May 18',
      assignee: 'AS',
      tags: ['Design', 'Review'],
      status: 'To Do'
    },
    {
      id: 't3',
      title: 'Setup analytics tracking',
      priority: 'Low',
      dueDate: 'May 25',
      assignee: 'RM',
      tags: ['Marketing', 'Analytics'],
      status: 'To Do'
    }
  ],
  'In Progress': [
    {
      id: 't4',
      title: 'Create user onboarding flow',
      priority: 'High',
      dueDate: 'May 19',
      assignee: 'JW',
      tags: ['UX', 'Design'],
      status: 'In Progress'
    },
    {
      id: 't5',
      title: 'Implement authentication system',
      priority: 'High',
      dueDate: 'May 18',
      assignee: 'TW',
      tags: ['Backend', 'Security'],
      status: 'In Progress'
    }
  ],
  'In Review': [
    {
      id: 't6',
      title: 'Optimize homepage load time',
      priority: 'Medium',
      dueDate: 'May 15',
      assignee: 'JD',
      tags: ['Performance', 'Frontend'],
      status: 'In Review'
    },
    {
      id: 't7',
      title: 'Add payment processing feature',
      priority: 'Medium',
      dueDate: 'May 16',
      assignee: 'RM',
      tags: ['Backend', 'Payment'],
      status: 'In Review'
    }
  ],
  'Done': [
    {
      id: 't8',
      title: 'Create marketing landing page',
      priority: 'High',
      dueDate: 'May 12',
      assignee: 'AS',
      tags: ['Marketing', 'Frontend'],
      status: 'Done'
    },
    {
      id: 't9',
      title: 'Conduct user interviews',
      priority: 'Medium',
      dueDate: 'May 10',
      assignee: 'JW',
      tags: ['Research', 'UX'],
      status: 'Done'
    },
    {
      id: 't10',
      title: 'Fix login page bugs',
      priority: 'High',
      dueDate: 'May 11',
      assignee: 'TW',
      tags: ['Bug', 'Frontend'],
      status: 'Done'
    }
  ]
};

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  dueDate: string;
  assignee: string;
  tags: string[];
  status: string;
}

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
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  
  // Fetch tasks from API
  const { data: apiTasks = [], isLoading: tasksLoading } = useTasks(
    selectedProjectFilter === 'all' ? undefined : selectedProjectFilter
  );
  const { data: projects = [] } = useProjects();
  
  // Transform API tasks to local format for compatibility
  const tasksByStatus = React.useMemo(() => {
    const grouped: Record<string, Task[]> = {
      'To Do': [],
      'In Progress': [],
      'In Review': [],
      'Done': []
    };
    
    apiTasks.forEach(apiTask => {
      const task: Task = {
        id: apiTask.id,
        title: apiTask.title,
        description: apiTask.description,
        priority: apiTask.priority === 'critical' ? 'High' : apiTask.priority.charAt(0).toUpperCase() + apiTask.priority.slice(1),
        status: apiTask.status === 'todo' ? 'To Do' : 
                apiTask.status === 'in-progress' ? 'In Progress' : 
                apiTask.status === 'review' ? 'In Review' : 
                apiTask.status === 'done' ? 'Done' : apiTask.status,
        dueDate: apiTask.dueDate ? new Date(apiTask.dueDate).toLocaleDateString() : '',
        assignee: apiTask.assignees?.[0]?.user?.name || 'Unassigned',
        tags: apiTask.tags || []
      };
      
      const statusKey = task.status === 'To Do' ? 'To Do' :
                       task.status === 'In Progress' ? 'In Progress' :
                       task.status === 'In Review' ? 'In Review' :
                       task.status === 'Done' ? 'Done' : 'To Do';
      
      grouped[statusKey].push(task);
    });
    
    return grouped;
  }, [apiTasks]);
  
  const tasks = tasksByStatus;
  
  // Flatten all tasks for list/calendar/timeline views
  const allTasksFlat = React.useMemo(() => {
    return Object.values(tasks).flat();
  }, [tasks]);
  
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

  const handleTaskAdd = () => {
    // Task creation is now handled by CreateTaskDialog via API
    // This callback is optional and can trigger a refresh if needed
    // The query will automatically refetch when the mutation succeeds
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
        setTasks(prev => {
          const newTasks = { ...prev };
          for (const [status, taskList] of Object.entries(newTasks)) {
            newTasks[status] = taskList.filter(task => !selectedTasks.has(task.id));
          }
          return newTasks;
        });
        toast.success(`${selectedTasks.size} tasks deleted`);
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

  const openTaskDetails = (task: Task) => {
    setSelectedTaskForDetails(task);
    setIsDetailsOpen(true);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(prev => {
      const newTasks = { ...prev };
      for (const [status, taskList] of Object.entries(newTasks)) {
        newTasks[status] = taskList.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        );
      }
      return newTasks;
    });
  };

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
          {/* Project Filter */}
          <Select value={selectedProjectFilter} onValueChange={setSelectedProjectFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="personal">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Personal Tasks</span>
                </div>
              </SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
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
