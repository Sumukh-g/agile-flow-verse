/**
 * Presence Tracker
 * Tracks which users are viewing which resources
 */

export interface PresenceInfo {
  userId: string;
  userName?: string;
  userEmail?: string;
  resourceType: 'task' | 'project' | 'note';
  resourceId: string;
  lastSeen: string;
}

class PresenceTracker {
  private presence = new Map<string, Map<string, PresenceInfo>>(); // resourceType:resourceId -> userId -> PresenceInfo

  /**
   * Update user presence for a resource
   */
  updatePresence(
    userId: string,
    userName: string | undefined,
    userEmail: string | undefined,
    resourceType: 'task' | 'project' | 'note',
    resourceId: string,
  ): void {
    const key = `${resourceType}:${resourceId}`;
    
    if (!this.presence.has(key)) {
      this.presence.set(key, new Map());
    }

    const resourcePresence = this.presence.get(key)!;
    resourcePresence.set(userId, {
      userId,
      userName,
      userEmail,
      resourceType,
      resourceId,
      lastSeen: new Date().toISOString(),
    });
  }

  /**
   * Remove user presence for a resource
   */
  removePresence(
    userId: string,
    resourceType: 'task' | 'project' | 'note',
    resourceId: string,
  ): void {
    const key = `${resourceType}:${resourceId}`;
    const resourcePresence = this.presence.get(key);
    
    if (resourcePresence) {
      resourcePresence.delete(userId);
      if (resourcePresence.size === 0) {
        this.presence.delete(key);
      }
    }
  }

  /**
   * Get all users viewing a resource
   */
  getPresence(
    resourceType: 'task' | 'project' | 'note',
    resourceId: string,
  ): PresenceInfo[] {
    const key = `${resourceType}:${resourceId}`;
    const resourcePresence = this.presence.get(key);
    
    if (!resourcePresence) {
      return [];
    }

    // Filter out stale presence (older than 30 seconds)
    const now = Date.now();
    const staleThreshold = 30000;

    return Array.from(resourcePresence.values()).filter((info) => {
      const lastSeen = new Date(info.lastSeen).getTime();
      return now - lastSeen < staleThreshold;
    });
  }

  /**
   * Clean up stale presence entries
   */
  cleanup(): void {
    const now = Date.now();
    const staleThreshold = 30000;

    for (const [key, resourcePresence] of this.presence.entries()) {
      for (const [userId, info] of resourcePresence.entries()) {
        const lastSeen = new Date(info.lastSeen).getTime();
        if (now - lastSeen >= staleThreshold) {
          resourcePresence.delete(userId);
        }
      }

      if (resourcePresence.size === 0) {
        this.presence.delete(key);
      }
    }
  }

  /**
   * Get all resources a user is viewing
   */
  getUserResources(userId: string): Array<{ resourceType: string; resourceId: string }> {
    const resources: Array<{ resourceType: string; resourceId: string }> = [];

    for (const [key, resourcePresence] of this.presence.entries()) {
      if (resourcePresence.has(userId)) {
        const [resourceType, resourceId] = key.split(':');
        resources.push({ resourceType, resourceId });
      }
    }

    return resources;
  }
}

export const presenceTracker = new PresenceTracker();

// Clean up stale presence every 30 seconds
if (typeof window !== 'undefined') {
  setInterval(() => {
    presenceTracker.cleanup();
  }, 30000);
}

