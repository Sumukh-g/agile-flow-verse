import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { useTasks, useDeleteTask, Task } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { Edit, Plus, Search, Trash2, CheckSquare, Clock } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

const TasksSimple: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: projects = [] } = useProjects();
  const deleteTask = useDeleteTask();

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = 
      filterProject === 'all' || 
      (filterProject === 'personal' ? !task.projectId : task.projectId === filterProject);
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesProject && matchesStatus;
  });

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedTask(null);
    setDialogOpen(true);
  };

  const handleDelete = async (task: Task) => {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
      return;
    }

    try {
      await deleteTask.mutateAsync(task.id);
      toast.success('Task deleted successfully');
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete task');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-purple-100 text-purple-800';
      case 'done': return 'bg-green-100 text-green-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const getProjectName = (projectId?: string) => {
    if (!projectId) return 'Personal Task';
    const project = projects.find((p) => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const groupedTasks = {
    todo: filteredTasks.filter((t) => t.status === 'todo'),
    'in-progress': filteredTasks.filter((t) => t.status === 'in-progress'),
    review: filteredTasks.filter((t) => t.status === 'review'),
    done: filteredTasks.filter((t) => t.status === 'done'),
    blocked: filteredTasks.filter((t) => t.status === 'blocked'),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <CheckSquare className="mr-3 h-7 w-7 text-primary" />
            Tasks
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your tasks
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="personal">Personal Tasks</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="review">In Review</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks Display */}
      {tasksLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckSquare className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No tasks found</p>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterProject !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first task'}
            </p>
            {!searchTerm && filterProject === 'all' && filterStatus === 'all' && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Object.entries(groupedTasks).map(([status, statusTasks]) => (
            statusTasks.length > 0 && (
              <div key={status} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold capitalize flex items-center">
                    <span className="mr-2">{status.replace('-', ' ')}</span>
                    <Badge variant="secondary">{statusTasks.length}</Badge>
                  </h3>
                </div>
                <div className="space-y-3">
                  {statusTasks.map((task) => (
                    <Card key={task.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base line-clamp-2">{task.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {task.description || 'No description'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-1">
                          <Badge className={getStatusColor(task.status)} variant="secondary">
                            {task.status}
                          </Badge>
                          <Badge className={getPriorityColor(task.priority)} variant="secondary">
                            {task.priority}
                          </Badge>
                        </div>

                        <div className="text-sm space-y-1">
                          <p className="text-muted-foreground truncate">
                            <strong>Project:</strong> {getProjectName(task.projectId)}
                          </p>
                          {task.dueDate && (
                            <p className="text-muted-foreground flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                          )}
                          {task.estimatedHours && (
                            <p className="text-muted-foreground">
                              <strong>Est:</strong> {task.estimatedHours}h
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleEdit(task)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(task)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedTask}
      />
    </div>
  );
};

export default TasksSimple;




