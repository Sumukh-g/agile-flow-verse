# Project Member Visibility Fix

## Issue
When a member was added to a project, that member was unable to see the project in their projects list, even though they were successfully added as a member.

## Root Cause
The issue was caused by **cache invalidation problems**:

1. **Backend Cache**: When a member was added, the backend cache for the newly added member's projects list was not being invalidated
2. **Frontend Cache**: The React Query cache for the projects list was not being invalidated when a member was added
3. **Real-time Updates**: The frontend wasn't listening to `project.member.added` events, so newly added members wouldn't see the project until they refreshed

## Solution

### 1. Backend Cache Invalidation (`src/api/projects/projects.service.ts`)
**Added cache invalidation for the newly added member:**
```typescript
// Invalidate cache for both the person who added the member AND the newly added member
await this.cache.invalidateProjects(tenantId, userId); // Person who added
await this.cache.invalidateProjects(tenantId, targetUserId); // Newly added member ⭐
await this.cache.invalidateProjectMembership(tenantId, targetUserId, projectId);
await this.cache.invalidateDashboard(tenantId, targetUserId);
```

### 2. Frontend Cache Invalidation (`src/hooks/useProjectMembers.ts`)
**Added projects list invalidation:**
```typescript
onSuccess: (_, { projectId }) => {
  queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
  queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
  queryClient.invalidateQueries({ queryKey: ['projects'] }); // ⭐ CRITICAL: Invalidate projects list
  queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  toast.success('Member added successfully');
},
```

### 3. Real-time Event Handling (`src/lib/realtime-cache-sync.ts` & `src/hooks/useRealtime.ts`)
**Added handlers for project member events:**
```typescript
// In handleProjectRealtimeEvent
case 'project.member.added':
case 'project.member.updated':
case 'project.member.removed':
  // Invalidate projects list so newly added members can see the project
  queryClient.invalidateQueries({ queryKey: cacheKeys.projects.lists() });
  break;
```

**Subscribed to member events:**
```typescript
realtimeClient.on('project.member.added', projectHandler);
realtimeClient.on('project.member.updated', projectHandler);
realtimeClient.on('project.member.removed', projectHandler);
```

## How It Works Now

1. **When a member is added:**
   - Backend creates the `ProjectMember` record ✅
   - Backend invalidates cache for the newly added member ✅
   - Backend broadcasts `project.member.added` event ✅
   - Frontend invalidates projects list cache ✅
   - Real-time event triggers cache invalidation for all connected clients ✅

2. **When the newly added member queries projects:**
   - Backend checks `projectMember` table for their memberships ✅
   - Returns projects where user is creator OR member ✅
   - Cache is fresh (was invalidated) ✅

3. **If the member is logged in when added:**
   - Real-time event is received ✅
   - Projects list cache is invalidated ✅
   - Projects list automatically refetches ✅
   - Member sees the project immediately ✅

## Testing

To verify the fix works:

1. **As Project Owner:**
   - Add a member to a project
   - Verify member appears in members list

2. **As Newly Added Member:**
   - Log in with the added member's account
   - Go to Projects page
   - **Expected**: Project should appear in the list
   - If it doesn't appear immediately, refresh the page (cache should be invalidated)

3. **Real-time Test:**
   - Have the member logged in on another device/browser
   - Add them as a member
   - **Expected**: Project should appear in their list without refresh (via real-time update)

## Additional Improvements

- Added debug logging to help diagnose tenant/userId mismatches
- Improved error messages
- Added comprehensive cache invalidation strategy

## Files Modified

1. `src/api/projects/projects.service.ts` - Added cache invalidation for newly added members
2. `src/hooks/useProjectMembers.ts` - Added projects list cache invalidation
3. `src/lib/realtime-cache-sync.ts` - Added handler for project.member.* events
4. `src/hooks/useRealtime.ts` - Subscribed to project.member.* events

---

**Status**: ✅ **FIXED**
**Date**: December 9, 2025





