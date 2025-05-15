
import React from 'react';
import { Widget } from '@/types/dashboard';
import TaskMetricsWidget from './widgets/TaskMetricsWidget';
import ProjectProgressWidget from './widgets/ProjectProgressWidget';
import TimeTrackingWidget from './widgets/TimeTrackingWidget';
import QuickActionsWidget from './widgets/QuickActionsWidget';
import RecentActivityWidget from './widgets/RecentActivityWidget';

interface WidgetRendererProps {
  widget: Widget;
}

const WidgetRenderer: React.FC<WidgetRendererProps> = ({ widget }) => {
  switch (widget.type) {
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
    default:
      return <div className="p-4">Unknown widget type: {widget.type}</div>;
  }
};

export default WidgetRenderer;
