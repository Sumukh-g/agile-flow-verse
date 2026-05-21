/**
 * Calendar API Client
 */

import { apiClient } from '../api-client';
import {
  CalendarEvent,
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
} from './types';

export const calendarApi = {
  /**
   * Get calendar events with filtering
   */
  async getEvents(
    startDate?: string,
    endDate?: string,
    projectId?: string,
    scope: 'personal' | 'all' | 'project' | 'overlay' | 'global' | 'section' = 'global',
  ): Promise<CalendarEvent[]> {
    const params: any = {
      from: startDate,
      to: endDate,
    };
    
    // Map frontend scopes to backend scopes
    if (scope === 'personal') {
      params.scope = 'global'; // Backend uses global but filters projectId: null
      params.personalOnly = true; // Send as boolean, not string
    } else if (scope === 'all') {
      params.scope = 'global'; // All projects but exclude personal
      params.excludePersonal = true; // Send as boolean, not string
    } else if (scope === 'overlay') {
      params.scope = 'global'; // Include everything (no filters)
    } else if (scope === 'project' && projectId) {
      params.scope = 'project';
      params.projectId = projectId;
    } else {
      params.scope = scope || 'global';
      if (projectId) params.projectId = projectId;
    }

    const raw = await apiClient.get<any[]>(`/calendar/events`, { params });
    
    // Normalize payload to CalendarEvent
    return (raw || []).map((e: any) => ({
      id: e.id,
      title: e.title,
      description: e.description || '',
      startDate: e.startAt || e.start || e.startDate,
      endDate: e.endAt || e.end || e.endDate,
      allDay: !!e.allDay,
      projectId: e.projectId || e.project?.id,
      sectionId: e.sectionId,
      type: e.type || 'OTHER',
      sourceType: e.sourceType,
      sourceId: e.sourceId,
      taskId: e.sourceType === 'TASK' ? e.sourceId : undefined,
      issueId: e.sourceType === 'ISSUE' ? e.sourceId : undefined,
      noteId: e.sourceType === 'NOTE' ? e.sourceId : undefined,
      tenantId: e.tenantId || '',
      createdAt: e.createdAt || '',
      updatedAt: e.updatedAt || '',
      reminderMinutesBefore: e.reminderMinutesBefore,
      project: e.project,
      creator: e.creator,
    }));
  },

  /**
   * Get a single event by ID
   */
  async getEvent(id: string): Promise<CalendarEvent> {
    return apiClient.get(`/calendar/events/${id}`);
  },

  /**
   * Create a new calendar event
   */
  async createEvent(data: CreateCalendarEventDto): Promise<CalendarEvent> {
    return apiClient.post('/calendar/events', data);
  },

  /**
   * Update an existing calendar event
   */
  async updateEvent(id: string, data: UpdateCalendarEventDto): Promise<CalendarEvent> {
    return apiClient.patch(`/calendar/events/${id}`, data);
  },

  /**
   * Delete a calendar event
   */
  async deleteEvent(id: string): Promise<void> {
    return apiClient.delete(`/calendar/events/${id}`);
  },

  /**
   * Legacy: Get project calendar events (backward compatibility)
   */
  async getProjectEvents(projectId: string, startDate?: string, endDate?: string): Promise<CalendarEvent[]> {
    return this.getEvents(startDate, endDate, projectId, 'project');
  },
};

