/**
 * Storage/Attachments API Client
 */

import { apiClient } from '../api-client';

export interface Attachment {
  id: string;
  tenantId: string;
  noteId?: string;
  projectId?: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  path: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AttachmentQuery {
  search?: string;
  mimeType?: string;
  limit?: number;
  offset?: number;
  projectId?: string;
}

export interface StorageStats {
  totalFiles: number;
  totalSizeBytes: number;
  totalSizeMB: number;
  byMimeType: Record<string, {
    count: number;
    sizeBytes: number;
    sizeMB: number;
  }>;
}

export const storageApi = {
  /**
   * Upload a file
   */
  async uploadFile(file: File, metadata: { noteId?: string; projectId?: string }): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.noteId) {
      formData.append('noteId', metadata.noteId);
    }
    if (metadata.projectId) {
      formData.append('projectId', metadata.projectId);
    }
    // Don't set Content-Type header - let the browser set it with the boundary
    return apiClient.post('/storage/upload', formData);
  },

  /**
   * Get attachment metadata
   */
  async getAttachment(id: string): Promise<Attachment> {
    return apiClient.get(`/storage/attachments/${id}`);
  },

  /**
   * Download attachment file
   */
  async downloadAttachment(id: string): Promise<Blob> {
    const response = await apiClient.get(`/storage/attachments/${id}/download`, {
      responseType: 'blob',
    });
    return response;
  },

  /**
   * Get note attachments
   */
  async getNoteAttachments(noteId: string, query?: AttachmentQuery): Promise<{ attachments: Attachment[]; total: number; hasMore: boolean }> {
    return apiClient.get(`/storage/notes/${noteId}/attachments`, { params: query });
  },

  /**
   * Get project attachments
   */
  async getProjectAttachments(projectId: string, query?: AttachmentQuery): Promise<{ attachments: Attachment[]; total: number; hasMore: boolean }> {
    return apiClient.get(`/storage/projects/${projectId}/attachments`, { params: query });
  },

  /**
   * Delete attachment
   */
  async deleteAttachment(id: string): Promise<void> {
    return apiClient.delete(`/storage/attachments/${id}`);
  },

  /**
   * Get storage statistics
   */
  async getStats(): Promise<StorageStats> {
    return apiClient.get('/storage/stats');
  },
};

