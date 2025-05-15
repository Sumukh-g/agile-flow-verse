
import { BarChart, LineChart, PieChart, Settings, Table } from "lucide-react";
import { Dashboard, Widget } from "@/types/dashboard";

export const WIDGET_TYPES = [
  { id: 'taskMetrics', type: 'taskMetrics', title: 'Task Metrics', icon: BarChart },
  { id: 'projectProgress', type: 'projectProgress', title: 'Project Progress', icon: PieChart },
  { id: 'timeTracking', type: 'timeTracking', title: 'Time Tracking', icon: LineChart },
  { id: 'quickActions', type: 'quickActions', title: 'Quick Actions', icon: Settings },
  { id: 'recentActivity', type: 'recentActivity', title: 'Recent Activity', icon: Table }
];

export const DEFAULT_WIDGET_DATA: Omit<Widget, 'id' | 'type' | 'title' | 'data'> = {
  width: 2,
  height: 1,
};

export const DEFAULT_DASHBOARD: Dashboard = {
  id: 'default',
  name: 'Main Dashboard',
  description: 'Overview of key metrics and activities',
  widgets: [
    {
      id: 'widget-1',
      type: 'taskMetrics',
      title: 'Task Status Overview',
      width: 2,
      height: 1,
      data: {
        metrics: [
          { name: 'To Do', value: 12, color: '#e0e0e0' },
          { name: 'In Progress', value: 8, color: '#3b82f6' },
          { name: 'In Review', value: 5, color: '#8b5cf6' },
          { name: 'Done', value: 18, color: '#22c55e' }
        ]
      }
    },
    {
      id: 'widget-2',
      type: 'projectProgress',
      title: 'Project Progress',
      width: 2,
      height: 1,
      data: {
        projects: [
          { name: 'Website Redesign', progress: 75 },
          { name: 'Mobile App Development', progress: 32 },
          { name: 'Product Launch', progress: 89 },
          { name: 'Marketing Campaign', progress: 54 }
        ]
      }
    },
    {
      id: 'widget-3',
      type: 'recentActivity',
      title: 'Recent Activity',
      width: 2,
      height: 1,
      data: {
        activities: [
          { user: 'John D.', action: 'completed task', target: 'Create wireframes', time: '2 hours ago' },
          { user: 'Alice S.', action: 'commented on', target: 'API Integration', time: '4 hours ago' },
          { user: 'Robert M.', action: 'created task', target: 'QA Testing', time: '1 day ago' },
          { user: 'Jane W.', action: 'updated', target: 'Project Timeline', time: '1 day ago' }
        ]
      }
    },
    {
      id: 'widget-4',
      type: 'timeTracking',
      title: 'Time Tracking',
      width: 2,
      height: 1,
      data: {
        weeklyHours: [
          { day: 'Mon', hours: 6.5 },
          { day: 'Tue', hours: 8.2 },
          { day: 'Wed', hours: 7.0 },
          { day: 'Thu', hours: 7.8 },
          { day: 'Fri', hours: 5.5 },
          { day: 'Sat', hours: 2.0 },
          { day: 'Sun', hours: 0.5 }
        ]
      }
    }
  ]
};

