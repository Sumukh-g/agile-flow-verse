/**
 * Conflict Detection for Concurrent Edits
 * Detects and resolves conflicts when multiple users edit the same resource
 */

export interface EditConflict {
  resourceId: string;
  resourceType: 'task' | 'project' | 'note';
  localVersion: number;
  remoteVersion: number;
  localChanges: Record<string, any>;
  remoteChanges: Record<string, any>;
  conflictFields: string[];
}

export interface VersionedResource {
  id: string;
  version: number;
  updatedAt: string;
  [key: string]: any;
}

class ConflictDetector {
  /**
   * Detect if there's a conflict between local and remote versions
   */
  detectConflict(
    local: VersionedResource,
    remote: VersionedResource,
  ): EditConflict | null {
    if (local.id !== remote.id) {
      return null; // Different resources
    }

    if (remote.version <= local.version) {
      return null; // No conflict, remote is older or same
    }

    // Conflict detected - remote has newer version
    const conflictFields = this.getChangedFields(local, remote);
    
    return {
      resourceId: local.id,
      resourceType: this.getResourceType(local),
      localVersion: local.version,
      remoteVersion: remote.version,
      localChanges: this.getChanges(local, remote),
      remoteChanges: this.getChanges(remote, local),
      conflictFields,
    };
  }

  /**
   * Resolve conflict by merging changes (last-write-wins for now)
   * In production, you might want more sophisticated merge strategies
   */
  resolveConflict(
    conflict: EditConflict,
    strategy: 'local' | 'remote' | 'merge' = 'remote',
  ): VersionedResource {
    if (strategy === 'local') {
      return {
        ...conflict.localChanges as VersionedResource,
        version: conflict.remoteVersion, // Update version to match remote
      };
    }

    if (strategy === 'remote') {
      return {
        ...conflict.remoteChanges as VersionedResource,
        version: conflict.remoteVersion,
      };
    }

    // Merge strategy: combine non-conflicting fields, use remote for conflicting fields
    const merged = {
      ...conflict.localChanges,
      ...conflict.remoteChanges,
      version: conflict.remoteVersion,
    };

    // For conflicting fields, prefer remote
    conflict.conflictFields.forEach((field) => {
      if (field in conflict.remoteChanges) {
        merged[field] = conflict.remoteChanges[field];
      }
    });

    return merged as VersionedResource;
  }

  private getResourceType(resource: VersionedResource): 'task' | 'project' | 'note' {
    // Infer from resource structure or add type field
    if ('title' in resource && 'status' in resource) {
      return 'task';
    }
    if ('name' in resource && 'description' in resource) {
      return 'project';
    }
    return 'note';
  }

  private getChangedFields(local: VersionedResource, remote: VersionedResource): string[] {
    const changed: string[] = [];
    
    for (const key in remote) {
      if (key === 'version' || key === 'updatedAt' || key === 'id') {
        continue;
      }
      
      if (local[key] !== remote[key]) {
        changed.push(key);
      }
    }

    return changed;
  }

  private getChanges(source: VersionedResource, target: VersionedResource): Record<string, any> {
    const changes: Record<string, any> = {};
    
    for (const key in source) {
      if (key === 'version' || key === 'updatedAt') {
        continue;
      }
      
      if (source[key] !== target[key]) {
        changes[key] = source[key];
      }
    }

    return changes;
  }
}

export const conflictDetector = new ConflictDetector();

