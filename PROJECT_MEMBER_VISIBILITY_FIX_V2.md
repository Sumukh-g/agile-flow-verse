# Project Member Visibility Fix V2 - Tenant Mismatch Issue

## Issue
When a member was added to a project, that member was unable to see the project in their projects list, even after cache invalidation fixes. The root cause was a **tenant mismatch** between the JWT token and the project's tenant.

## Root Cause Analysis

### The Problem
1. **When adding a member:**
   - Project owner's `tenantId` (from JWT) is used to create the `ProjectMember` record
   - Member is added to tenant via `UserTenant` table
   - BUT: If member was created via email, their `User.tenantId` might be `null`

2. **When member queries projects:**
   - Member's JWT token contains their `tenantId` (from `User.tenantId`)
   - Query looks for `ProjectMember` records with member's JWT `tenantId`
   - If JWT `tenantId` ≠ project's `tenantId`, no match is found
   - Result: Member can't see the project

### Example Scenario
```
1. User A (tenantId: "tenant-1") creates Project X (tenantId: "tenant-1")
2. User A adds User B (email: "b@example.com") to Project X
   - ProjectMember created: { tenantId: "tenant-1", userId: "user-b", projectId: "project-x" }
   - UserTenant created: { userId: "user-b", tenantId: "tenant-1" }
   - BUT: User.tenantId might still be null or different
3. User B logs in
   - JWT token has tenantId from User.tenantId (might be null or "tenant-2")
4. User B queries projects
   - Query: ProjectMember WHERE tenantId = JWT.tenantId AND userId = "user-b"
   - If JWT.tenantId ≠ "tenant-1", no ProjectMember record is found
   - Result: Project X doesn't appear in User B's list
```

## Solution

### 1. Set User.tenantId When Adding Member (`src/api/projects/projects.service.ts`)
**When adding a member via email, also set their `User.tenantId`:**
```typescript
if (!userTenant) {
  // Add user to tenant with member role
  await this.prisma.tx.userTenant.create({
    data: {
      userId: targetUserId,
      tenantId,
      role: 'member',
      invitedBy: userId,
    },
  });
  
  // CRITICAL: Also set the user's tenantId
  // This ensures the user can log in and their JWT token has the correct tenantId
  await this.prisma.tx.user.update({
    where: { id: targetUserId },
    data: {
      tenantId: tenantId,
    },
  });
}
```

### 2. Query Across All User's Tenants (`src/api/projects/projects.service.ts`)
**Modified the projects list query to check ALL tenants the user belongs to:**
```typescript
// Get all tenants the user belongs to (via UserTenant or legacy tenantId)
const userTenants = await this.prisma.tx.userTenant.findMany({
  where: { userId },
  select: { tenantId: true },
});
const userTenantIds = userTenants.length > 0 
  ? userTenants.map(ut => ut.tenantId)
  : [tenantId]; // Fallback to JWT tenantId

// Also check legacy tenantId on User table
const user = await this.prisma.tx.user.findUnique({
  where: { id: userId },
  select: { tenantId: true },
});
if (user?.tenantId && !userTenantIds.includes(user.tenantId)) {
  userTenantIds.push(user.tenantId);
}

// Ensure JWT tenantId is included
if (!userTenantIds.includes(tenantId)) {
  userTenantIds.push(tenantId);
}

// Query projects across ALL user's tenants
const memberProjects = await this.prisma.tx.projectMember.findMany({
  where: { 
    tenantId: { in: userTenantIds }, // Query across all user's tenants
    userId,
  },
  select: { projectId: true, tenantId: true },
});

// Project query also uses all user's tenants
const where: any = {
  tenantId: { in: userTenantIds }, // Query projects from ALL user's tenants
  OR: whereConditions,
  deletedAt: null,
};
```

## How It Works Now

1. **When a member is added:**
   - `ProjectMember` record created with project's `tenantId` ✅
   - `UserTenant` record created ✅
   - `User.tenantId` is set (so login works) ✅

2. **When member logs in:**
   - Login uses `User.tenantId` for JWT token ✅
   - JWT token now has correct `tenantId` ✅

3. **When member queries projects:**
   - System finds ALL tenants user belongs to (via `UserTenant` + `User.tenantId`) ✅
   - Queries `ProjectMember` across ALL those tenants ✅
   - Finds projects even if JWT `tenantId` doesn't match initially ✅
   - Member sees the project ✅

## Benefits

1. **Handles tenant mismatches**: Works even if JWT tenantId doesn't match project tenantId
2. **Multi-tenant support**: Users can see projects from all tenants they belong to
3. **Backward compatible**: Still works with legacy `User.tenantId` field
4. **Robust**: Multiple fallbacks ensure projects are found

## Testing

To verify the fix:

1. **As Project Owner:**
   - Add a member to a project (by email or userId)
   - Verify member appears in members list

2. **As Newly Added Member:**
   - Log in with the added member's account
   - Go to Projects page
   - **Expected**: Project should appear in the list immediately
   - Check browser console for debug logs showing tenant IDs

3. **Debug Logs:**
   - Look for `[PROJECT DEBUG] User belongs to tenants:` in backend logs
   - Should show all tenant IDs the user belongs to
   - Should include the project's tenant ID

## Files Modified

1. `src/api/projects/projects.service.ts`
   - `addMember()`: Sets `User.tenantId` when adding member via email
   - `list()`: Queries across all user's tenants instead of just JWT tenantId

## Additional Notes

- This fix handles both single-tenant and multi-tenant scenarios
- Users can belong to multiple tenants via `UserTenant` table
- Projects are queried across all user's tenants for maximum visibility
- The JWT tenantId is still used as the primary tenant, but not exclusively

---

**Status**: ✅ **FIXED**  
**Date**: December 9, 2025  
**Version**: 2.0





