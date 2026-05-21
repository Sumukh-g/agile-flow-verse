/**
 * Task Timer Component
 * 
 * Provides start/stop timer functionality for time tracking.
 * 
 * Features:
 * - Start timer: Creates an active time log entry
 * - Stop timer: Ends the active timer and calculates duration
 * - Real-time duration display: Updates every second while timer is running
 * - Prevents multiple active timers: Only one timer can be active per user
 * 
 * The component automatically updates the task's actualHours when timer stops.
 * 
 * @param taskId - ID of the task to track time for
 * @param taskTitle - Optional task title for timer description
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useActiveTimer, useStartTimer, useStopTimer } from '@/hooks/useTimeLogs';
import { Play, Square, Clock } from 'lucide-react';
import { formatDuration } from '@/lib/domain-utils/task-utils';

interface TaskTimerProps {
  taskId: string;
  taskTitle?: string;
}

export function TaskTimer({ taskId, taskTitle }: TaskTimerProps) {
  const { data: activeTimer, isLoading } = useActiveTimer();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();

  const isActive = activeTimer?.taskId === taskId;
  const currentDuration = activeTimer?.currentDuration || 0;

  const handleStart = () => {
    startTimer.mutate({ taskId, description: `Working on: ${taskTitle || 'task'}` });
  };

  const handleStop = () => {
    stopTimer.mutate();
  };

  if (isLoading) {
    return <Card><CardContent className="p-4">Loading timer...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Tracking
        </CardTitle>
        <CardDescription>Track time spent on this task</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isActive ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Timer Running</p>
                <p className="text-2xl font-bold text-primary">
                  {formatDuration(currentDuration)}
                </p>
              </div>
              <Button
                onClick={handleStop}
                variant="destructive"
                size="lg"
                disabled={stopTimer.isPending}
              >
                <Square className="h-4 w-4 mr-2" />
                {stopTimer.isPending ? 'Stopping...' : 'Stop Timer'}
              </Button>
            </div>
            {activeTimer.description && (
              <p className="text-sm text-muted-foreground">{activeTimer.description}</p>
            )}
          </div>
        ) : (
          <Button
            onClick={handleStart}
            variant="default"
            size="lg"
            className="w-full"
            disabled={startTimer.isPending}
          >
            <Play className="h-4 w-4 mr-2" />
            {startTimer.isPending ? 'Starting...' : 'Start Timer'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

