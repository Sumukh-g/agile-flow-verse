import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export function useProjectCalendar(projectId: string | undefined, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['calendar', { projectId, startDate, endDate }],
    enabled: !!projectId,
    queryFn: () => api.calendar.getEvents(startDate, endDate, projectId, 'project'),
    staleTime: 60_000,
  });
}

export const useCalendarEvents = (startDate?: string, endDate?: string, projectId?: string) => {
  return useQuery({
    queryKey: ['calendar', 'events', startDate, endDate, projectId],
    queryFn: () => api.calendar.getEvents(startDate, endDate, projectId, projectId ? 'project' : 'global'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePersonalCalendar = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['calendar', 'personal', startDate, endDate],
    queryFn: () => api.calendar.getEvents(startDate, endDate, undefined, 'global'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAllProjectsCalendar = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['calendar', 'all-projects', startDate, endDate],
    queryFn: () => api.calendar.getEvents(startDate, endDate, undefined, 'global'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
