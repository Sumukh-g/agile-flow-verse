import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { useTasks, useUpdateTask, Task } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { LayoutGrid, Plus, GripVertical, Clock, User } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

const BoardsSimple: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: tasks = [], isLoading } = useTasks();
  const { data: projects = [] } = useProjects();
  const updateTask = useUpdateTask();

  // Filter tasks by selected project
  const filteredTasks = selectedProjectId === 'all' 
    ? tasks 
    : tasks.filter(task => task.projectId === selectedProjectId);

  // Group tasks by status
  const columns = [
    { id: 'todo', title: 'To Do', tasks: filteredTasks.filter(t => t.status === 'todo') },
    { id: 'in-progress', title: 'In Progress', tasks: filteredTasks.filter(t => t.status === 'in-progress') },
    { id: 'review', title: 'In Review', tasks: filteredTasks.filter(t => t.status === 'review') },
    { id: 'done', title: 'Done', tasks: filteredTasks.filter(t => t.status === 'done') },
    { id: 'blocked', title: 'Blocked', tasks: filteredTasks.filter(t => t.status === 'blocked') },
  ];

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedTask(null);
    setDialogOpen(true);
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: { status: newStatus as Task['status'] },
      });
      toast.success('Task status updated');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task status');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <LayoutGrid className="mr-3 h-7 w-7 text-primary" />
            Kanban Boards
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize and manage tasks with drag-and-drop boards
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Project Filter */}
      <div className="flex gap-4 items-center">
        <label className="text-sm font-medium">Project:</label>
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading boards...</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <div key={column.id} className="flex-shrink-0 w-80">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">
                      {column.title}
                    </CardTitle>
                    <Badge variant="secondary">
                      {column.tasks.length}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {column.tasks.length === 0 
                      ? 'No tasks' 
                      : `${column.tasks.length} task${column.tasks.length !== 1 ? 's' : ''}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 min-h-[200px]">
                  {column.tasks.map((task) => (
                    <Card
                      key={task.id}
                      className="hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => handleTaskClick(task)}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                              {task.title}
                            </h4>
                          </div>
                          <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>

                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1">
                          <Badge className={getPriorityColor(task.priority)} variant="secondary">
                            {task.priority}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1 truncate">
                            <span className="truncate">{getProjectName(task.projectId)}</span>
                          </div>
                          {task.dueDate && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {/* Quick Status Change */}
                        <div className="pt-2 border-t">
                          <Select
                            value={task.status}
                            onValueChange={(value) => handleStatusChange(task, value)}
                          >
                            <SelectTrigger className="h-7 text-xs" onClick={(e) => e.stopPropagation()}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="review">In Review</SelectItem>
                              <SelectItem value="done">Done</SelectItem>
                              <SelectItem value="blocked">Blocked</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {column.tasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <p>No tasks in {column.title.toLowerCase()}</p>
                      <p className="text-xs mt-1">Drag tasks here or create new ones</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {filteredTasks.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutGrid className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No tasks found</p>
            <p className="text-muted-foreground mb-4">
              {selectedProjectId !== 'all' 
                ? 'This project has no tasks yet' 
                : 'Create your first task to get started'}
            </p>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedTask}
        defaultProjectId={selectedProjectId !== 'all' ? selectedProjectId : undefined}
      />
    </div>
  );
};

export default BoardsSimple;




