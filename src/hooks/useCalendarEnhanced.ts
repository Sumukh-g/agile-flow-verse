/**
 * Enhanced Calendar Hooks with React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, type CalendarEvent, type CreateCalendarEventDto, type UpdateCalendarEventDto } from '@/lib/api';

// Query keys
export const calendarKeys = {
  all: ['calendar'] as const,
  lists: () => [...calendarKeys.all, 'list'] as const,
  list: (filters: { startDate?: string; endDate?: string; projectId?: string; scope?: string }) =>
    [...calendarKeys.lists(), filters] as const,
  details: () => [...calendarKeys.all, 'detail'] as const,
  detail: (id: string) => [...calendarKeys.details(), id] as const,
};

/**
 * Get calendar events with scope support
 */
export function useCalendarEvents(
  startDate?: string, 
  endDate?: string, 
  projectId?: string,
  scope: 'personal' | 'all' | 'project' | 'overlay' = 'all'
) {
  return useQuery({
    queryKey: calendarKeys.list({ startDate, endDate, projectId, scope }),
    queryFn: () => {
      if (scope === 'personal') {
        // Personal events only (projectId is null)
        return api.calendar.getEvents(startDate, endDate, undefined, 'personal');
      } else if (scope === 'project' && projectId) {
        // Specific project events
        return api.calendar.getEvents(startDate, endDate, projectId, 'project');
      } else if (scope === 'all') {
        // All projects events (but not personal)
        return api.calendar.getEvents(startDate, endDate, undefined, 'all');
      } else {
        // Overlay: combine personal + all projects
        return api.calendar.getEvents(startDate, endDate, undefined, 'overlay');
      }
    },
    staleTime: 30000,
    enabled: scope !== 'project' || !!projectId,
  });
}

/**
 * Get a single calendar event
 */
export function useCalendarEvent(id: string) {
  return useQuery({
    queryKey: calendarKeys.detail(id),
    queryFn: () => api.calendar.getEvent(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

/**
 * Create a calendar event
 */
export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCalendarEventDto) => api.calendar.createEvent(data),
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.lists() });
      queryClient.setQueryData<CalendarEvent>(calendarKeys.detail(newEvent.id), newEvent);
      toast.success('Event created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to create event');
    },
  });
}

/**
 * Update a calendar event
 */
export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCalendarEventDto }) =>
      api.calendar.updateEvent(id, data),
    onSuccess: (updatedEvent) => {
      queryClient.setQueryData<CalendarEvent>(calendarKeys.detail(updatedEvent.id), updatedEvent);
      queryClient.invalidateQueries({ queryKey: calendarKeys.lists() });
      toast.success('Event updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to update event');
    },
  });
}

/**
 * Delete a calendar event
 */
export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.calendar.deleteEvent(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: calendarKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: calendarKeys.lists() });
      toast.success('Event deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to delete event');
    },
  });
}

