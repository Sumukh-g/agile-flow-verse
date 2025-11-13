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
  recentActivity: any[];
  notifications: any[];
  timestamp: string;
}

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.get<DashboardData>('/dashboard'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};





