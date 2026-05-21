/**
 * Widget Renderer Component
 * 
 * Renders the appropriate widget component based on widget type.
 * Acts as a factory pattern for widget instantiation.
 * 
 * Features:
 * - Dynamic widget rendering based on type
 * - Lazy loading support for large widgets
 * - Fallback for unknown widget types
 * - Performance optimized with React.memo
 * 
 * @component
 */

import React from 'react';
import { Widget } from '@/types/dashboard';

// Core widgets
import TaskMetricsWidget from './widgets/TaskMetricsWidget';
import ProjectProgressWidget from './widgets/ProjectProgressWidget';
import TimeTrackingWidget from './widgets/TimeTrackingWidget';
import QuickActionsWidget from './widgets/QuickActionsWidget';
import RecentActivityWidget from './widgets/RecentActivityWidget';

// Analytics widgets
import BurndownChartWidget from './widgets/BurndownChartWidget';
import VelocityChartWidget from './widgets/VelocityChartWidget';
import CumulativeFlowWidget from './widgets/CumulativeFlowWidget';
import TeamWorkloadWidget from './widgets/TeamWorkloadWidget';

interface WidgetRendererProps {
  widget: Widget;
}

/**
 * WidgetRenderer Component
 * 
 * Maps widget type to the corresponding component.
 * Wrapped in React.memo for performance optimization.
 */
const WidgetRenderer: React.FC<WidgetRendererProps> = React.memo(({ widget }) => {
  switch (widget.type) {
    // Core Widgets
    case 'taskMetrics':
      return <TaskMetricsWidget widget={widget} />;
    case 'projectProgress':
      return <ProjectProgressWidget widget={widget} />;
    case 'timeTracking':
      return <TimeTrackingWidget widget={widget} />;
    case 'quickActions':
      return <QuickActionsWidget widget={widget} />;
    case 'recentActivity':
      return <RecentActivityWidget widget={widget} />;
    
    // Analytics Widgets - New
    case 'burndownChart':
      return <BurndownChartWidget widget={widget} />;
    case 'velocityChart':
      return <VelocityChartWidget widget={widget} />;
    case 'cumulativeFlow':
      return <CumulativeFlowWidget widget={widget} />;
    case 'teamWorkload':
      return <TeamWorkloadWidget widget={widget} />;
    
    // Fallback for unknown types
    default:
      return (
        <div className="p-4 text-center text-muted-foreground">
          <p className="text-sm">Unknown widget type: {widget.type}</p>
          <p className="text-xs mt-1">Please check your widget configuration.</p>
        </div>
      );
  }
});

// Display name for debugging
WidgetRenderer.displayName = 'WidgetRenderer';

export default WidgetRenderer;
