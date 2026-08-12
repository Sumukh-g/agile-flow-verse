/**
 * Task Details Dialog Component
 * 
 * Displays comprehensive task information in a modal dialog.
 * 
 * Features:
 * - Basic task information (status, priority, assignee, dates, tags)
 * - Time tracking section with start/stop timer
 * - Time logs list with manual entry support
 * - Subtasks section with progress indicator
 * - Edit task functionality
 * 
 * The dialog is scrollable to accommodate all sections.
 * 
 * @param task - Task object containing all task details
 * @param open - Boolean to control dialog visibility
 * @param onClose - Callback when dialog is closed
 * @param onEdit - Callback when edit button is clicked
 */

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Edit, X, ListChecks } from 'lucide-react';
import { getStatusColor, getPriorityColor, getPriorityIcon } from '@/lib/domain-utils/ui-utils';
import { getPriorityLabel } from '@/lib/domain-utils/task-utils';
import { TaskTimer } from './TaskTimer';
import { TaskSubtasks } from './TaskSubtasks';
import { TaskTimeLogs } from './TaskTimeLogs';
import { TaskDependencies } from './TaskDependencies';
import { TaskCustomFields } from './TaskCustomFields';

interface TaskDetailsDialogProps {
  task: {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    assignee: string;
    dueDate: string;
    tags: string[];
    estimatedHours?: number;
    actualHours?: number;
    createdDate: string;
    updatedDate: string;
    projectId?: string;
    customFields?: Record<string, any>;
  };
  open: boolean;
  onClose: () => void;
  onEdit: (task: TaskDetailsDialogProps['task']) => void;
}

export function TaskDetailsDialog({
  task,
  open,
  onClose,
  onEdit,
}: TaskDetailsDialogProps) {
  const progressPercentage = task.estimatedHours
    ? Math.min(100, ((task.actualHours || 0) / task.estimatedHours) * 100)
    : 0;

  const PriorityIcon = getPriorityIcon(task.priority);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* 
        Dialog Content with scrollable body
        - max-w-4xl: Wider dialog (672px) to accommodate new features
        - max-h-[90vh]: Maximum height of 90% viewport height
        - flex flex-col: Flexbox layout for proper scrolling
      */}
      <DialogContent className="!max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden [&>button]:hidden">
        {/* Fixed Header - doesn't scroll */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <PriorityIcon className="h-4 w-4" />
                {task.title}
              </DialogTitle>
              <DialogDescription>Task details and information</DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* 
          Scrollable Content Area
          - flex-1: Takes remaining space between header and footer
          - overflow-y-auto: Enables vertical scrolling when content exceeds height
          - px-6: Horizontal padding for content
        */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {/* 
            Main Task Information Section
            Displays basic task details: status, priority, assignee, dates, etc.
          */}
          <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Badge className={`mt-1 ${getStatusColor(task.status)}`}>{task.status}</Badge>
            </div>
            <div>
              <Label className="text-sm font-medium">Priority</Label>
              <Badge className={`mt-1 ${getPriorityColor(task.priority)}`}>
                {getPriorityLabel(task.priority)}
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
                    {task.assignee
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{task.assignee}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Due Date</Label>
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{task.dueDate || 'No due date'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Time Tracking</Label>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {task.actualHours || 0}h / {task.estimatedHours || 0}h
                </span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Progress</Label>
              <div className="mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${progressPercentage}%` }}
                  />
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

          {/* 
            Time Tracking Section
            - TaskTimer: Start/stop timer component with real-time duration display
            - TaskTimeLogs: List of all time log entries for this task
          */}
          <div className="space-y-4 pt-6 border-t-2">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Time Tracking</h3>
            </div>
            <TaskTimer taskId={task.id} taskTitle={task.title} />
            <TaskTimeLogs taskId={task.id} />
          </div>

          {/* 
            Subtasks Section
            - Displays all child tasks (subtasks) of this task
            - Shows progress indicator (completed/total)
            - Allows creating new subtasks
            - Shows subtask details: status, priority, assignees, dependencies
          */}
          <div className="pt-6 border-t-2">
            <div className="flex items-center gap-2 mb-4">
              <ListChecks className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Subtasks</h3>
            </div>
            <TaskSubtasks taskId={task.id} projectId={task.projectId} />
          </div>

          {/* 
            Dependencies Section
            - Shows tasks that block this task (blockedBy)
            - Shows tasks that this task blocks
            - Add/remove dependencies with cycle detection
          */}
          <div className="pt-6 border-t-2">
            <TaskDependencies taskId={task.id} projectId={task.projectId} />
          </div>

          {/* 
            Custom Fields Section
            - Displays and edits custom field values
            - Supports text, number, date, and select fields
            - Inline editing with auto-save
          */}
          <div className="pt-6 border-t-2">
            <TaskCustomFields
              taskId={task.id}
              customFields={task.customFields || {}}
              onFieldChange={() => {
                // Custom field updates would be handled via onEdit
              }}
            />
          </div>
        </div>

        {/* 
          Fixed Footer - doesn't scroll
          Action buttons always visible at bottom
          - flex-shrink-0: Prevents footer from shrinking
          - bg-background: Ensures background color
        */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-background flex-shrink-0">
          <Button variant="outline" onClick={() => onEdit(task)}>
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
}

