import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';

export interface DashboardData {
  recentTasks: any[];
  upcomingTasks: any[];
  projectStats: {
    total: number;
    active: number;
    completed: number;
    onHold: number;
  };
  taskStats: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    overdue: number;
  };
  crmStats: {
    totalProjects: number;
    totalClients: number;
    totalDeals: number;
    activeProjects: number;
  };
  analytics: {
    tasksCreatedLast7Days: number;
    tasksCreatedLast30Days: number;
    projectsCreatedLast30Days: number;
    completionRate: number;
  };
  recentActivity: any[];
  notifications: any[];
  timestamp: string;
}

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await apiClient.get<DashboardData>('/dashboard');
      // apiClient.get already returns response.data, so response is already the data
      return response as DashboardData;
    },
    staleTime: 0, // Always fetch fresh data to ensure accuracy
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 2,
  });
};





