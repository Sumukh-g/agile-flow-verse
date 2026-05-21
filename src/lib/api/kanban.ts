/**
 * Kanban API Client
 * Handles all Kanban board API calls
 */

import { apiClient } from '../api-client';

export interface KanbanColumn {
  id: string;
  projectId: string;
  tenantId: string;
  name: string;
  color: string;
  position: number;
  wipLimit?: number;
  collapsed: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  cards?: KanbanCard[];
}

export interface KanbanCard {
  id: string;
  projectId: string;
  tenantId: string;
  columnId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  position: number;
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  actualHours: number;
  assignees: string[];
  labels: string[];
  subtasks?: any[];
  checklists?: any[];
  attachments?: any[];
  comments?: any[];
  dependencies: string[];
  blockedBy: string[];
  blocking: string[];
  customFields?: any;
  archived: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const kanbanApi = {
  // Columns
  async getColumns(projectId: string): Promise<KanbanColumn[]> {
    return apiClient.get(`/kanban/projects/${projectId}/columns`);
  },

  async createColumn(projectId: string, data: Partial<KanbanColumn>): Promise<KanbanColumn> {
    return apiClient.post(`/kanban/projects/${projectId}/columns`, data);
  },

  async updateColumn(projectId: string, columnId: string, data: Partial<KanbanColumn>): Promise<KanbanColumn> {
    return apiClient.put(`/kanban/projects/${projectId}/columns/${columnId}`, data);
  },

  async deleteColumn(projectId: string, columnId: string, moveToColumnId?: string): Promise<void> {
    return apiClient.delete(`/kanban/projects/${projectId}/columns/${columnId}`, {
      data: { moveToColumnId },
    });
  },

  async reorderColumns(projectId: string, columnIds: string[]): Promise<KanbanColumn[]> {
    return apiClient.put(`/kanban/projects/${projectId}/columns/reorder`, { columnIds });
  },

  // Cards
  async getCards(projectId: string, columnId?: string): Promise<KanbanCard[]> {
    const params = columnId ? { columnId } : {};
    return apiClient.get(`/kanban/projects/${projectId}/cards`, { params });
  },

  async createCard(projectId: string, data: Partial<KanbanCard>): Promise<KanbanCard> {
    return apiClient.post(`/kanban/projects/${projectId}/cards`, data);
  },

  async updateCard(projectId: string, cardId: string, data: Partial<KanbanCard>): Promise<KanbanCard> {
    return apiClient.put(`/kanban/projects/${projectId}/cards/${cardId}`, data);
  },

  async deleteCard(projectId: string, cardId: string): Promise<void> {
    return apiClient.delete(`/kanban/projects/${projectId}/cards/${cardId}`);
  },

  async moveCard(projectId: string, cardId: string, targetColumnId: string, newPosition: number): Promise<KanbanCard> {
    return apiClient.put(`/kanban/projects/${projectId}/cards/${cardId}/move`, {
      targetColumnId,
      newPosition,
    });
  },
};

