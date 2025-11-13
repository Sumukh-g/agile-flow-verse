import { apiClient } from './api-client';

export class IntegrationService {
  // Dashboard Integration
  static async getDashboardData() {
    try {
      const response = await apiClient.get('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      throw error;
    }
  }

  // Calendar Integration
  static async getCalendarEvents(startDate?: string, endDate?: string) {
    try {
      const response = await apiClient.get('/calendar/events', {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      throw error;
    }
  }

  static async getPersonalCalendar(startDate?: string, endDate?: string) {
    try {
      const response = await apiClient.get('/calendar/personal', {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch personal calendar:', error);
      throw error;
    }
  }

  static async getAllProjectsCalendar(startDate?: string, endDate?: string) {
    try {
      const response = await apiClient.get('/calendar/projects', {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch all projects calendar:', error);
      throw error;
    }
  }

  static async getProjectCalendar(projectId: string, startDate?: string, endDate?: string) {
    try {
      const response = await apiClient.get(`/calendar/projects/${projectId}`, {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch project calendar:', error);
      throw error;
    }
  }

  // Projects Integration
  static async getProjects() {
    try {
      const response = await apiClient.get('/projects');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      throw error;
    }
  }

  static async getProject(projectId: string) {
    try {
      const response = await apiClient.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch project:', error);
      throw error;
    }
  }

  static async createProject(projectData: any) {
    try {
      const response = await apiClient.post('/projects', projectData);
      return response.data;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }

  static async updateProject(projectId: string, projectData: any) {
    try {
      const response = await apiClient.put(`/projects/${projectId}`, projectData);
      return response.data;
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  }

  static async deleteProject(projectId: string) {
    try {
      const response = await apiClient.delete(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }

  // Tasks Integration
  static async getTasks(projectId?: string) {
    try {
      const response = await apiClient.get('/tasks', {
        params: projectId ? { projectId } : {},
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      throw error;
    }
  }

  static async getTask(taskId: string) {
    try {
      const response = await apiClient.get(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch task:', error);
      throw error;
    }
  }

  static async createTask(taskData: any) {
    try {
      const response = await apiClient.post('/tasks', taskData);
      return response.data;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }

  static async updateTask(taskId: string, taskData: any) {
    try {
      const response = await apiClient.put(`/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }

  static async deleteTask(taskId: string) {
    try {
      const response = await apiClient.delete(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }

  // Notes Integration
  static async getNotes(projectId?: string) {
    try {
      const response = await apiClient.get('/notes', {
        params: projectId ? { projectId } : {},
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notes:', error);
      throw error;
    }
  }

  static async getNote(noteId: string) {
    try {
      const response = await apiClient.get(`/notes/${noteId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch note:', error);
      throw error;
    }
  }

  static async createNote(noteData: any) {
    try {
      const response = await apiClient.post('/notes', noteData);
      return response.data;
    } catch (error) {
      console.error('Failed to create note:', error);
      throw error;
    }
  }

  static async updateNote(noteId: string, noteData: any) {
    try {
      const response = await apiClient.put(`/notes/${noteId}`, noteData);
      return response.data;
    } catch (error) {
      console.error('Failed to update note:', error);
      throw error;
    }
  }

  static async deleteNote(noteId: string) {
    try {
      const response = await apiClient.delete(`/notes/${noteId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw error;
    }
  }

  // Notifications Integration
  static async getNotifications() {
    try {
      const response = await apiClient.get('/notifications');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  }

  static async getUnreadCount() {
    try {
      const response = await apiClient.get('/notifications/unread-count');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      throw error;
    }
  }

  static async markAsRead(notificationIds?: string[]) {
    try {
      const response = await apiClient.put('/notifications/mark-read', {
        notificationIds,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      throw error;
    }
  }

  static async markAllAsRead() {
    try {
      const response = await apiClient.put('/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  // Analytics Integration
  static async getProjectAnalytics(projectId: string, startDate?: string, endDate?: string) {
    try {
      const response = await apiClient.get(`/analytics/projects/${projectId}`, {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch project analytics:', error);
      throw error;
    }
  }

  static async getTaskAnalytics(startDate?: string, endDate?: string) {
    try {
      const response = await apiClient.get('/analytics/tasks', {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch task analytics:', error);
      throw error;
    }
  }

  static async getUserAnalytics(userId: string, startDate?: string, endDate?: string) {
    try {
      const response = await apiClient.get(`/analytics/users/${userId}`, {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user analytics:', error);
      throw error;
    }
  }

  static async getTenantAnalytics(startDate?: string, endDate?: string) {
    try {
      const response = await apiClient.get('/analytics/tenant', {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch tenant analytics:', error);
      throw error;
    }
  }

  // Search Integration
  static async search(query: string, type?: string) {
    try {
      const response = await apiClient.get('/search', {
        params: { search: query, type },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search:', error);
      throw error;
    }
  }

  static async getSearchSuggestions(query: string) {
    try {
      const response = await apiClient.get('/search/suggestions', {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      throw error;
    }
  }

  static async getRecentSearches() {
    try {
      const response = await apiClient.get('/search/recent');
      return response.data;
    } catch (error) {
      console.error('Failed to get recent searches:', error);
      throw error;
    }
  }

  // Storage Integration
  static async uploadFile(file: File, noteId: string) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('noteId', noteId);

      const response = await apiClient.post('/storage/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }

  static async getAttachments(noteId: string) {
    try {
      const response = await apiClient.get(`/storage/notes/${noteId}/attachments`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
      throw error;
    }
  }

  static async deleteAttachment(attachmentId: string) {
    try {
      const response = await apiClient.delete(`/storage/attachments/${attachmentId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      throw error;
    }
  }

  // Health Check
  static async getHealthStatus() {
    try {
      const response = await apiClient.get('/monitoring/health');
      return response.data;
    } catch (error) {
      console.error('Failed to get health status:', error);
      throw error;
    }
  }
}





