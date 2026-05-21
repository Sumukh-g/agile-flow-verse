import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api/projects';
import { toast } from 'sonner';

/**
 * Hook to fetch project members
 * Always returns a valid object structure to prevent React Query undefined errors
 * 
 * @param projectId - The project ID to fetch members for
 * @returns Query result with members array
 */
export function useProjectMembers(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      if (!projectId) {
        return { members: [] };
      }
      try {
        const result = await projectsApi.getProjectMembers(projectId);
        // Ensure we always return a valid object structure
        if (result && typeof result === 'object') {
          return {
            members: Array.isArray(result.members) ? result.members : (Array.isArray(result) ? result : []),
          };
        }
        return { members: [] };
      } catch (error) {
        // Return empty structure on error to prevent undefined
        console.error('Failed to fetch project members:', error);
        return { members: [] };
      }
    },
    enabled: !!projectId,
  });
}

/**
 * Hook to add a project member
 * 
 * Invalidates relevant caches to ensure:
 * - The person who added sees updated member list
 * - The newly added member can see the project in their list
 * - All project-related queries are refreshed
 */
export function useAddProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, userId, email, role }: { projectId: string; userId?: string; email?: string; role: string }) => {
      if (email) {
        return projectsApi.addMember(projectId, email, role);
      } else if (userId) {
        return projectsApi.addMember(projectId, userId, role);
      }
      throw new Error('Either userId or email must be provided');
    },
    onSuccess: (_, { projectId }) => {
      try {
        // Invalidate project members list
        queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
        
        // Invalidate specific project data
        queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        
        // CRITICAL: Invalidate the projects LIST query so newly added members can see the project
        // This invalidates all project list queries (for all users)
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        
        // Invalidate tenant users (in case user was created)
        // Use refetchType: 'active' to only refetch active queries and prevent undefined errors
        queryClient.invalidateQueries({ 
          queryKey: ['tenant-users'],
          refetchType: 'active' // Only refetch active queries
        });
        
        // Invalidate dashboard cache (project counts may change)
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        
        toast.success('Member added successfully');
      } catch (error) {
        console.error('Error invalidating queries after adding member:', error);
        // Still show success toast even if invalidation fails
        toast.success('Member added successfully');
      }
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to add member');
    },
  });
}

export function useRemoveProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, userId }: { projectId: string; userId: string }) =>
      projectsApi.removeMember(projectId, userId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      toast.success('Member removed successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to remove member');
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, userId, role }: { projectId: string; userId: string; role: string }) =>
      projectsApi.updateMemberRole(projectId, userId, role),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      toast.success('Role updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to update role');
    },
  });
}

