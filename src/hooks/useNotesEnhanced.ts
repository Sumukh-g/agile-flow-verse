/**
 * Enhanced Notes Hooks with React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, type Note, type CreateNoteDto, type UpdateNoteDto } from '@/lib/api';

// Query keys
export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (projectId?: string) => [...noteKeys.lists(), { projectId }] as const,
  details: () => [...noteKeys.all, 'detail'] as const,
  detail: (id: string) => [...noteKeys.details(), id] as const,
  attachments: (id: string) => [...noteKeys.detail(id), 'attachments'] as const,
  comments: (id: string) => [...noteKeys.detail(id), 'comments'] as const,
};

/**
 * Get all notes
 */
export function useNotes(projectId?: string) {
  return useQuery({
    queryKey: noteKeys.list(projectId),
    queryFn: () => api.notes.getNotes(projectId),
    staleTime: 30000,
  });
}

/**
 * Get a single note
 */
export function useNote(id: string) {
  return useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: () => api.notes.getNote(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

/**
 * Create a new note
 */
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNoteDto) => api.notes.createNote(data),
    onSuccess: (newNote) => {
      // Invalidate all note lists to ensure the new note appears
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      // Also invalidate the specific project's notes if projectId is available
      if (newNote.projectId) {
        queryClient.invalidateQueries({ queryKey: noteKeys.list(newNote.projectId) });
      }
      queryClient.setQueryData<Note>(noteKeys.detail(newNote.id), newNote);
      // Don't show toast here - let the component handle it
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || error?.response?.data?.message || 'Failed to create note');
    },
  });
}

/**
 * Update a note
 */
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNoteDto }) =>
      api.notes.updateNote(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: noteKeys.detail(id) });
      const previous = queryClient.getQueryData<Note>(noteKeys.detail(id));

      if (previous) {
        queryClient.setQueryData<Note>(noteKeys.detail(id), {
          ...previous,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previous };
    },
    onSuccess: (updatedNote) => {
      queryClient.setQueryData<Note>(noteKeys.detail(updatedNote.id), updatedNote);
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      toast.success('Note updated successfully');
    },
    onError: (error: any, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(noteKeys.detail(id), context.previous);
      }
      toast.error(error?.apiError?.message || 'Failed to update note');
    },
  });
}

/**
 * Delete a note
 */
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.notes.deleteNote(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: noteKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      toast.success('Note deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to delete note');
    },
  });
}

/**
 * Get note attachments
 */
export function useNoteAttachments(noteId: string) {
  return useQuery({
    queryKey: noteKeys.attachments(noteId),
    queryFn: () => api.notes.getAttachments(noteId),
    enabled: !!noteId,
    staleTime: 60000,
  });
}

/**
 * Upload attachment
 */
export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, file }: { noteId: string; file: File }) =>
      api.notes.uploadAttachment(noteId, file),
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.attachments(noteId) });
      toast.success('Attachment uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to upload attachment');
    },
  });
}

/**
 * Delete attachment
 */
export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ attachmentId, noteId }: { attachmentId: string; noteId: string }) =>
      api.notes.deleteAttachment(attachmentId),
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.attachments(noteId) });
      toast.success('Attachment deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to delete attachment');
    },
  });
}

/**
 * Get note comments
 */
export function useNoteComments(noteId: string) {
  return useQuery({
    queryKey: noteKeys.comments(noteId),
    queryFn: () => api.notes.getComments(noteId),
    enabled: !!noteId,
    staleTime: 30000,
  });
}

/**
 * Add comment to note
 */
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, content }: { noteId: string; content: string }) =>
      api.notes.addComment(noteId, content),
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.comments(noteId) });
      toast.success('Comment added successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to add comment');
    },
  });
}

