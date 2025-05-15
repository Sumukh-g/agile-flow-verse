
import React from 'react';
import { useDashboardManager } from '@/hooks/useDashboardManager';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import WidgetGrid from '@/components/dashboard/WidgetGrid';
import EmptyDashboardState from '@/components/dashboard/EmptyDashboardState';

const CustomDashboard = () => {
  const {
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
  } = useDashboardManager();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Custom Dashboard</h1>
        <p className="text-muted-foreground">
          Customize your dashboard with the widgets that matter most to you.
        </p>
      </div>
      
      <DashboardHeader
        dashboards={dashboards}
        activeDashboardId={activeDashboardId}
        onDashboardChange={setActiveDashboardId}
        onDeleteDashboard={handleDeleteDashboard}
        onCreateDashboard={handleCreateDashboard}
        editMode={editMode}
        onToggleEditMode={() => setEditMode(!editMode)}
        onAddWidget={handleAddWidget}
      />
      
      {currentDashboard.description && (
        <div className="text-sm text-muted-foreground">
          {currentDashboard.description}
        </div>
      )}
      
      {currentDashboard.widgets.length === 0 ? (
        <EmptyDashboardState onAddWidget={handleAddWidget} editMode={editMode} />
      ) : (
        <WidgetGrid
          widgets={currentDashboard.widgets}
          editMode={editMode}
          onDragEnd={handleDragEnd}
          onDeleteWidget={handleDeleteWidget}
        />
      )}
    </div>
  );
};

export default CustomDashboard;
