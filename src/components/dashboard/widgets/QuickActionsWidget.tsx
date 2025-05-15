
import React from 'react';
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Widget } from '@/types/dashboard';
import { Plus, Clock, LayoutDashboard, BarChart } from 'lucide-react';
import { toast } from 'sonner';

interface QuickActionsWidgetProps {
  widget: Widget;
}

const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({ widget }) => {
  return (
    <>
      <CardHeader>
        <CardTitle>{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="flex flex-col h-auto py-4" onClick={() => toast.info("Creating new task")}>
            <Plus className="h-5 w-5 mb-1" />
            <span className="text-xs">New Task</span>
          </Button>
          <Button variant="outline" className="flex flex-col h-auto py-4" onClick={() => toast.info("Starting timer")}>
            <Clock className="h-5 w-5 mb-1" />
            <span className="text-xs">Start Timer</span>
          </Button>
          <Button variant="outline" className="flex flex-col h-auto py-4" onClick={() => toast.info("Creating new project")}>
            <LayoutDashboard className="h-5 w-5 mb-1" />
            <span className="text-xs">New Project</span>
          </Button>
          <Button variant="outline" className="flex flex-col h-auto py-4" onClick={() => toast.info("Creating report")}>
            <BarChart className="h-5 w-5 mb-1" />
            <span className="text-xs">Generate Report</span>
          </Button>
        </div>
      </CardContent>
    </>
  );
};

export default QuickActionsWidget;
