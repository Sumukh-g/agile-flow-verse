
import React from 'react';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Plus } from 'lucide-react';
import AddWidgetDialog from './dialogs/AddWidgetDialog';
import { NewWidgetData } from '@/types/dashboard';

interface EmptyDashboardStateProps {
  onAddWidget: (data: NewWidgetData) => void;
  editMode: boolean;
}

const EmptyDashboardState: React.FC<EmptyDashboardStateProps> = ({ onAddWidget, editMode }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/20">
      <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">No Widgets Added</h3>
      <p className="text-muted-foreground text-center mb-4">
        This dashboard is empty. Add widgets to customize your view.
      </p>
      {editMode && (
        <AddWidgetDialog 
          onAddWidget={onAddWidget} 
          triggerText="Add First Widget"
          triggerIcon={<Plus className="h-4 w-4 mr-2" />}
        />
      )}
    </div>
  );
};

export default EmptyDashboardState;
