/**
 * Notes API Client
 */

import { apiClient } from '../api-client';
import {
  Note,
  CreateNoteDto,
  UpdateNoteDto,
  Attachment,
  Comment,
} from './types';

export const notesApi = {
  /**
   * Get all notes
   */
  async getNotes(projectId?: string): Promise<Note[]> {
    const response = await apiClient.get('/notes', { params: { projectId } });
    // Backend returns { items: Note[], nextCursor: string | null }
    // Return just the items array
    return response?.items || response || [];
  },

  /**
   * Get a single note by ID
   */
  async getNote(id: string): Promise<Note> {
    return apiClient.get(`/notes/${id}`);
  },

  /**
   * Create a new note
   */
  async createNote(data: CreateNoteDto): Promise<Note> {
    return apiClient.post('/notes', data);
  },

  /**
   * Update an existing note
   */
  async updateNote(id: string, data: UpdateNoteDto): Promise<Note> {
    return apiClient.put(`/notes/${id}`, data);
  },

  /**
   * Delete a note
   */
  async deleteNote(id: string): Promise<void> {
    return apiClient.delete(`/notes/${id}`);
  },

  /**
   * Get attachments for a note
   */
  async getAttachments(noteId: string): Promise<Attachment[]> {
    return apiClient.get(`/storage/notes/${noteId}/attachments`);
  },

  /**
   * Upload an attachment to a note
   */
  async uploadAttachment(noteId: string, file: File): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('noteId', noteId);
    return apiClient.post('/storage/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Delete an attachment
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    return apiClient.delete(`/storage/attachments/${attachmentId}`);
  },

  /**
   * Get comments for a note
   */
  async getComments(noteId: string): Promise<Comment[]> {
    return apiClient.get(`/comments/${noteId}`);
  },

  /**
   * Add a comment to a note
   */
  async addComment(noteId: string, content: string): Promise<Comment> {
    return apiClient.post(`/comments/${noteId}`, { content });
  },
};

