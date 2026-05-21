/**
 * React hooks for time log operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTimeLogsService } from '@/services/hooks/useTimeLogsService';
import { timeLogKeys } from '@/services/time-logs.service';
import {
  CreateTimeLogDto,
  UpdateTimeLogDto,
  TimeLogQueryDto,
} from '@/shared/types';
import { toast } from 'sonner';

/**
 * Hook to get active timer
 */
export function useActiveTimer() {
  const service = useTimeLogsService();

  return useQuery({
    queryKey: timeLogKeys.active(),
    queryFn: () => service.getActiveTimer(),
    refetchInterval: 1000, // Refetch every second to update current duration
  });
}

/**
 * Hook to list time logs
 */
export function useTimeLogs(query?: TimeLogQueryDto) {
  const service = useTimeLogsService();

  return useQuery({
    queryKey: timeLogKeys.list(query),
    queryFn: () => service.list(query || {}),
    enabled: !!query?.taskId || !!query?.userId, // Only fetch if we have filters
  });
}

/**
 * Hook to start a timer
 */
export function useStartTimer() {
  const service = useTimeLogsService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, description }: { taskId: string; description?: string }) =>
      service.startTimer(taskId, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeLogKeys.active() });
      queryClient.invalidateQueries({ queryKey: timeLogKeys.lists() });
      toast.success('Timer started');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to start timer');
    },
  });
}

/**
 * Hook to stop the active timer
 */
export function useStopTimer() {
  const service = useTimeLogsService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (description?: string) => service.stopTimer(description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeLogKeys.active() });
      queryClient.invalidateQueries({ queryKey: timeLogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['tasks'] }); // Invalidate tasks to update actualHours
      toast.success('Timer stopped');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to stop timer');
    },
  });
}

/**
 * Hook to create a time log
 */
export function useCreateTimeLog() {
  const service = useTimeLogsService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateTimeLogDto) => service.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeLogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['tasks'] }); // Invalidate tasks to update actualHours
      toast.success('Time log created');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create time log');
    },
  });
}

/**
 * Hook to update a time log
 */
export function useUpdateTimeLog() {
  const service = useTimeLogsService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTimeLogDto }) =>
      service.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeLogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timeLogKeys.details() });
      queryClient.invalidateQueries({ queryKey: ['tasks'] }); // Invalidate tasks to update actualHours
      toast.success('Time log updated');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update time log');
    },
  });
}

/**
 * Hook to delete a time log
 */
export function useDeleteTimeLog() {
  const service = useTimeLogsService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => service.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeLogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['tasks'] }); // Invalidate tasks to update actualHours
      toast.success('Time log deleted');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete time log');
    },
  });
}

