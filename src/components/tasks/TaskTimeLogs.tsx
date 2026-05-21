/**
 * Task Time Logs Component
 * 
 * Displays and manages time log entries for a task.
 * 
 * Features:
 * - List all time logs for the task
 * - Display total hours tracked
 * - Add manual time log entries (with start/end date and description)
 * - Delete time log entries
 * - Shows user, duration, dates, and description for each entry
 * 
 * Time logs are automatically synced with the task's actualHours field.
 * 
 * @param taskId - ID of the task to display time logs for
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Clock, Trash2 } from 'lucide-react';
import { useTimeLogs, useCreateTimeLog, useDeleteTimeLog } from '@/hooks/useTimeLogs';
import { formatDuration, formatTaskDate } from '@/lib/domain-utils/task-utils';
import { toast } from 'sonner';

interface TaskTimeLogsProps {
  taskId: string;
}

/**
 * TaskTimeLogs Component Implementation
 * 
 * Manages time log entries for a task.
 * - Fetches and displays all time logs
 * - Calculates total hours
 * - Provides UI for adding manual entries
 * - Allows deleting entries
 */
export function TaskTimeLogs({ taskId }: TaskTimeLogsProps) {
  // Form state for manual time log entry
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  // Fetch time logs for this task
  const { data: timeLogsData, isLoading } = useTimeLogs({ taskId });
  const createTimeLog = useCreateTimeLog();
  const deleteTimeLog = useDeleteTimeLog();

  // Extract time logs and calculate total
  const timeLogs = timeLogsData?.items || [];
  const totalHours = timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

  /**
   * Handle manual time log creation
   * Validates dates, calculates duration, and creates the entry
   */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate) {
      toast.error('Start date is required');
      return;
    }

    // Use current time if end date not provided
    const endDateValue = endDate || new Date().toISOString();
    // Calculate duration in hours
    const duration =
      (new Date(endDateValue).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60);

    if (duration < 0) {
      toast.error('End date must be after start date');
      return;
    }

    // Create time log entry
    createTimeLog.mutate(
      {
        taskId,
        startedAt: startDate,
        endedAt: endDateValue,
        duration,
        description: description || null,
      },
      {
        onSuccess: () => {
          // Reset form on success
          setIsCreateOpen(false);
          setStartDate('');
          setEndDate('');
          setDescription('');
        },
      },
    );
  };

  /**
   * Handle time log deletion
   * Confirms before deleting to prevent accidental removal
   */
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this time log?')) {
      deleteTimeLog.mutate(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Logs
            </CardTitle>
            <CardDescription>
              Total: <span className="font-medium">{formatDuration(totalHours)}</span>
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Time Log</DialogTitle>
                <DialogDescription>Record time spent on this task</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="startDate">Start Date & Time</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date & Time (optional)</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to use current time
                  </p>
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What did you work on?"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTimeLog.isPending}>
                    {createTimeLog.isPending ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading time logs...</div>
        ) : timeLogs.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No time logs yet. Start a timer or add a manual entry.
          </div>
        ) : (
          <div className="space-y-3">
            {timeLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {formatDuration(log.duration || 0)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTaskDate(log.startedAt)}
                      {log.endedAt && ` - ${formatTaskDate(log.endedAt)}`}
                    </span>
                  </div>
                  {log.description && (
                    <p className="text-sm text-muted-foreground">{log.description}</p>
                  )}
                  {log.user && (
                    <p className="text-xs text-muted-foreground mt-1">
                      by {log.user.name}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(log.id)}
                  disabled={deleteTimeLog.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

