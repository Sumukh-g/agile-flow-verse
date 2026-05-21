/**
 * Task Form Component
 * Shared form for creating and editing tasks
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getStatusOptions, getPriorityOptions, formatTaskDate } from '@/lib/domain-utils/task-utils';
import { TaskStatus, TaskPriority } from '@/shared/types/enums';

export interface TaskFormData {
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string;
  assignee: string;
  tags: string;
  estimatedHours: string;
  actualHours: string;
  parentId?: string; // For creating subtasks - when provided, creates a child task
  projectId?: string; // For project association - inherited from parent for subtasks
}

interface TaskFormProps {
  task?: {
    id: string;
    title: string;
    description?: string;
    priority: string;
    status: string;
    dueDate?: string;
    assignee?: string;
    tags?: string[];
    estimatedHours?: number;
    actualHours?: number;
  };
  defaultProjectId?: string;
  defaultParentId?: string;
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
}

/**
 * TaskForm Component
 * 
 * A reusable form component for creating and editing tasks.
 * Supports:
 * - Creating regular tasks
 * - Creating subtasks (when defaultParentId is provided)
 * - Editing existing tasks
 * 
 * @param task - Optional task object for editing mode
 * @param defaultProjectId - Default project ID to associate the task with
 * @param defaultParentId - Parent task ID for creating subtasks
 * @param onSubmit - Callback function called when form is submitted
 * @param onCancel - Callback function called when form is cancelled
 */
export function TaskForm({ task, defaultProjectId, defaultParentId, onSubmit, onCancel }: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'Medium',
    status: task?.status || 'To Do',
    dueDate: task?.dueDate ? formatTaskDate(task.dueDate) : '',
    assignee: task?.assignee || '',
    tags: task?.tags?.join(', ') || '',
    estimatedHours: task?.estimatedHours?.toString() || '',
    actualHours: task?.actualHours?.toString() || '0',
    parentId: defaultParentId, // Include parentId for subtasks
    projectId: defaultProjectId, // Include projectId
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const statusOptions = getStatusOptions();
  const priorityOptions = getPriorityOptions();

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
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.label}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.label}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="assignee">Assignee</Label>
          <Select
            value={formData.assignee}
            onValueChange={(value) => setFormData({ ...formData, assignee: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              <SelectItem value="John Doe">John Doe</SelectItem>
              <SelectItem value="Alice Smith">Alice Smith</SelectItem>
              <SelectItem value="Bob Wilson">Bob Wilson</SelectItem>
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
            min="0"
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
              min="0"
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
        <Button type="submit">{task ? 'Update Task' : 'Create Task'}</Button>
      </div>
    </form>
  );
}

