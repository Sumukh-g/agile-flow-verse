/**
 * Hook for tracking and displaying user presence
 */

import { useEffect, useState } from 'react';
import { presenceTracker, type PresenceInfo } from '@/lib/presence-tracker';
import { useAuth } from '@/lib/auth-context';

export function usePresence(
  resourceType: 'task' | 'project' | 'note',
  resourceId: string,
) {
  const [presence, setPresence] = useState<PresenceInfo[]>([]);
  const { user } = useAuth();

  // Update presence when user views resource
  useEffect(() => {
    if (!user || !resourceId) return;

    presenceTracker.updatePresence(
      user.id,
      user.name,
      user.email,
      resourceType,
      resourceId,
    );

    // Update presence every 10 seconds while viewing
    const interval = setInterval(() => {
      presenceTracker.updatePresence(
        user.id,
        user.name,
        user.email,
        resourceType,
        resourceId,
      );
    }, 10000);

    // Clean up on unmount
    return () => {
      clearInterval(interval);
      presenceTracker.removePresence(user.id, resourceType, resourceId);
    };
  }, [user, resourceType, resourceId]);

  // Update presence list periodically
  useEffect(() => {
    const updatePresence = () => {
      const currentPresence = presenceTracker.getPresence(resourceType, resourceId);
      setPresence(currentPresence);
    };

    updatePresence();
    const interval = setInterval(updatePresence, 5000);

    return () => clearInterval(interval);
  }, [resourceType, resourceId]);

  return presence;
}

/**
 * Hook to track which resources the current user is viewing
 */
export function useUserPresence() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Array<{ resourceType: string; resourceId: string }>>([]);

  useEffect(() => {
    if (!user) return;

    const updateResources = () => {
      const userResources = presenceTracker.getUserResources(user.id);
      setResources(userResources);
    };

    updateResources();
    const interval = setInterval(updateResources, 5000);

    return () => clearInterval(interval);
  }, [user]);

  return resources;
}

