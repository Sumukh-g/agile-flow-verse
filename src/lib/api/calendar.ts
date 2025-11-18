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
   * Get calendar events
   */
  async getEvents(startDate?: string, endDate?: string, projectId?: string): Promise<CalendarEvent[]> {
    // Backend exposes /v1/calendar/events for general feed and /v1/calendar/projects endpoints for project calendars
    const raw = projectId
      ? await apiClient.get<any[]>(`/calendar/projects/${projectId}`, { params: { startDate, endDate } })
      : await apiClient.get<any[]>(`/calendar/events`, { params: { startDate, endDate } });
    // Normalize payload to CalendarEvent (backend may return start/end instead of startDate/endDate)
    return (raw || []).map((e: any) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      startDate: e.start || e.startDate,
      endDate: e.end || e.endDate,
      allDay: !!e.allDay,
      projectId: e.projectId || e.project?.id,
      taskId:
        e.taskId ||
        (typeof e.id === 'string' && e.id.startsWith('task-') ? e.id.substring('task-'.length) : undefined),
      tenantId: e.tenantId || '',
      createdAt: e.createdAt || '',
      updatedAt: e.updatedAt || '',
      project: e.project,
      task: e.task,
    }));
  },

  /**
   * Get a single event by ID
   */
  async getEvent(id: string): Promise<CalendarEvent> {
    return apiClient.get(`/calendar/${id}`);
  },

  /**
   * Create a new calendar event
   */
  async createEvent(data: CreateCalendarEventDto): Promise<CalendarEvent> {
    return apiClient.post('/calendar', data);
  },

  /**
   * Update an existing calendar event
   */
  async updateEvent(id: string, data: UpdateCalendarEventDto): Promise<CalendarEvent> {
    return apiClient.put(`/calendar/${id}`, data);
  },

  /**
   * Delete a calendar event
   */
  async deleteEvent(id: string): Promise<void> {
    return apiClient.delete(`/calendar/${id}`);
  },
};

