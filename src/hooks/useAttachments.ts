/**
 * Attachments Hooks with React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { storageApi, type Attachment, type AttachmentQuery } from '@/lib/api/storage';

// Query keys
export const attachmentKeys = {
  all: ['attachments'] as const,
  lists: () => [...attachmentKeys.all, 'list'] as const,
  list: (projectId?: string, noteId?: string) => [...attachmentKeys.lists(), { projectId, noteId }] as const,
  details: () => [...attachmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...attachmentKeys.details(), id] as const,
  stats: () => [...attachmentKeys.all, 'stats'] as const,
};

/**
 * Get project attachments
 */
export function useProjectAttachments(projectId?: string, query?: AttachmentQuery) {
  return useQuery({
    queryKey: [...attachmentKeys.list(projectId), query],
    queryFn: () => storageApi.getProjectAttachments(projectId!, query),
    enabled: !!projectId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

/**
 * Get note attachments
 */
export function useNoteAttachments(noteId?: string, query?: AttachmentQuery) {
  return useQuery({
    queryKey: attachmentKeys.list(undefined, noteId),
    queryFn: () => storageApi.getNoteAttachments(noteId!, query),
    enabled: !!noteId,
    staleTime: 30000,
  });
}

/**
 * Get a single attachment
 */
export function useAttachment(id: string) {
  return useQuery({
    queryKey: attachmentKeys.detail(id),
    queryFn: () => storageApi.getAttachment(id),
    enabled: !!id,
    staleTime: 60000,
  });
}

/**
 * Upload attachment
 */
export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, metadata }: { file: File; metadata: { noteId?: string; projectId?: string } }) =>
      storageApi.uploadFile(file, metadata),
    onSuccess: (data, variables) => {
      // Immediately update the cache with the new attachment (optimistic update)
      if (variables.metadata.projectId && data) {
        // Update all queries for this project
        queryClient.setQueriesData(
          { queryKey: attachmentKeys.list(variables.metadata.projectId), exact: false },
          (oldData: any) => {
            if (!oldData) return oldData;
            // Check if attachment already exists to avoid duplicates
            const exists = oldData.attachments?.some((att: any) => att.id === data.id);
            if (exists) return oldData;
            // Add new attachment at the beginning (most recent first)
            return {
              ...oldData,
              attachments: [data, ...(oldData.attachments || [])],
              total: (oldData.total || 0) + 1,
            };
          }
        );
        
        // Invalidate and refetch to ensure consistency
        queryClient.invalidateQueries({ 
          queryKey: attachmentKeys.list(variables.metadata.projectId),
          exact: false 
        });
        queryClient.invalidateQueries({ queryKey: attachmentKeys.lists() });
        queryClient.invalidateQueries({ queryKey: attachmentKeys.stats() });
        
        // Force immediate refetch in background
        queryClient.refetchQueries({ 
          queryKey: attachmentKeys.list(variables.metadata.projectId),
          exact: false,
          type: 'active'
        });
      }
      if (variables.metadata.noteId && data) {
        queryClient.setQueriesData(
          { queryKey: attachmentKeys.list(undefined, variables.metadata.noteId), exact: false },
          (oldData: any) => {
            if (!oldData) return oldData;
            const exists = oldData.attachments?.some((att: any) => att.id === data.id);
            if (exists) return oldData;
            return {
              ...oldData,
              attachments: [data, ...(oldData.attachments || [])],
              total: (oldData.total || 0) + 1,
            };
          }
        );
        queryClient.invalidateQueries({ 
          queryKey: attachmentKeys.list(undefined, variables.metadata.noteId),
          exact: false 
        });
        queryClient.invalidateQueries({ queryKey: attachmentKeys.lists() });
        queryClient.invalidateQueries({ queryKey: attachmentKeys.stats() });
        queryClient.refetchQueries({ 
          queryKey: attachmentKeys.list(undefined, variables.metadata.noteId),
          exact: false,
          type: 'active'
        });
      }
      toast.success('File uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to upload file');
    },
  });
}

/**
 * Delete attachment
 */
export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storageApi.deleteAttachment(id),
    onSuccess: (_, id) => {
      // Optimistically remove from all lists immediately
      queryClient.setQueriesData(
        { queryKey: attachmentKeys.lists(), exact: false },
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            attachments: oldData.attachments?.filter((att: any) => att.id !== id) || [],
            total: Math.max(0, (oldData.total || 1) - 1),
          };
        }
      );
      
      queryClient.removeQueries({ queryKey: attachmentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: attachmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: attachmentKeys.stats() });
      queryClient.refetchQueries({ queryKey: attachmentKeys.lists(), exact: false, type: 'active' });
      toast.success('Attachment deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete attachment');
    },
  });
}

/**
 * Download attachment
 */
export function useDownloadAttachment() {
  return useMutation({
    mutationFn: async (id: string) => {
      const blob = await storageApi.downloadAttachment(id);
      return blob;
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to download file');
    },
  });
}

/**
 * Get storage statistics
 */
export function useStorageStats() {
  return useQuery({
    queryKey: attachmentKeys.stats(),
    queryFn: () => storageApi.getStats(),
    staleTime: 60000,
  });
}

