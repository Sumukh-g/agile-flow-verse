
import { DEFAULT_DASHBOARD, WIDGET_TYPES } from '@/config/dashboardConfig';
import { Dashboard, NewDashboardData, NewWidgetData, Widget } from '@/types/dashboard';
import { useState } from 'react';
import { toast } from 'sonner';

// Minimal DropResult type to avoid hard dependency on react-beautiful-dnd in React 19
type DropResult = {
  source: { index: number };
  destination: { index: number } | null;
};

export const useDashboardManager = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([DEFAULT_DASHBOARD]);
  const [activeDashboardId, setActiveDashboardId] = useState<string>(DEFAULT_DASHBOARD.id);
  const [editMode, setEditMode] = useState(false);

  const currentDashboard = dashboards.find(d => d.id === activeDashboardId) || DEFAULT_DASHBOARD;

  const handleCreateDashboard = (data: NewDashboardData) => {
    const newDashboard: Dashboard = {
      id: `dashboard-${Date.now()}`,
      name: data.name || 'New Dashboard',
      description: data.description || 'Custom dashboard',
      widgets: []
    };
    
    setDashboards(prev => [...prev, newDashboard]);
    setActiveDashboardId(newDashboard.id);
    toast.success(`Dashboard "${newDashboard.name}" created`);
  };

  const handleDeleteDashboard = (id: string) => {
    if (dashboards.length <= 1) {
      toast.error("Cannot delete the only dashboard");
      return;
    }
    
    const updatedDashboards = dashboards.filter(d => d.id !== id);
    setDashboards(updatedDashboards);
    setActiveDashboardId(updatedDashboards[0].id);
    toast.success("Dashboard deleted");
  };

  const handleAddWidget = (data: NewWidgetData) => {
    if (!data.type || !data.title) {
      toast.error("Widget type and title are required");
      return;
    }

    const widgetTypeInfo = WIDGET_TYPES.find(w => w.type === data.type);
    if (!widgetTypeInfo) {
        toast.error("Invalid widget type selected.");
        return;
    }

    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: data.type,
      title: data.title,
      width: data.width,
      height: data.height,
      data: {}
    };

    setDashboards(prevDashboards => 
      prevDashboards.map(dash => {
        if (dash.id === activeDashboardId) {
          return {
            ...dash,
            widgets: [...dash.widgets, newWidget]
          };
        }
        return dash;
      })
    );
    toast.success(`Widget "${newWidget.title}" added to dashboard`);
  };

  const handleDeleteWidget = (widgetId: string) => {
    setDashboards(prevDashboards => 
      prevDashboards.map(dash => {
        if (dash.id === activeDashboardId) {
          return {
            ...dash,
            widgets: dash.widgets.filter(w => w.id !== widgetId)
          };
        }
        return dash;
      })
    );
    toast.success("Widget removed");
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    setDashboards(prevDashboards =>
      prevDashboards.map(dash => {
        if (dash.id === activeDashboardId) {
          const updatedWidgets = [...dash.widgets];
          const [removed] = updatedWidgets.splice(sourceIndex, 1);
          updatedWidgets.splice(destinationIndex, 0, removed);
          return { ...dash, widgets: updatedWidgets };
        }
        return dash;
      })
    );
  };

  return {
    dashboards,
    activeDashboardId,
    setActiveDashboardId,
    editMode,
    setEditMode,
    currentDashboard,
    handleCreateDashboard,
    handleDeleteDashboard,
    handleAddWidget,
    handleDeleteWidget,
    handleDragEnd,
  };
};

