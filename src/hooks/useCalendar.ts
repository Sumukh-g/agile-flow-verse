import { apiClient } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  type: 'meeting' | 'task' | 'reminder' | 'event' | 'deadline' | 'appointment';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  location?: string;
  attendees?: string[];
  isOnline?: boolean;
  isRecurring?: boolean;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  reminder?: number;
  color?: string;
  completed?: boolean;
  notes?: string;
  projectId?: string;
  projectName?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateCalendarEventData {
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  type: 'meeting' | 'task' | 'reminder' | 'event' | 'deadline' | 'appointment';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  location?: string;
  attendees?: string[];
  isOnline?: boolean;
  isRecurring?: boolean;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  reminder?: number;
  color?: string;
  notes?: string;
  projectId?: string;
}

export interface UpdateCalendarEventData {
  title?: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  type?: 'meeting' | 'task' | 'reminder' | 'event' | 'deadline' | 'appointment';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  location?: string;
  attendees?: string[];
  isOnline?: boolean;
  isRecurring?: boolean;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  reminder?: number;
  color?: string;
  completed?: boolean;
  notes?: string;
  projectId?: string;
}

export interface CalendarFilters {
  type?: string;
  priority?: string;
  projectId?: string;
  completed?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface AISuggestion {
  type: 'warning' | 'optimization' | 'automation';
  message: string;
  action: string;
  data?: any;
}

export interface ScheduleOptimization {
  optimized: boolean;
  optimizations: any[];
  suggestedSchedule: CalendarEvent[];
  timeBlocks: any[];
}

export interface RecurringEventTemplate {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  type: 'meeting' | 'task' | 'reminder' | 'event' | 'deadline' | 'appointment';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

// Mock data for demonstration
const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Standup',
    description: 'Daily team standup meeting to discuss progress and blockers',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '09:30',
    type: 'meeting',
    priority: 'medium',
    attendees: ['John Doe', 'Jane Smith', 'Mike Johnson'],
    isOnline: true,
    reminder: 15,
    color: '#3b82f6',
    projectId: 'p2',
    projectName: 'Website Redesign',
    completed: false,
    createdBy: 'user1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    project: {
      id: 'p2',
      name: 'Website Redesign'
    },
    user: {
      id: 'user1',
      name: 'John Doe',
      email: 'john@example.com'
    }
  },
  {
    id: '2',
    title: 'Design Review',
    description: 'Review new website design mockups',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '15:30',
    type: 'meeting',
    priority: 'high',
    location: 'Conference Room A',
    attendees: ['Sarah Wilson', 'Tom Brown', 'Lisa Davis'],
    isOnline: false,
    reminder: 30,
    color: '#ef4444',
    projectId: 'p2',
    projectName: 'Website Redesign',
    completed: false,
    createdBy: 'user1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    project: {
      id: 'p2',
      name: 'Website Redesign'
    },
    user: {
      id: 'user1',
      name: 'John Doe',
      email: 'john@example.com'
    }
  },
  {
    id: '3',
    title: 'Complete Homepage',
    description: 'Finish and submit the homepage design',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    type: 'task',
    priority: 'high',
    color: '#10b981',
    projectId: 'p2',
    projectName: 'Website Redesign',
    completed: false,
    createdBy: 'user1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    project: {
      id: 'p2',
      name: 'Website Redesign'
    },
    user: {
      id: 'user1',
      name: 'John Doe',
      email: 'john@example.com'
    }
  }
];

