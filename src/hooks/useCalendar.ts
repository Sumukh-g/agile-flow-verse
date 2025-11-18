<<<<<<< Current (Your changes)
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export function useProjectCalendar(projectId: string | undefined, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['calendar', { projectId, startDate, endDate }],
    enabled: !!projectId,
    queryFn: () => api.calendar.getEvents(startDate, endDate, projectId),
    staleTime: 60_000,
  });
}

import { apiClient } from '@/lib/api-client';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  type: 'task' | 'project';
  priority?: string;
  status?: string;
  project?: {
    id: string;
    name: string;
    color?: string;
  };
  assignees?: any[];
  color: string;
  source: string;
}

export const useCalendarEvents = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['calendar', 'events', startDate, endDate],
    queryFn: () => apiClient.get<CalendarEvent[]>('/calendar/events', {
      params: { startDate, endDate },
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePersonalCalendar = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['calendar', 'personal', startDate, endDate],
    queryFn: () => apiClient.get<CalendarEvent[]>('/calendar/personal', {
      params: { startDate, endDate },
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAllProjectsCalendar = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['calendar', 'all-projects', startDate, endDate],
    queryFn: () => apiClient.get<CalendarEvent[]>('/calendar/projects', {
      params: { startDate, endDate },
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProjectCalendar = (projectId: string, startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['calendar', 'project', projectId, startDate, endDate],
    queryFn: () => apiClient.get<CalendarEvent[]>(`/calendar/projects/${projectId}`, {
      params: { startDate, endDate },
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};





=======
 
>>>>>>> Incoming (Background Agent changes)
