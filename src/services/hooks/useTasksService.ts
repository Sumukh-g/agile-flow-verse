/**
 * Hook to get TasksService instance
 */

import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { TasksService } from '../tasks.service';

export function useTasksService(): TasksService {
  const queryClient = useQueryClient();
  return useMemo(() => new TasksService(queryClient), [queryClient]);
}

