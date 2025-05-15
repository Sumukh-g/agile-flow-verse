
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { WIDGET_TYPES, DEFAULT_WIDGET_DATA } from '@/config/dashboardConfig';
import { NewWidgetData } from '@/types/dashboard';

interface AddWidgetDialogProps {
  onAddWidget: (data: NewWidgetData) => void;
  triggerText?: string;
  triggerIcon?: React.ReactNode;
}

const AddWidgetDialog: React.FC<AddWidgetDialogProps> = ({ 
  onAddWidget, 
  triggerText = "Add Widget",
  triggerIcon = <Plus className="h-4 w-4 mr-2" />
}) => {
  const [newWidgetData, setNewWidgetData] = useState<NewWidgetData>({
    type: '',
    title: '',
    width: DEFAULT_WIDGET_DATA.width,
    height: DEFAULT_WIDGET_DATA.height,
  });
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    onAddWidget(newWidgetData);
    setNewWidgetData({ type: '', title: '', width: DEFAULT_WIDGET_DATA.width, height: DEFAULT_WIDGET_DATA.height });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          {triggerIcon}
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Widget</DialogTitle>
          <DialogDescription>
            Select a widget type to add to your dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="widget-type">Widget Type</Label>
            <select
              id="widget-type"
              value={newWidgetData.type}
              onChange={(e) => setNewWidgetData({ ...newWidgetData, type: e.target.value })}
              className="bg-background border border-input rounded-md p-2 text-sm w-full"
            >
              <option value="">Select widget type</option>
              {WIDGET_TYPES.map((widgetType) => (
                <option key={widgetType.id} value={widgetType.type}>{widgetType.title}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="widget-title">Title</Label>
            <Input
              id="widget-title"
              value={newWidgetData.title}
              onChange={(e) => setNewWidgetData({ ...newWidgetData, title: e.target.value })}
              placeholder="Widget title"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="widget-width">Width</Label>
              <select
                id="widget-width"
                value={newWidgetData.width}
                onChange={(e) => setNewWidgetData({ ...newWidgetData, width: Number(e.target.value) as NewWidgetData['width'] })}
                className="bg-background border border-input rounded-md p-2 text-sm w-full"
              >
                <option value="1">Small (1/4)</option>
                <option value="2">Medium (2/4)</option>
                <option value="3">Large (3/4)</option>
                <option value="4">Full Width (4/4)</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="widget-height">Height</Label>
              <select
                id="widget-height"
                value={newWidgetData.height}
                onChange={(e) => setNewWidgetData({ ...newWidgetData, height: Number(e.target.value) as NewWidgetData['height'] })}
                className="bg-background border border-input rounded-md p-2 text-sm w-full"
              >
                <option value="1">Normal</option>
                <option value="2">Double</option>
              </select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Add Widget</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddWidgetDialog;
