/**
 * React hook to provide TimeLogsService instance
 */

import { useQueryClient } from '@tanstack/react-query';
import { TimeLogsService } from '../time-logs.service';

export function useTimeLogsService(): TimeLogsService {
  const queryClient = useQueryClient();
  return new TimeLogsService(queryClient);
}