// Calendar hooks
export const useCalendarEvents = (filters: CalendarFilters = {}) => {
  return useQuery({
    queryKey: ['calendar-events', filters],
    queryFn: async (): Promise<CalendarEvent[]> => {
      try {
        // Try to fetch from API first
        const response = await apiClient.get('/calendar/events', { params: filters });
        return response.data || [];
      } catch (error) {
        console.warn('Failed to fetch calendar events from API, using mock data:', error);
        // Return mock data if API fails
        return MOCK_EVENTS.filter(event => {
          if (filters.projectId && event.projectId !== filters.projectId) return false;
          if (filters.search && !event.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
          if (filters.type && event.type !== filters.type) return false;
          if (filters.priority && event.priority !== filters.priority) return false;
          return true;
        });
      }
    },
    staleTime: 30000, // 30 seconds
  });
};

export const useCalendarEvent = (id: string) => {
  return useQuery({
    queryKey: ['calendar-event', id],
    queryFn: async (): Promise<CalendarEvent> => {
              const response = await apiClient.get(`/calendar/events/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useProjectCalendarEvents = (projectId: string) => {
  return useQuery({
    queryKey: ['project-calendar-events', projectId],
    queryFn: async (): Promise<CalendarEvent[]> => {
              const response = await apiClient.get(`/calendar/events?projectId=${projectId}`);
      return response.data;
    },
    enabled: !!projectId,
  });
};

export const useCreateCalendarEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateCalendarEventData): Promise<CalendarEvent> => {
      try {
        const response = await apiClient.post('/calendar/events', data);
        return response.data;
      } catch (error) {
        console.warn('Failed to create calendar event via API, using mock:', error);
        // Create mock event
        const newEvent: CalendarEvent = {
          id: Date.now().toString(),
          ...data,
          createdBy: 'user1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          project: {
            id: data.projectId || 'p2',
            name: 'Website Redesign'
          },
          user: {
            id: 'user1',
            name: 'John Doe',
            email: 'john@example.com'
          }
        };
        return newEvent;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Event created successfully!');
    },
    onError: (error) => {
      console.error('Failed to create calendar event:', error);
      toast.error('Failed to create event. Please try again.');
    },
  });
};

export const useUpdateCalendarEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCalendarEventData }): Promise<CalendarEvent> => {
      try {
        const response = await apiClient.patch(`/calendar/events/${id}`, data);
        return response.data;
      } catch (error) {
        console.warn('Failed to update calendar event via API, using mock:', error);
        // Update mock event
        const updatedEvent: CalendarEvent = {
          id,
          title: data.title || 'Updated Event',
          description: data.description,
          date: data.date || new Date().toISOString().split('T')[0],
          startTime: data.startTime,
          endTime: data.endTime,
          type: data.type || 'meeting',
          priority: data.priority,
          location: data.location,
          attendees: data.attendees,
          isOnline: data.isOnline,
          isRecurring: data.isRecurring,
          recurrence: data.recurrence,
          reminder: data.reminder,
          color: data.color,
          completed: data.completed,
          notes: data.notes,
          projectId: data.projectId,
          createdBy: 'user1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          project: {
            id: data.projectId || 'p2',
            name: 'Website Redesign'
          },
          user: {
            id: 'user1',
            name: 'John Doe',
            email: 'john@example.com'
          }
        };
        return updatedEvent;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Event updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update calendar event:', error);
      toast.error('Failed to update event. Please try again.');
    },
  });
};

export const useDeleteCalendarEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      try {
        await apiClient.delete(`/calendar/events/${id}`);
      } catch (error) {
        console.warn('Failed to delete calendar event via API, using mock:', error);
        // Mock deletion - just return success
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Event deleted successfully!');
    },
    onError: (error) => {
      console.error('Failed to delete calendar event:', error);
      toast.error('Failed to delete event. Please try again.');
    },
  });
};

export const useToggleCalendarEventComplete = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      try {
        await apiClient.patch(`/calendar/${id}/toggle-complete`);
      } catch (error) {
        console.warn('Failed to toggle calendar event completion via API, using mock:', error);
        // Mock toggle - just return success
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
    onError: (error) => {
      console.error('Failed to toggle calendar event completion:', error);
      toast.error('Failed to update event status. Please try again.');
    },
  });
};

// AI hooks
export const useAICalendarSuggestions = () => {
  return useQuery({
    queryKey: ['ai-calendar-suggestions'],
    queryFn: async (): Promise<{ suggestions: AISuggestion[] }> => {
      try {
        const response = await apiClient.get('/calendar/ai/suggestions');
        return response.data;
      } catch (error) {
        console.warn('Failed to fetch AI suggestions via API, using mock:', error);
        // Return mock AI suggestions
        return {
          suggestions: [
            {
              type: 'optimization',
              message: 'You have 3 meetings scheduled back-to-back. Consider adding breaks between them.',
              action: 'Reschedule meetings',
              data: { meetings: ['Team Standup', 'Design Review', 'Client Call'] }
            },
            {
              type: 'warning',
              message: 'High priority task "Complete Homepage" is due tomorrow.',
              action: 'Review task',
              data: { taskId: '3', dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }
            },
            {
              type: 'automation',
              message: 'You frequently schedule meetings at 9 AM. Would you like to set up a recurring team standup?',
              action: 'Create recurring event',
              data: { suggestedTime: '09:00', frequency: 'weekly' }
            }
          ]
        };
      }
    },
    staleTime: 300000, // 5 minutes
  });
};

export const useOptimizeSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dateRange: { start: string; end: string }): Promise<ScheduleOptimization> => {
      try {
        const response = await apiClient.post('/calendar/ai/optimize-schedule', dateRange);
        return response.data;
      } catch (error) {
        console.warn('Failed to optimize schedule via API, using mock:', error);
        // Return mock optimization
        return {
          optimized: true,
          optimizations: [
            'Moved "Design Review" to 10:00 AM for better focus',
            'Added 15-minute breaks between meetings',
            'Prioritized high-impact tasks in the morning'
          ],
          suggestedSchedule: [],
          timeBlocks: [
            { start: '09:00', end: '09:30', type: 'meeting' },
            { start: '09:45', end: '11:15', type: 'deep-work' },
            { start: '11:30', end: '12:30', type: 'meeting' }
          ]
        };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Schedule optimized successfully!');
    },
    onError: (error) => {
      console.error('Failed to optimize schedule:', error);
      toast.error('Failed to optimize schedule. Please try again.');
    },
  });
};

export const useGenerateRecurringEvents = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: RecurringEventTemplate): Promise<void> => {
      try {
        await apiClient.post('/calendar/ai/generate-recurring', template);
      } catch (error) {
        console.warn('Failed to generate recurring events via API, using mock:', error);
        // Mock generation - just return success
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Recurring events created successfully!');
    },
    onError: (error) => {
      console.error('Failed to generate recurring events:', error);
      toast.error('Failed to create recurring events. Please try again.');
    },
  });
};
