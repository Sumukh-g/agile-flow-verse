import { useEffect, useRef } from 'react';
import { realtimeClient, RealtimeEvent } from '@/lib/realtime-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';

export function useRealtime() {
  const queryClient = useQueryClient();
  const { user, token } = useAuth();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!token || !user || initializedRef.current) return;

    const connect = async () => {
      try {
        await realtimeClient.connect(token, user.tenantId || '');
        initializedRef.current = true;

        // Subscribe to project and task channels
        const channels: string[] = [];
        if (user.tenantId) {
          channels.push(`tenant:${user.tenantId}`);
        }
        await realtimeClient.subscribe(channels);
      } catch (error) {
        console.error('[useRealtime] Connection failed:', error);
      }
    };

    connect();

    return () => {
      if (initializedRef.current) {
        realtimeClient.disconnect();
        initializedRef.current = false;
      }
    };
  }, [token, user]);

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

