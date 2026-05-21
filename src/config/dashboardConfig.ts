/**
 * Dashboard Configuration
 * 
 * Defines available widget types, default configurations, and initial dashboard setup.
 * 
 * This file serves as the single source of truth for:
 * - Available widget types
 * - Default widget dimensions
 * - Initial dashboard configuration
 * 
 * @module dashboardConfig
 */

import { 
  BarChart, 
  LineChart, 
  PieChart, 
  Settings, 
  Table, 
  TrendingDown, 
  Zap, 
  Layers, 
  Users 
} from "lucide-react";
import { Dashboard, Widget } from "@/types/dashboard";

/**
 * Available widget types configuration
 * 
 * Each widget type includes:
 * - id: Unique identifier
 * - type: Type key used for rendering
 * - title: Display name
 * - icon: Lucide icon component
 * - category: Widget category for organization
 * - description: Brief description of widget functionality
 */
export const WIDGET_TYPES = [
  // Core Widgets
  { 
    id: 'taskMetrics', 
    type: 'taskMetrics', 
    title: 'Task Metrics', 
    icon: BarChart,
    category: 'core',
    description: 'Overview of task status distribution'
  },
  { 
    id: 'projectProgress', 
    type: 'projectProgress', 
    title: 'Project Progress', 
    icon: PieChart,
    category: 'core',
    description: 'Progress bars for active projects'
  },
  { 
    id: 'timeTracking', 
    type: 'timeTracking', 
    title: 'Time Tracking', 
    icon: LineChart,
    category: 'core',
    description: 'Weekly time tracking chart'
  },
  { 
    id: 'quickActions', 
    type: 'quickActions', 
    title: 'Quick Actions', 
    icon: Settings,
    category: 'core',
    description: 'Shortcuts to common actions'
  },
  { 
    id: 'recentActivity', 
    type: 'recentActivity', 
    title: 'Recent Activity', 
    icon: Table,
    category: 'core',
    description: 'Feed of recent team activities'
  },
  
  // Analytics Widgets - New
  { 
    id: 'burndownChart', 
    type: 'burndownChart', 
    title: 'Sprint Burndown', 
    icon: TrendingDown,
    category: 'analytics',
    description: 'Sprint progress vs ideal burndown'
  },
  { 
    id: 'velocityChart', 
    type: 'velocityChart', 
    title: 'Team Velocity', 
    icon: Zap,
    category: 'analytics',
    description: 'Story points completed per sprint'
  },
  { 
    id: 'cumulativeFlow', 
    type: 'cumulativeFlow', 
    title: 'Cumulative Flow', 
    icon: Layers,
    category: 'analytics',
    description: 'Work distribution across states over time'
  },
  { 
    id: 'teamWorkload', 
    type: 'teamWorkload', 
    title: 'Team Workload', 
    icon: Users,
    category: 'analytics',
    description: 'Workload distribution across team members'
  },
];

/**
 * Default widget dimensions
 * Used when creating new widgets
 */
export const DEFAULT_WIDGET_DATA: Omit<Widget, 'id' | 'type' | 'title' | 'data'> = {
  width: 2,
  height: 1,
};

/**
 * Widget categories for grouping in the add widget dialog
 */
export const WIDGET_CATEGORIES = [
  { id: 'core', label: 'Core Widgets', description: 'Essential dashboard widgets' },
  { id: 'analytics', label: 'Analytics', description: 'Charts and data visualization' },
];

/**
 * Get widgets by category
 */
export const getWidgetsByCategory = (category: string) => {
  return WIDGET_TYPES.filter(w => w.category === category);
};

/**
 * Default dashboard configuration
 * This is the initial state when no saved dashboard exists
 */
export const DEFAULT_DASHBOARD: Dashboard = {
  id: 'default',
  name: 'Main Dashboard',
  description: 'Overview of key metrics and activities',
  widgets: [
    // First Row - Core Metrics
    {
      id: 'widget-1',
      type: 'taskMetrics',
      title: 'Task Status Overview',
      width: 2,
      height: 1,
      data: {
        metrics: [
          { name: 'To Do', value: 12, color: '#94a3b8' },
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
    
    // Second Row - Analytics Charts
    {
      id: 'widget-5',
      type: 'burndownChart',
      title: 'Sprint Burndown',
      width: 2,
      height: 1,
      data: {} // Widget generates its own demo data
    },
    {
      id: 'widget-6',
      type: 'velocityChart',
      title: 'Team Velocity',
      width: 2,
      height: 1,
      data: {} // Widget generates its own demo data
    },
    
    // Third Row - Activity and Workload
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
      id: 'widget-7',
      type: 'teamWorkload',
      title: 'Team Workload',
      width: 2,
      height: 1,
      data: {} // Widget generates its own demo data
    },
    
    // Fourth Row - Time Tracking and Cumulative Flow
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
    },
    {
      id: 'widget-8',
      type: 'cumulativeFlow',
      title: 'Cumulative Flow',
      width: 2,
      height: 1,
      data: {} // Widget generates its own demo data
    }
  ]
};

/**
 * Analytics Dashboard Template
 * A dashboard focused on analytics and metrics
 */
export const ANALYTICS_DASHBOARD: Dashboard = {
  id: 'analytics',
  name: 'Analytics Dashboard',
  description: 'In-depth project and team analytics',
  widgets: [
    {
      id: 'analytics-1',
      type: 'burndownChart',
      title: 'Sprint Burndown',
      width: 2,
      height: 1,
      data: {}
    },
    {
      id: 'analytics-2',
      type: 'velocityChart',
      title: 'Team Velocity',
      width: 2,
      height: 1,
      data: {}
    },
    {
      id: 'analytics-3',
      type: 'cumulativeFlow',
      title: 'Cumulative Flow',
      width: 2,
      height: 1,
      data: {}
    },
    {
      id: 'analytics-4',
      type: 'teamWorkload',
      title: 'Team Workload',
      width: 2,
      height: 1,
      data: {}
    }
  ]
};
