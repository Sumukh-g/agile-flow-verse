import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

/**
 * Hook to fetch all tenant users
 * Returns users with their roles and status
 * 
 * @returns Query result with users array
 */
export function useTenantUsers() {
  return useQuery({
    queryKey: ['tenant-users'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/users');
        // Ensure we always return a valid object structure
        // API might return array directly or { users: [...] }
        if (Array.isArray(response.data)) {
          return { users: response.data };
        }
        return response.data || { users: [] };
      } catch (error) {
        // Return empty structure on error to prevent undefined
        console.error('Failed to fetch tenant users:', error);
        return { users: [] };
      }
    },
    staleTime: 30000, // Cache for 30 seconds
  });
}

/**
 * Hook to fetch detailed user information
 * Includes project and task counts
 * 
 * @param userId - The user ID to fetch details for
 * @returns Query result with user details
 */
export function useUserDetails(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-details', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await apiClient.get(`/users/${userId}`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 60000, // Cache for 1 minute
  });
}

/**
 * Hook to update user information
 * 
 * @returns Mutation function to update user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: { name?: string; email?: string } }) => {
      const response = await apiClient.put(`/users/${userId}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate user queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-details', variables.userId] });
      toast.success('User updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update user');
    },
  });
}

/**
 * Hook to reset user password
 * 
 * @returns Mutation function to reset password
 */
export function useResetUserPassword() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.put(`/users/${userId}/reset-password`);
      return response.data;
    },
    onSuccess: (data) => {
      // In production, don't show the temp password - send via email instead
      toast.success(`Password reset successfully. Temporary password: ${data.tempPassword}`, {
        duration: 10000,
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to reset password');
    },
  });
}

/**
 * Hook to fetch workspace statistics
 * Returns counts of users, projects, tasks, and usage metrics
 * 
 * @returns Query result with workspace statistics
 */
export function useWorkspaceStats() {
  return useQuery({
    queryKey: ['workspace-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/users/admin/stats');
      return response.data;
    },
    staleTime: 60000, // Cache for 1 minute
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

