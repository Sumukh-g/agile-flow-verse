/**
 * Kanban Hooks
 * React Query hooks for Kanban board operations
 * 
 * These hooks provide data synchronization across all Kanban board instances.
 * When data changes in one view, all other views are automatically updated.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { kanbanApi, KanbanCard, KanbanColumn } from '@/lib/api/kanban';

// Re-export types for convenience
export type { KanbanCard, KanbanColumn } from '@/lib/api/kanban';

/**
 * Helper function to invalidate all Kanban-related queries for a project
 * This ensures data is synchronized across all views (Boards page, Project view, etc.)
 */
function invalidateKanbanQueries(queryClient: ReturnType<typeof useQueryClient>, projectId: string) {
  // Invalidate columns query (exact match)
  queryClient.invalidateQueries({ 
    queryKey: ['kanban', 'columns', projectId],
    exact: true,
    refetchType: 'all'
  });
  
  // Invalidate cards query (all cards for this project)
  queryClient.invalidateQueries({ 
    queryKey: ['kanban', 'cards', projectId],
    refetchType: 'all'
  });
  
  // Also invalidate any partial matches to ensure all views update
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      return Array.isArray(key) && 
             key[0] === 'kanban' && 
             (key[2] === projectId || key[3] === projectId);
    },
    refetchType: 'all'
  });
}

/**
 * Get all Kanban columns for a project
 * 
 * Features:
 * - Auto-refetches when window gains focus
 * - Refetches on component mount
 * - No stale time to ensure fresh data
 */
export function useKanbanColumns(projectId: string | undefined) {
  return useQuery({
    queryKey: ['kanban', 'columns', projectId],
    queryFn: () => kanbanApi.getColumns(projectId!),
    enabled: !!projectId,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: 'always', // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when tab becomes active
    refetchOnReconnect: true, // Refetch on network reconnection
    retry: (failureCount, error: any) => {
      // Don't retry on 403 (Forbidden) or 404 (Not Found) errors
      if (error?.response?.status === 403 || error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Get all Kanban cards for a project
 * 
 * Features:
 * - Auto-refetches when window gains focus  
 * - Refetches on component mount
 * - Optional column filtering
 */
export function useKanbanCards(projectId: string | undefined, columnId?: string) {
  return useQuery({
    queryKey: ['kanban', 'cards', projectId, columnId],
    queryFn: () => kanbanApi.getCards(projectId!, columnId),
    enabled: !!projectId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: (failureCount, error: any) => {
      // Don't retry on 403 (Forbidden) or 404 (Not Found) errors
      if (error?.response?.status === 403 || error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Create a new Kanban column
 * 
 * Features:
 * - Invalidates ALL Kanban queries for the project
 * - Forces immediate refetch across all views
 * - Shows success/error toast notifications
 */
export function useCreateKanbanColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: Partial<KanbanColumn> }) =>
      kanbanApi.createColumn(projectId, data),
    onSuccess: (newColumn, { projectId }) => {
      // Invalidate ALL related queries to sync across all views
      invalidateKanbanQueries(queryClient, projectId);
      
      // Force immediate refetch to update UI
      queryClient.refetchQueries({ 
        queryKey: ['kanban', 'columns', projectId],
        exact: true 
      });
      
      toast.success('Column created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to create column');
    },
  });
}

/**
 * Update a Kanban column
 * 
 * Features:
 * - Syncs changes across all views
 * - Updates both columns and cards queries
 */
export function useUpdateKanbanColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      columnId,
      data,
    }: {
      projectId: string;
      columnId: string;
      data: Partial<KanbanColumn>;
    }) => kanbanApi.updateColumn(projectId, columnId, data),
    onSuccess: (_, { projectId }) => {
      // Sync across all views
      invalidateKanbanQueries(queryClient, projectId);
      toast.success('Column updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to update column');
    },
  });
}

/**
 * Delete a Kanban column
 * 
 * Features:
 * - Optionally moves cards to another column before deletion
 * - Syncs changes across all views
 */
export function useDeleteKanbanColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      columnId,
      moveToColumnId,
    }: {
      projectId: string;
      columnId: string;
      moveToColumnId?: string;
    }) => kanbanApi.deleteColumn(projectId, columnId, moveToColumnId),
    onSuccess: (_, { projectId }) => {
      // Sync across all views
      invalidateKanbanQueries(queryClient, projectId);
      toast.success('Column deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to delete column');
    },
  });
}

/**
 * Reorder Kanban columns
 * 
 * Features:
 * - Updates column positions
 * - Syncs changes across all views
 */
export function useReorderKanbanColumns() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, columnIds }: { projectId: string; columnIds: string[] }) =>
      kanbanApi.reorderColumns(projectId, columnIds),
    onSuccess: (_, { projectId }) => {
      // Sync across all views
      invalidateKanbanQueries(queryClient, projectId);
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to reorder columns');
    },
  });
}

/**
 * Create a new Kanban card
 * 
 * Features:
 * - Creates card in specified column
 * - Syncs changes across all views
 */
export function useCreateKanbanCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: Partial<KanbanCard> }) =>
      kanbanApi.createCard(projectId, data),
    onSuccess: (_, { projectId }) => {
      // Sync across all views
      invalidateKanbanQueries(queryClient, projectId);
      toast.success('Card created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to create card');
    },
  });
}

/**
 * Update a Kanban card
 * 
 * Features:
 * - Updates any card properties
 * - Syncs changes across all views
 */
export function useUpdateKanbanCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      cardId,
      data,
    }: {
      projectId: string;
      cardId: string;
      data: Partial<KanbanCard>;
    }) => kanbanApi.updateCard(projectId, cardId, data),
    onSuccess: (_, { projectId }) => {
      // Sync across all views
      invalidateKanbanQueries(queryClient, projectId);
      toast.success('Card updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to update card');
    },
  });
}

/**
 * Delete a Kanban card
 * 
 * Features:
 * - Removes card from column
 * - Syncs changes across all views
 */
export function useDeleteKanbanCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, cardId }: { projectId: string; cardId: string }) =>
      kanbanApi.deleteCard(projectId, cardId),
    onSuccess: (_, { projectId }) => {
      // Sync across all views
      invalidateKanbanQueries(queryClient, projectId);
      toast.success('Card deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to delete card');
    },
  });
}

/**
 * Move a Kanban card (drag and drop)
 * 
 * Features:
 * - Moves card between columns
 * - Updates card position within column
 * - Syncs changes across all views (no toast to avoid spam during drag)
 */
export function useMoveKanbanCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      cardId,
      targetColumnId,
      newPosition,
    }: {
      projectId: string;
      cardId: string;
      targetColumnId: string;
      newPosition: number;
    }) => kanbanApi.moveCard(projectId, cardId, targetColumnId, newPosition),
    onSuccess: (_, { projectId }) => {
      // Sync across all views (no toast for move to avoid spam)
      invalidateKanbanQueries(queryClient, projectId);
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to move card');
    },
  });
}

