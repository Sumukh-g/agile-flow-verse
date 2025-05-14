
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Filter, Settings, Plus, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  priority: string;
  status: string;
  dueDate: string;
  assignee: string;
  tags: string[];
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
}

interface ProjectBoardViewProps {
  projectId?: string;
}

const ProjectBoardView = ({ projectId }: ProjectBoardViewProps) => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [boardConfig, setBoardConfig] = useState({
    showWipLimits: true,
    compactCards: false,
  });
  
  useEffect(() => {
    setTimeout(() => {
      const mockColumns: Column[] = [
        {
          id: 'todo',
          title: 'To Do',
          color: 'bg-slate-200',
          tasks: [
            {
              id: 't1',
              title: 'Research competitor products',
              priority: 'Medium',
              status: 'To Do',
              dueDate: '2023-06-15',
              assignee: 'JD',
              tags: ['Research', 'Marketing'],
            },
            {
              id: 't2',
              title: 'Create design wireframes',
              priority: 'High',
              status: 'To Do',
              dueDate: '2023-06-12',
              assignee: 'AS',
              tags: ['Design', 'UX'],
            }
          ]
        },
        {
          id: 'inprogress',
          title: 'In Progress',
          color: 'bg-blue-200',
          tasks: [
            {
              id: 't3',
              title: 'Implement authentication system',
              priority: 'High',
              status: 'In Progress',
              dueDate: '2023-06-10',
              assignee: 'RM',
              tags: ['Backend', 'Security'],
            }
          ]
        },
        {
          id: 'review',
          title: 'In Review',
          color: 'bg-purple-200',
          tasks: [
            {
              id: 't4',
              title: 'Frontend performance optimization',
              priority: 'Medium',
              status: 'In Review',
              dueDate: '2023-06-08',
              assignee: 'JD',
              tags: ['Frontend', 'Performance'],
            }
          ]
        },
        {
          id: 'done',
          title: 'Done',
          color: 'bg-green-200',
          tasks: [
            {
              id: 't5',
              title: 'Project setup and repository',
              priority: 'High',
              status: 'Done',
              dueDate: '2023-06-01',
              assignee: 'TW',
              tags: ['DevOps'],
            }
          ]
        }
      ];
      setColumns(mockColumns);
      setLoading(false);
    }, 800);
  }, [projectId]);
  
  const handleDragStart = (e: React.DragEvent, taskId: string, sourceColumnId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.setData('sourceColumnId', sourceColumnId);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const sourceColumnId = e.dataTransfer.getData('sourceColumnId');
    
    if (sourceColumnId === targetColumnId) return;
    
    setColumns(prevColumns => {
      // Find the task in the source column
      const sourceColumn = prevColumns.find(col => col.id === sourceColumnId);
      if (!sourceColumn) return prevColumns;
      
      const taskToMove = sourceColumn.tasks.find(task => task.id === taskId);
      if (!taskToMove) return prevColumns;
      
      // Create new array with task removed from source column
      const updatedColumns = prevColumns.map(col => {
        if (col.id === sourceColumnId) {
          return {
            ...col,
            tasks: col.tasks.filter(task => task.id !== taskId)
          };
        }
        if (col.id === targetColumnId) {
          // Update the task's status based on the target column
          const updatedTask = {
            ...taskToMove,
            status: col.title
          };
          // Add task to target column
          return {
            ...col,
            tasks: [...col.tasks, updatedTask]
          };
        }
        return col;
      });
      
      toast.success(`Task moved to ${prevColumns.find(col => col.id === targetColumnId)?.title}`);
      return updatedColumns;
    });
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
  
  const handleAddTask = (columnId: string) => {
    toast.info(`Adding task to ${columns.find(col => col.id === columnId)?.title}`);
  };
  
  const toggleBoardConfig = (key: keyof typeof boardConfig) => {
    setBoardConfig(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    toast.success(`${key} ${boardConfig[key] ? 'disabled' : 'enabled'}`);
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Board</CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <p>Loading board...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Project Board</CardTitle>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter Tasks</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => toast.info("Filtered by assignee")}>
                By Assignee
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Filtered by priority")}>
                By Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Filtered by date")}>
                By Due Date
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Board Settings
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Board Configuration</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => toggleBoardConfig('showWipLimits')}
                className={boardConfig.showWipLimits ? "font-medium" : ""}
              >
                {boardConfig.showWipLimits ? "✓ " : ""}
                Show WIP Limits
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => toggleBoardConfig('compactCards')}
                className={boardConfig.compactCards ? "font-medium" : ""}
              >
                {boardConfig.compactCards ? "✓ " : ""}
                Compact Cards
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast.info("Managing columns")}>
                Manage Columns
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Saving board view")}>
                Save Board View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="flex gap-6 min-h-[500px]">
          {columns.map(column => (
            <div 
              key={column.id}
              className="flex flex-col min-w-[250px] w-[250px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className={`px-3 py-2 rounded-t-md flex items-center justify-between ${column.color}`}>
                <div className="flex items-center">
                  <h3 className="font-medium text-sm">{column.title}</h3>
                  <span className="bg-white text-xs font-medium rounded-full px-2 py-0.5 ml-2 text-slate-600">
                    {column.tasks.length}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => handleAddTask(column.id)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto bg-slate-50 p-2 rounded-b-md">
                {column.tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground p-4 border border-dashed rounded-md">
                    <p>No tasks</p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={() => handleAddTask(column.id)}
                    >
                      Add a task
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {column.tasks.map(task => (
                      <Card 
                        key={task.id} 
                        className="border shadow-sm cursor-grab"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id, column.id)}
                      >
                        <CardContent className={`p-3 ${boardConfig.compactCards ? 'py-2' : ''}`}>
                          <div className="space-y-2">
                            <div className="font-medium text-sm">{task.title}</div>
                            
                            <div className="flex items-center justify-between text-xs">
                              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                              <span className="text-muted-foreground">{new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                            
                            {!boardConfig.compactCards && (
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
                            )}
                            
                            {boardConfig.compactCards && (
                              <div className="flex items-center justify-between">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                                    {task.assignee}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => toast.info("Edit task")}>
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => toast.info("View task details")}>
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setColumns(prev => prev.map(col => ({
                                          ...col,
                                          tasks: col.tasks.filter(t => t.id !== task.id)
                                        })));
                                        toast.success("Task deleted");
                                      }} 
                                      className="text-red-600"
                                    >
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          <div className="flex flex-col min-w-[250px] border-2 border-dashed border-slate-200 rounded-md p-4 flex items-center justify-center text-muted-foreground">
            <Button 
              variant="outline" 
              className="border-dashed"
              onClick={() => toast.info("Adding new column")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Column
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectBoardView;
