/**
 * Project Tasks List Component (Refactored)
 * Uses atomic components for better maintainability
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import {
  TaskForm,
  TaskFilters,
  TaskBulkActions,
  TaskTable,
  TaskDetailsDialog,
} from '@/components/tasks';
import {
  getStatusLabel,
  getStatusFromLabel,
  getPriorityLabel,
  getPriorityFromLabel,
  formatTaskDate,
} from '@/lib/domain-utils/task-utils';
import { TaskStatus } from '@/shared/types/enums';

interface ProjectTasksListProps {
  projectId?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  projectId?: string;
  dueDate?: string;
  assignee: string;
  tags: string[];
  estimatedHours?: number;
  actualHours?: number;
  createdDate: string;
  updatedDate: string;
}

export default function ProjectTasksList({ projectId }: ProjectTasksListProps) {
  if (!projectId) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Project ID is missing. Please navigate to a valid project.
      </div>
    );
  }

  // Fetch tasks
  const { data: apiTasks = [], isLoading: tasksLoading } = useTasks(projectId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Task | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  // Transform API tasks to local format
  const tasks: Task[] = useMemo(
    () =>
      apiTasks.map((apiTask) => ({
        id: apiTask.id,
        title: apiTask.title,
        description: apiTask.description || '',
        priority: getPriorityLabel(apiTask.priority),
        status: getStatusLabel(apiTask.status),
        projectId: apiTask.projectId || undefined,
        dueDate: formatTaskDate(apiTask.dueDate),
        assignee: apiTask.assignees?.[0]?.user?.name || 'Unassigned',
        tags: apiTask.tags || [],
        estimatedHours: apiTask.estimatedHours || undefined,
        actualHours: apiTask.actualHours || 0,
        createdDate: formatTaskDate(apiTask.createdAt),
        updatedDate: formatTaskDate(apiTask.updatedAt),
      })),
    [apiTasks]
  );

  // Sorting
  const sortedTasks = useMemo(() => {
    const tasksToSort = [...tasks];
    if (sortConfig.key) {
      tasksToSort.sort((a, b) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return tasksToSort;
  }, [tasks, sortConfig]);

  // Filtering
  const filteredTasks = useMemo(() => {
    return sortedTasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      const matchesAssignee = filterAssignee === 'all' || task.assignee === filterAssignee;

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
    });
  }, [sortedTasks, searchQuery, filterStatus, filterPriority, filterAssignee]);

  // Handlers
  const handleSort = (key: keyof Task) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
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
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      const allIds = filteredTasks.map((task) => task.id);
      setSelectedTasks(new Set(allIds));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedTasks.size === 0) {
      toast.error('No tasks selected');
      return;
    }

    if (action === 'delete') {
      try {
        await Promise.all(Array.from(selectedTasks).map((id) => deleteTask.mutateAsync(id)));
        setSelectedTasks(new Set());
        toast.success(`Deleted ${selectedTasks.size} tasks`);
      } catch (error) {
        toast.error('Failed to delete tasks');
      }
    } else {
      toast.info(`${action} coming soon`);
    }
  };

  /**
   * Handle task creation
   * Transforms form data to API format and creates the task
   * Supports creating regular tasks and subtasks (when parentId is provided)
   */
  const handleCreateTask = async (formData: any) => {
    try {
      // Transform form data to API format
      const taskData: any = {
        title: formData.title,
        description: formData.description,
        priority: getPriorityFromLabel(formData.priority).toLowerCase(),
        status: getStatusFromLabel(formData.status),
        projectId: formData.projectId || projectId, // Use form's projectId or fallback to component's projectId
        dueDate: formData.dueDate || undefined,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        // Support subtasks: include parentId if provided
        parentId: formData.parentId || undefined,
        // Support tags: parse comma-separated string
        tags: formData.tags ? formData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [],
      };
      
      await createTask.mutateAsync(taskData);
      toast.success('Task created successfully!');
      setIsCreateTaskOpen(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      toast.error(errorMessage);
    }
  };

  const handleUpdateTask = async (formData: any) => {
    if (!editingTask) return;

    try {
      await updateTask.mutateAsync({
        id: editingTask.id,
        data: {
          title: formData.title,
          description: formData.description,
          priority: getPriorityFromLabel(formData.priority).toLowerCase(),
          status: getStatusFromLabel(formData.status),
          dueDate: formData.dueDate || undefined,
          estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
          actualHours: formData.actualHours ? parseFloat(formData.actualHours) : undefined,
        },
      });
      toast.success('Task updated successfully!');
      setEditingTask(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      toast.error(errorMessage);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask.mutateAsync(taskId);
      toast.success('Task deleted successfully!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      toast.error(errorMessage);
    }
  };

  if (tasksLoading) {
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

  const hasFilters = filterStatus !== 'all' || filterPriority !== 'all' || filterAssignee !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Tasks</h2>
          <p className="text-muted-foreground">Manage and track all project tasks</p>
        </div>
        <div className="flex gap-2">
          <TaskBulkActions
            selectedCount={selectedTasks.size}
            onBulkAction={handleBulkAction}
          />
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
                <DialogDescription>Add a new task to the project</DialogDescription>
              </DialogHeader>
              <TaskForm onSubmit={handleCreateTask} onCancel={() => setIsCreateTaskOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <TaskFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        filterPriority={filterPriority}
        onPriorityChange={setFilterPriority}
        filterAssignee={filterAssignee}
        onAssigneeChange={setFilterAssignee}
      />

      {/* Tasks Table */}
      <TaskTable
        tasks={filteredTasks}
        selectedTasks={selectedTasks}
        onSelectTask={toggleSelectTask}
        onSelectAll={toggleSelectAll}
        onSort={handleSort}
        sortConfig={sortConfig}
        onView={setViewingTask}
        onEdit={setEditingTask}
        onDelete={handleDeleteTask}
        onCreateTask={() => setIsCreateTaskOpen(true)}
        searchQuery={searchQuery}
        hasFilters={hasFilters}
      />

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details</DialogDescription>
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
          open={!!viewingTask}
          onClose={() => setViewingTask(null)}
          onEdit={setEditingTask}
        />
      )}
    </div>
  );
}

