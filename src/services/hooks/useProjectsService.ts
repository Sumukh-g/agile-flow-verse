/**
 * Hook to get ProjectsService instance
 */

import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ProjectsService } from '../projects.service';

export function useProjectsService(): ProjectsService {
  const queryClient = useQueryClient();
  return useMemo(() => new ProjectsService(queryClient), [queryClient]);
}

