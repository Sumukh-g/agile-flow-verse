/**
 * Enhanced Projects Hooks with React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, type Project, type CreateProjectDto, type UpdateProjectDto, type ProjectQueryDto } from '@/lib/api';

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: ProjectQueryDto) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  stats: (id: string) => [...projectKeys.detail(id), 'stats'] as const,
};

/**
 * Get all projects
 */
export function useProjects(query?: ProjectQueryDto) {
  return useQuery({
    queryKey: projectKeys.list(query || {}),
    queryFn: async () => {
      const response = await api.projects.getProjects(query);
      // Return the data array, not the full response
      return response.data || [];
    },
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Get a single project
 */
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => api.projects.getProject(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

/**
 * Get project stats
 */
export function useProjectStats(id: string) {
  return useQuery({
    queryKey: projectKeys.stats(id),
    queryFn: () => api.projects.getProjectStats(id),
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Create a new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectDto) => api.projects.createProject(data),
    onSuccess: (newProject) => {
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      
      // Optimistically add to cache
      queryClient.setQueryData<Project>(projectKeys.detail(newProject.id), newProject);
      
      toast.success('Project created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to create project');
    },
  });
}

/**
 * Update a project
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectDto }) =>
      api.projects.updateProject(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) });

      // Snapshot previous value
      const previous = queryClient.getQueryData<Project>(projectKeys.detail(id));

      // Optimistically update
      if (previous) {
        queryClient.setQueryData<Project>(projectKeys.detail(id), {
          ...previous,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previous };
    },
    onSuccess: (updatedProject) => {
      // Update the cache with server response
      queryClient.setQueryData<Project>(projectKeys.detail(updatedProject.id), updatedProject);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      
      toast.success('Project updated successfully');
    },
    onError: (error: any, { id }, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(projectKeys.detail(id), context.previous);
      }
      toast.error(error?.apiError?.message || 'Failed to update project');
    },
    onSettled: (_, __, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
    },
  });
}

/**
 * Delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.projects.deleteProject(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      
      toast.success('Project deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to delete project');
    },
  });
}

/**
 * Add member to project
 */
export function useAddProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, userId, role }: { projectId: string; userId: string; role: string }) =>
      api.projects.addMember(projectId, userId, role),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast.success('Member added successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to add member');
    },
  });
}

/**
 * Remove member from project
 */
export function useRemoveProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, userId }: { projectId: string; userId: string }) =>
      api.projects.removeMember(projectId, userId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast.success('Member removed successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to remove member');
    },
  });
}

