/**
 * Task Subtasks Component
 * 
 * Displays and manages subtasks (child tasks) for a parent task.
 * 
 * Features:
 * - Display all subtasks with status indicators
 * - Progress indicator showing completed/total subtasks
 * - Progress percentage from backend calculation
 * - Create new subtasks via dialog
 * - Visual status indicators (checkmark for done, alert for blocked, circle for pending)
 * - Shows assignees and dependencies for each subtask
 * 
 * Subtasks must be in the same project as the parent task.
 * Progress is calculated based on completed subtasks (done or cancelled status).
 * 
 * @param taskId - ID of the parent task
 * @param projectId - Optional project ID (inherited from parent task)
 * @param onSubtaskCreated - Optional callback when a subtask is created
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { TaskForm } from './TaskForm';
import { getStatusColor, getPriorityColor } from '@/lib/domain-utils/ui-utils';
import { getStatusLabel, getPriorityLabel, getStatusFromLabel, getPriorityFromLabel } from '@/lib/domain-utils/task-utils';
import { TaskStatus } from '@/shared/types/enums';
import { toast } from 'sonner';

interface TaskSubtasksProps {
  taskId: string;
  projectId?: string;
  onSubtaskCreated?: () => void;
}

interface Subtask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignees?: Array<{
    user: {
      name: string;
    };
  }>;
  dependenciesFrom?: Array<{
    toTask: {
      id: string;
      title: string;
      status: string;
    };
  }>;
}

export function TaskSubtasks({ taskId, projectId, onSubtaskCreated }: TaskSubtasksProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: subtasks = [], isLoading, refetch } = useQuery<Subtask[]>({
    queryKey: ['tasks', taskId, 'subtasks'],
    queryFn: async () => {
      const response = await apiClient.get(`/v1/tasks/${taskId}/subtasks`);
      return response.data || [];
    },
  });

  const { data: progress } = useQuery<{ progress: number }>({
    queryKey: ['tasks', taskId, 'progress'],
    queryFn: async () => {
      const response = await apiClient.get(`/v1/tasks/${taskId}/progress`);
      return response.data || { progress: 0 };
    },
  });

  /**
   * Handle subtask creation
   * Called when TaskForm is submitted with subtask data
   * 
   * Transforms form data to API format and creates the subtask.
   * The key is setting parentId to the current taskId to establish
   * the parent-child relationship.
   */
  const handleSubtaskCreated = async (formData: any) => {
    try {
      // Transform form data to API format
      const subtaskData = {
        title: formData.title,
        description: formData.description || undefined,
        // Convert display labels to API enum values
        priority: getPriorityFromLabel(formData.priority).toLowerCase(),
        status: getStatusFromLabel(formData.status),
        // Ensure subtask is in same project as parent
        projectId: formData.projectId || projectId,
        // KEY: Set parentId to create a subtask relationship
        parentId: taskId,
        dueDate: formData.dueDate || undefined,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        // Parse comma-separated tags string into array
        tags: formData.tags ? formData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [],
      };

      // Create subtask via API
      await apiClient.post('/v1/tasks', subtaskData);

      setIsCreateOpen(false);
      refetch(); // Refresh subtasks list to show new subtask
      onSubtaskCreated?.();
      toast.success('Subtask created successfully!');
    } catch (error: any) {
      console.error('Failed to create subtask:', error);
      toast.error(error?.response?.data?.message || 'Failed to create subtask');
    }
  };

  const completedCount = subtasks.filter(
    (st) => st.status === 'done' || st.status === 'cancelled',
  ).length;
  const totalCount = subtasks.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Subtasks
              {totalCount > 0 && (
                <Badge variant="secondary">
                  {completedCount}/{totalCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {progress !== undefined && (
                <span className="text-sm font-medium text-primary">
                  {progress.progress}% complete
                </span>
              )}
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Subtask
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Subtask</DialogTitle>
                <DialogDescription>Add a subtask to this task</DialogDescription>
              </DialogHeader>
              {/* 
                TaskForm for creating subtasks
                - defaultParentId: Sets this task as the parent (creates subtask relationship)
                - defaultProjectId: Ensures subtask is in same project as parent
                - onSubmit: Handles the form submission and creates the subtask via API
              */}
              <TaskForm
                defaultProjectId={projectId}
                defaultParentId={taskId}
                onSubmit={handleSubtaskCreated}
                onCancel={() => setIsCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading subtasks...</div>
        ) : subtasks.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No subtasks yet. Create one to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="mt-0.5">
                  {subtask.status === 'done' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : subtask.status === 'blocked' ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{subtask.title}</p>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: getStatusColor(subtask.status) }}
                    >
                      {getStatusLabel(subtask.status)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: getPriorityColor(subtask.priority) }}
                    >
                      {getPriorityLabel(subtask.priority)}
                    </Badge>
                  </div>
                  {subtask.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {subtask.description}
                    </p>
                  )}
                  {subtask.assignees && subtask.assignees.length > 0 && (
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Assigned to:</span>
                      {subtask.assignees.map((assignee, idx) => (
                        <span key={idx} className="text-xs font-medium">
                          {assignee.user.name}
                          {idx < subtask.assignees!.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  )}
                  {subtask.dependenciesFrom && subtask.dependenciesFrom.length > 0 && (
                    <div className="mt-1">
                      <span className="text-xs text-muted-foreground">Depends on:</span>
                      {subtask.dependenciesFrom.map((dep, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs ml-1">
                          {dep.toTask.title}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

