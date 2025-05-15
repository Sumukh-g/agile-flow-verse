
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash, Plus } from 'lucide-react';
import CreateDashboardDialog from './dialogs/CreateDashboardDialog';
import AddWidgetDialog from './dialogs/AddWidgetDialog';
import { Dashboard, NewDashboardData, NewWidgetData } from '@/types/dashboard';

interface DashboardHeaderProps {
  dashboards: Dashboard[];
  activeDashboardId: string;
  onDashboardChange: (id: string) => void;
  onDeleteDashboard: (id: string) => void;
  onCreateDashboard: (data: NewDashboardData) => void;
  editMode: boolean;
  onToggleEditMode: () => void;
  onAddWidget: (data: NewWidgetData) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  dashboards,
  activeDashboardId,
  onDashboardChange,
  onDeleteDashboard,
  onCreateDashboard,
  editMode,
  onToggleEditMode,
  onAddWidget,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Label htmlFor="dashboard-select">Dashboard:</Label>
        <select
          id="dashboard-select"
          value={activeDashboardId}
          onChange={(e) => onDashboardChange(e.target.value)}
          className="bg-background border border-input rounded-md p-2 text-sm"
        >
          {dashboards.map((dash) => (
            <option key={dash.id} value={dash.id}>{dash.name}</option>
          ))}
        </select>
        {dashboards.length > 1 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onDeleteDashboard(activeDashboardId)}
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <CreateDashboardDialog onCreateDashboard={onCreateDashboard} />
        
        <Button 
          variant={editMode ? "default" : "outline"}
          onClick={onToggleEditMode}
        >
          {editMode ? "Done" : "Edit Layout"}
        </Button>
        
        {editMode && (
          <AddWidgetDialog onAddWidget={onAddWidget} />
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
