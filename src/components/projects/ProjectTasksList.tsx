
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Search, Filter, Plus, ArrowUpDown, MoreHorizontal,
  CheckSquare, Layers, Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  priority: string;
  status: string;
  dueDate: string;
  assignee: string;
  tags: string[];
  description?: string;
}

interface ProjectTasksListProps {
  projectId?: string;
}

const ProjectTasksList = ({ projectId }: ProjectTasksListProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Task | null;
    direction: 'asc' | 'desc'
  }>({ key: null, direction: 'asc' });
  
  useEffect(() => {
    // Fetch tasks for specific project
    setTimeout(() => {
      const mockTasks: Task[] = [
        {
          id: 't1',
          title: 'Design system components',
          priority: 'High',
          status: 'In Progress',
          dueDate: '2023-06-10',
          assignee: 'JD',
          tags: ['Design', 'UI']
        },
        {
          id: 't2',
          title: 'API integration for authentication',
          priority: 'High',
          status: 'To Do',
          dueDate: '2023-06-15',
          assignee: 'TW',
          tags: ['Backend', 'API']
        },
        {
          id: 't3',
          title: 'User feedback analysis',
          priority: 'Medium',
          status: 'To Do',
          dueDate: '2023-06-20',
          assignee: 'AS',
          tags: ['Research', 'UX']
        },
        {
          id: 't4',
          title: 'Mobile responsive layouts',
          priority: 'Medium',
          status: 'In Progress',
          dueDate: '2023-06-12',
          assignee: 'RM',
          tags: ['Frontend', 'Mobile']
        },
        {
          id: 't5',
          title: 'Documentation update',
          priority: 'Low',
          status: 'Done',
          dueDate: '2023-06-05',
          assignee: 'JD',
          tags: ['Documentation']
        }
      ];
      setTasks(mockTasks);
      setLoading(false);
    }, 800);
  }, [projectId]);
  
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
  
  const filteredTasks = sortedTasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
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
      // Deselect all
      setSelectedTasks(new Set());
    } else {
      // Select all
      const allIds = filteredTasks.map(task => task.id);
      setSelectedTasks(new Set(allIds));
    }
  };
  
  const handleBulkAction = (action: string) => {
    if (selectedTasks.size === 0) {
      toast.error("No tasks selected");
      return;
    }
    
    toast.success(`${action} ${selectedTasks.size} tasks`);
    if (action === 'delete') {
      setTasks(prevTasks => prevTasks.filter(task => !selectedTasks.has(task.id)));
      setSelectedTasks(new Set());
    }
  };
  
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
      case 'Done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Tasks</CardTitle>
          <CardDescription>Loading tasks...</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px] flex items-center justify-center">
          <div className="animate-pulse text-center">
            <p>Loading task list...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle>Project Tasks</CardTitle>
          <CardDescription>Manage all tasks for this project</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => toast.info("Adding new task")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-xs">
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
                  <DropdownMenuItem onClick={() => handleBulkAction('mark-complete')}>
                    Mark Complete
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('assign')}>
                    Assign To...
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
            
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            
            <Button variant="outline" size="sm">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Sort
            </Button>
          </div>
        </div>
        
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedTasks.size > 0 && selectedTasks.size === filteredTasks.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('title')}>
                  <div className="flex items-center gap-2">
                    Task
                    {sortConfig.key === 'title' && (
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('priority')}>
                  <div className="flex items-center gap-2">
                    Priority
                    {sortConfig.key === 'priority' && (
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-2">
                    Status
                    {sortConfig.key === 'status' && (
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('dueDate')}>
                  <div className="flex items-center gap-2">
                    Due Date
                    {sortConfig.key === 'dueDate' && (
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell onClick={(e) => {
                    e.stopPropagation();
                    toggleSelectTask(task.id);
                  }}>
                    <Checkbox checked={selectedTasks.has(task.id)} />
                  </TableCell>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(task.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {task.assignee}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {task.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.info(`Edit task: ${task.title}`)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info(`Viewing task details: ${task.title}`)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
                          toast.success(`Task "${task.title}" deleted`);
                        }} className="text-red-600">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <CheckSquare className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No tasks found</p>
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => toast.info("Creating new task")}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Task
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectTasksList;
