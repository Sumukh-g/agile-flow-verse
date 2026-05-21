import { useEffect, useRef, useCallback } from 'react';
import { realtimeClient, RealtimeEvent } from '@/lib/realtime-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import {
  handleTaskRealtimeEvent,
  handleProjectRealtimeEvent,
  handleNoteRealtimeEvent,
  createDebouncedEventHandler,
  type RealtimeEventData,
} from '@/lib/realtime-cache-sync';
import { presenceTracker } from '@/lib/presence-tracker';
import { conflictDetector } from '@/lib/conflict-detector';

export function useRealtime() {
  const queryClient = useQueryClient();
  const { user, token } = useAuth();
  const initializedRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stateSyncRef = useRef(false);

  // Debounced event handlers to prevent overwhelming the UI
  const debouncedTaskHandler = useRef(
    createDebouncedEventHandler(handleTaskRealtimeEvent, 100)
  ).current;
  const debouncedProjectHandler = useRef(
    createDebouncedEventHandler(handleProjectRealtimeEvent, 100)
  ).current;
  const debouncedNoteHandler = useRef(
    createDebouncedEventHandler(handleNoteRealtimeEvent, 100)
  ).current;

  // Sync state after reconnection
  const syncStateAfterReconnect = useCallback(async () => {
    if (!user || stateSyncRef.current) return;
    
    stateSyncRef.current = true;
    
    try {
      // Invalidate all queries to get fresh data after reconnection
      queryClient.invalidateQueries();
      
      // Re-subscribe to channels
      const channels: string[] = [];
      if (user.tenantId) {
        channels.push(`tenant:${user.tenantId}`);
      }
      await realtimeClient.subscribe(channels);
      
      console.log('[useRealtime] State synced after reconnection');
    } catch (error) {
      console.error('[useRealtime] State sync failed:', error);
    } finally {
      stateSyncRef.current = false;
    }
  }, [user, queryClient]);

  useEffect(() => {
    if (!token || !user || initializedRef.current) return;

    const connect = async () => {
      try {
        await realtimeClient.connect(token, user.tenantId || '');
        initializedRef.current = true;
        stateSyncRef.current = false;

        // Subscribe to project and task channels
        const channels: string[] = [];
        if (user.tenantId) {
          channels.push(`tenant:${user.tenantId}`);
        }
        await realtimeClient.subscribe(channels);

        // Set up event handlers with targeted cache updates
        const taskHandler = (data: RealtimeEventData) => {
          debouncedTaskHandler(queryClient, data.event, data);
        };

        const projectHandler = (data: RealtimeEventData) => {
          debouncedProjectHandler(queryClient, data.event, data);
        };

        const noteHandler = (data: RealtimeEventData) => {
          debouncedNoteHandler(queryClient, data.event, data);
        };

        // Subscribe to events
        realtimeClient.on('task.created', taskHandler);
        realtimeClient.on('task.updated', taskHandler);
        realtimeClient.on('task.deleted', taskHandler);
        realtimeClient.on('project.created', projectHandler);
        realtimeClient.on('project.updated', projectHandler);
        realtimeClient.on('project.deleted', projectHandler);
        // Project member events - critical for newly added members to see projects
        realtimeClient.on('project.member.added', projectHandler);
        realtimeClient.on('project.member.updated', projectHandler);
        realtimeClient.on('project.member.removed', projectHandler);
        realtimeClient.on('note.created', noteHandler);
        realtimeClient.on('note.updated', noteHandler);
        realtimeClient.on('note.deleted', noteHandler);

        // Handle reconnection
        realtimeClient.on('reconnect', () => {
          console.log('[useRealtime] Reconnected, syncing state...');
          syncStateAfterReconnect();
        });

        // Store handlers for cleanup
        (realtimeClient as any)._handlers = {
          taskHandler,
          projectHandler,
          noteHandler,
        };
      } catch (error) {
        console.error('[useRealtime] Connection failed:', error);
        
        // Retry connection after delay
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (initializedRef.current) {
        // Clean up event handlers
        const handlers = (realtimeClient as any)._handlers;
        if (handlers) {
          realtimeClient.off('task.created', handlers.taskHandler);
          realtimeClient.off('task.updated', handlers.taskHandler);
          realtimeClient.off('task.deleted', handlers.taskHandler);
          realtimeClient.off('project.created', handlers.projectHandler);
          realtimeClient.off('project.updated', handlers.projectHandler);
          realtimeClient.off('project.deleted', handlers.projectHandler);
          realtimeClient.off('note.created', handlers.noteHandler);
          realtimeClient.off('note.updated', handlers.noteHandler);
          realtimeClient.off('note.deleted', handlers.noteHandler);
        }
        
        realtimeClient.disconnect();
        initializedRef.current = false;
      }
    };
  }, [token, user, queryClient, debouncedTaskHandler, debouncedProjectHandler, debouncedNoteHandler, syncStateAfterReconnect]);

  return {
    connected: realtimeClient.connected,
    subscribe: realtimeClient.subscribe.bind(realtimeClient),
    unsubscribe: realtimeClient.unsubscribe.bind(realtimeClient),
  };
}

export function useRealtimeSubscription<T = any>(
  event: RealtimeEvent,
  callback: (data: T) => void,
  dependencies: any[] = [],
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handler = (data: T) => {
      callbackRef.current(data);
    };

    const unsubscribe = realtimeClient.on(event, handler);

    return () => {
      unsubscribe();
    };
  }, [event, ...dependencies]);
}

export function useRealtimeInvalidation(event: RealtimeEvent, queryKeys: string[][]) {
  const queryClient = useQueryClient();

  useRealtimeSubscription(event, () => {
    queryKeys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  }, [event, queryKeys]);
}

