import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
    ArrowUpDown,
    Calendar,
    CheckSquare,
    Clock,
    Edit,
    Eye,
    Flag,
    Layers,
    MoreHorizontal,
    Plus,
    Search,
    Trash2
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, Task as TaskType } from '@/hooks/useTasks';
import { useQueryClient } from '@tanstack/react-query';
import {
  getPriorityFromLabel,
  getPriorityLabel,
  getStatusFromLabel,
  getStatusLabel,
} from '@/lib/domain-utils/task-utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  dueDate: string;
  assignee: string;
  tags: string[];
  estimatedHours?: number;
  actualHours?: number;
  createdDate: string;
  updatedDate: string;
}

interface ProjectTasksListProps {
  projectId?: string;
}

const ProjectTasksList = ({ projectId }: ProjectTasksListProps) => {
  // Ensure projectId is available
  if (!projectId) {
    console.error('ProjectTasksList: projectId is required but was not provided');
    return (
      <div className="p-4 text-center text-muted-foreground">
        Project ID is missing. Please navigate to a valid project.
      </div>
    );
  }
  
  // Fetch real tasks from API
  const { data: apiTasks = [], isLoading: tasksLoading } = useTasks(projectId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Task | null;
    direction: 'asc' | 'desc'
  }>({ key: null, direction: 'asc' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  
  // Derive a human-readable assignee label from the task's assignees.
  const getAssigneeDisplay = (assignees?: { user?: { name?: string; email?: string } }[]): string => {
    if (!assignees || assignees.length === 0) return 'Unassigned';
    const first = assignees[0]?.user;
    const firstName = first?.name || first?.email || 'Unknown';
    return assignees.length > 1 ? `${firstName} +${assignees.length - 1}` : firstName;
  };

  // Transform API tasks to local format
  const tasks: Task[] = apiTasks.map(apiTask => ({
    id: apiTask.id,
    title: apiTask.title,
    description: apiTask.description || '',
    priority: getPriorityLabel(apiTask.priority),
    status: getStatusLabel(apiTask.status),
    dueDate: apiTask.dueDate ? new Date(apiTask.dueDate).toISOString().split('T')[0] : '',
    assignee: getAssigneeDisplay(apiTask.assignees),
    tags: apiTask.tags || [],
    estimatedHours: apiTask.estimatedHours || undefined,
    actualHours: apiTask.actualHours || 0,
    createdDate: apiTask.createdAt ? new Date(apiTask.createdAt).toISOString().split('T')[0] : '',
    updatedDate: apiTask.updatedAt ? new Date(apiTask.updatedAt).toISOString().split('T')[0] : ''
  }));
  
  const loading = tasksLoading;
  
  const handleSort = (key: keyof Task) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };
  
  const sortedTasks = React.useMemo(() => {
    const tasksToSort = [...tasks];
    if (sortConfig.key) {
      tasksToSort.sort((a, b) => {
        if (a[sortConfig.key!] < b[sortConfig.key!]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key!] > b[sortConfig.key!]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return tasksToSort;
  }, [tasks, sortConfig]);
  
  const filteredTasks = sortedTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesAssignee = filterAssignee === 'all' || task.assignee === filterAssignee;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });
  
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
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      const allIds = filteredTasks.map(task => task.id);
      setSelectedTasks(new Set(allIds));
    }
  };
  
  const handleBulkAction = async (action: string) => {
    if (selectedTasks.size === 0) {
      toast.error("No tasks selected");
      return;
    }
    
    if (action === 'delete') {
      try {
        await Promise.all(Array.from(selectedTasks).map(id => deleteTask.mutateAsync(id)));
        setSelectedTasks(new Set());
        toast.success(`Deleted ${selectedTasks.size} tasks`);
      } catch (error) {
        toast.error('Failed to delete tasks');
      }
    } else if (action === 'status') {
      toast.info('Bulk status update coming soon');
    } else {
      toast.info(`${action} coming soon`);
    }
  };

  const handleCreateTask = async (taskData: any) => {
    // Use projectId from props - it should always be available when called from project page
    const currentProjectId = projectId;
    
    if (!currentProjectId) {
      console.error('Project ID is missing:', { projectId, taskData });
      toast.error('Project ID is required. Please refresh the page.');
      return;
    }

    try {
      await createTask.mutateAsync({
        title: taskData.title,
        description: taskData.description,
        priority: getPriorityFromLabel(taskData.priority),
        status: getStatusFromLabel(taskData.status),
        projectId: currentProjectId, // Use the projectId from props
        dueDate: taskData.dueDate || undefined,
        estimatedHours: taskData.estimatedHours ? parseFloat(taskData.estimatedHours) : undefined,
      });
      toast.success('Task created successfully!');
      setIsCreateTaskOpen(false);
    } catch (error: any) {
      console.error('Task creation error:', error);
      toast.error(error?.response?.data?.message || 'Failed to create task');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleUpdateTask = async (taskData: any) => {
    if (!editingTask) return;

    try {
      await updateTask.mutateAsync({
        id: editingTask.id,
        data: {
          title: taskData.title,
          description: taskData.description,
          priority: getPriorityFromLabel(taskData.priority),
          status: getStatusFromLabel(taskData.status),
          dueDate: taskData.dueDate || undefined,
          estimatedHours: taskData.estimatedHours ? parseFloat(taskData.estimatedHours) : undefined,
          actualHours: taskData.actualHours ? parseFloat(taskData.actualHours) : undefined,
        }
      });
      toast.success('Task updated successfully!');
      setEditingTask(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask.mutateAsync(taskId);
      toast.success('Task deleted successfully!');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete task');
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'To Do': return 'bg-gray-100 text-gray-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'In Review': return 'bg-purple-100 text-purple-800';
      case 'Done': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'High': return <Flag className="h-3 w-3 text-red-500" />;
      case 'Medium': return <Flag className="h-3 w-3 text-yellow-500" />;
      case 'Low': return <Flag className="h-3 w-3 text-green-500" />;
      default: return <Flag className="h-3 w-3 text-gray-500" />;
    }
  };

  const TaskForm = ({ task, onSubmit, onCancel }: { task?: Task; onSubmit: (data: any) => void; onCancel: () => void }) => {
    const [formData, setFormData] = useState({
      title: task?.title || '',
      description: task?.description || '',
      priority: task?.priority || 'Medium',
      status: task?.status || 'To Do',
      dueDate: task?.dueDate || '',
      assignee: task?.assignee || '',
      tags: task?.tags?.join(', ') || '',
      estimatedHours: task?.estimatedHours?.toString() || '',
      actualHours: task?.actualHours?.toString() || '0'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Task Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter task title"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter task description"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="To Do">To Do</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="In Review">In Review</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="assignee">Assignee</Label>
            <Select value={formData.assignee} onValueChange={(value) => setFormData({ ...formData, assignee: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="John Doe">John Doe</SelectItem>
                <SelectItem value="Alice Smith">Alice Smith</SelectItem>
                <SelectItem value="Bob Wilson">Bob Wilson</SelectItem>
                <SelectItem value="Charlie Brown">Charlie Brown</SelectItem>
                <SelectItem value="Diana Prince">Diana Prince</SelectItem>
                <SelectItem value="Eve Adams">Eve Adams</SelectItem>
                <SelectItem value="Frank Miller">Frank Miller</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="estimatedHours">Estimated Hours</Label>
            <Input
              id="estimatedHours"
              type="number"
              value={formData.estimatedHours}
              onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
              placeholder="0"
            />
          </div>
          
          {task && (
            <div>
              <Label htmlFor="actualHours">Actual Hours</Label>
              <Input
                id="actualHours"
                type="number"
                value={formData.actualHours}
                onChange={(e) => setFormData({ ...formData, actualHours: e.target.value })}
                placeholder="0"
              />
            </div>
          )}
        </div>
        
        <div>
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input
            id="tags"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="frontend, backend, design"
          />
        </div>
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {task ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    );
  };

  const TaskDetailsDialog = ({ task, onClose }: { task: Task; onClose: () => void }) => (
    <Dialog open={!!task} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getPriorityIcon(task.priority)}
            {task.title}
          </DialogTitle>
          <DialogDescription>
            Task details and information
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Badge className={`mt-1 ${getStatusColor(task.status)}`}>
                {task.status}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium">Priority</Label>
              <Badge className={`mt-1 ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </Badge>
            </div>
          </div>
          
          {task.description && (
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Assignee</Label>
              <div className="flex items-center gap-2 mt-1">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {task.assignee.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{task.assignee}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Due Date</Label>
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{task.dueDate}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Time Tracking</Label>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{task.actualHours || 0}h / {task.estimatedHours || 0}h</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Progress</Label>
              <div className="mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, ((task.actualHours || 0) / (task.estimatedHours || 1)) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {task.tags.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Tags</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {task.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <Label className="text-sm font-medium">Created</Label>
              <p className="mt-1">{task.createdDate}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Last Updated</Label>
              <p className="mt-1">{task.updatedDate}</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleEditTask(task)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Task
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Tasks</CardTitle>
          <CardDescription>Loading tasks...</CardDescription>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <p>Loading tasks...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Tasks</h2>
          <p className="text-muted-foreground">Manage and track all project tasks</p>
        </div>
        <div className="flex gap-2">
          {selectedTasks.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Bulk Actions ({selectedTasks.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkAction('status')}>
                  Update Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('assignee')}>
                  Change Assignee
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleBulkAction('delete')}
                  className="text-red-600"
                >
                  Delete Tasks
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new task to the project
                </DialogDescription>
              </DialogHeader>
              <TaskForm 
                onSubmit={handleCreateTask}
                onCancel={() => setIsCreateTaskOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="To Do">To Do</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="In Review">In Review</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              <SelectItem value="John Doe">John Doe</SelectItem>
              <SelectItem value="Alice Smith">Alice Smith</SelectItem>
              <SelectItem value="Bob Wilson">Bob Wilson</SelectItem>
              <SelectItem value="Charlie Brown">Charlie Brown</SelectItem>
              <SelectItem value="Diana Prince">Diana Prince</SelectItem>
              <SelectItem value="Eve Adams">Eve Adams</SelectItem>
              <SelectItem value="Frank Miller">Frank Miller</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('title')}
                    className="h-auto p-0 font-medium"
                  >
                    Task
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('status')}
                    className="h-auto p-0 font-medium"
                  >
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('priority')}
                    className="h-auto p-0 font-medium"
                  >
                    Priority
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('dueDate')}
                    className="h-auto p-0 font-medium"
                  >
                    Due Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedTasks.has(task.id)}
                      onCheckedChange={() => toggleSelectTask(task.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getPriorityIcon(task.priority)}
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {task.assignee.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.assignee}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{task.dueDate}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{task.actualHours || 0}h / {task.estimatedHours || 0}h</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, ((task.actualHours || 0) / (task.estimatedHours || 1)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {task.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {task.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{task.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingTask(task)}>
                          <Eye className="h-3 w-3 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditTask(task)}>
                          <Edit className="h-3 w-3 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No tasks found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterStatus !== 'all' || filterPriority !== 'all' || filterAssignee !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by creating your first task'
                }
              </p>
              {!searchQuery && filterStatus === 'all' && filterPriority === 'all' && filterAssignee === 'all' && (
                <Button onClick={() => setIsCreateTaskOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update task details
            </DialogDescription>
          </DialogHeader>
          {editingTask && (
            <TaskForm 
              task={editingTask}
              onSubmit={handleUpdateTask}
              onCancel={() => setEditingTask(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Task Details Dialog */}
      {viewingTask && (
        <TaskDetailsDialog 
          task={viewingTask} 
          onClose={() => setViewingTask(null)} 
        />
      )}
    </div>
  );
};

export default ProjectTasksList; 