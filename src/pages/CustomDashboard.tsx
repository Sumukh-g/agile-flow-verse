
import React, { useState } from 'react';
import { PlusCircle, Trash, Move, Settings, Save, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface WidgetType {
  id: string;
  name: string;
  description: string;
  component: React.ReactNode;
}

const widgetTypes: WidgetType[] = [
  { 
    id: 'metrics', 
    name: 'Metrics Dashboard', 
    description: 'Display key metrics and project statistics',
    component: (
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-100 p-4 rounded-md">
            <h4 className="font-medium">Tasks</h4>
            <div className="text-2xl font-bold">24</div>
          </div>
          <div className="bg-green-100 p-4 rounded-md">
            <h4 className="font-medium">Completed</h4>
            <div className="text-2xl font-bold">18</div>
          </div>
          <div className="bg-amber-100 p-4 rounded-md">
            <h4 className="font-medium">In Progress</h4>
            <div className="text-2xl font-bold">6</div>
          </div>
          <div className="bg-purple-100 p-4 rounded-md">
            <h4 className="font-medium">Projects</h4>
            <div className="text-2xl font-bold">5</div>
          </div>
        </div>
      </div>
    )
  },
  { 
    id: 'tasks', 
    name: 'Recent Tasks', 
    description: 'Show your most recent tasks',
    component: (
      <div className="p-4">
        <ul className="space-y-2">
          <li className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
            <div>
              <div className="font-medium">Complete project proposal</div>
              <div className="text-xs text-muted-foreground">Due tomorrow</div>
            </div>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">In Progress</span>
          </li>
          <li className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
            <div>
              <div className="font-medium">Review design mockups</div>
              <div className="text-xs text-muted-foreground">Due in 3 days</div>
            </div>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">To Do</span>
          </li>
          <li className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
            <div>
              <div className="font-medium">Client meeting prep</div>
              <div className="text-xs text-muted-foreground">Due today</div>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Completed</span>
          </li>
        </ul>
      </div>
    )
  },
  { 
    id: 'calendar', 
    name: 'Calendar Widget', 
    description: 'Show upcoming events',
    component: (
      <div className="p-4">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">May 2025</h3>
          <div className="flex">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">←</Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 ml-2">→</Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          <div className="text-xs font-medium">Sun</div>
          <div className="text-xs font-medium">Mon</div>
          <div className="text-xs font-medium">Tue</div>
          <div className="text-xs font-medium">Wed</div>
          <div className="text-xs font-medium">Thu</div>
          <div className="text-xs font-medium">Fri</div>
          <div className="text-xs font-medium">Sat</div>
          {Array(31).fill(0).map((_, i) => (
            <div key={i} className={`text-sm p-1 rounded-sm ${i === 13 ? 'bg-blue-100' : ''}`}>{i + 1}</div>
          ))}
        </div>
      </div>
    )
  },
  { 
    id: 'notes', 
    name: 'Notes Widget', 
    description: 'Quick access to your notes',
    component: (
      <div className="p-4">
        <div className="space-y-2">
          <div className="bg-yellow-50 p-3 rounded-md border-l-4 border-yellow-400">
            <h4 className="font-medium">Meeting Notes</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">Discuss product roadmap for Q3 and new feature priorities.</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-md border-l-4 border-yellow-400">
            <h4 className="font-medium">Project Ideas</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">Mobile app redesign concepts and potential improvements.</p>
          </div>
        </div>
      </div>
    )
  },
  { 
    id: 'projects', 
    name: 'Projects Overview', 
    description: 'See all your active projects',
    component: (
      <div className="p-4">
        <ul className="space-y-2">
          <li className="p-2 border-l-4 border-blue-500 bg-gray-50 rounded-sm">
            <div className="font-medium">Website Redesign</div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">65% complete</span>
              <span>7 days left</span>
            </div>
          </li>
          <li className="p-2 border-l-4 border-green-500 bg-gray-50 rounded-sm">
            <div className="font-medium">Marketing Campaign</div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">85% complete</span>
              <span>3 days left</span>
            </div>
          </li>
          <li className="p-2 border-l-4 border-amber-500 bg-gray-50 rounded-sm">
            <div className="font-medium">Mobile App Development</div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">40% complete</span>
              <span>14 days left</span>
            </div>
          </li>
        </ul>
      </div>
    )
  }
];

interface Widget {
  id: string;
  title: string;
  type: string;
  colSpan: number;
  rowSpan: number;
  order: number;
}

const CustomDashboard = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: '1', title: 'My Tasks', type: 'tasks', colSpan: 1, rowSpan: 1, order: 0 },
    { id: '2', title: 'Project Metrics', type: 'metrics', colSpan: 2, rowSpan: 1, order: 1 }
  ]);
  const [addWidgetDialogOpen, setAddWidgetDialogOpen] = useState(false);
  const [editWidgetDialogOpen, setEditWidgetDialogOpen] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [newWidgetType, setNewWidgetType] = useState('');
  const [newWidgetTitle, setNewWidgetTitle] = useState('');
  const [newWidgetSize, setNewWidgetSize] = useState('1x1');
  
  const handleAddWidget = () => {
    if (!newWidgetType || !newWidgetTitle) {
      toast.error("Widget type and title are required");
      return;
    }
    
    const [colSpan, rowSpan] = newWidgetSize.split('x').map(Number);
    
    const newWidget: Widget = {
      id: Date.now().toString(),
      title: newWidgetTitle,
      type: newWidgetType,
      colSpan,
      rowSpan,
      order: widgets.length
    };
    
    setWidgets(prev => [...prev, newWidget]);
    setAddWidgetDialogOpen(false);
    setNewWidgetType('');
    setNewWidgetTitle('');
    setNewWidgetSize('1x1');
    toast.success("Widget added successfully");
  };

  const handleUpdateWidget = () => {
    if (!selectedWidget || !selectedWidget.title) {
      toast.error("Widget title is required");
      return;
    }
    
    const [colSpan, rowSpan] = newWidgetSize.split('x').map(Number);
    
    setWidgets(prev => prev.map(widget => 
      widget.id === selectedWidget.id 
        ? { ...selectedWidget, colSpan, rowSpan } 
        : widget
    ));
    
    setEditWidgetDialogOpen(false);
    setSelectedWidget(null);
    setNewWidgetSize('1x1');
    toast.success("Widget updated successfully");
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== id));
    toast.success("Widget removed");
  };

  const handleEditWidget = (widget: Widget) => {
    setSelectedWidget(widget);
    setNewWidgetSize(`${widget.colSpan}x${widget.rowSpan}`);
    setEditWidgetDialogOpen(true);
  };

  const handleWidgetTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedWidget) {
      setSelectedWidget({ ...selectedWidget, title: e.target.value });
    } else {
      setNewWidgetTitle(e.target.value);
    }
  };

  const handleSaveLayout = () => {
    setIsEditing(false);
    toast.success("Dashboard layout saved");
  };

  const getWidgetComponent = (type: string) => {
    return widgetTypes.find(widget => widget.id === type)?.component || <div>Widget not found</div>;
  };

  const openAddWidgetDialog = () => {
    setNewWidgetType('');
    setNewWidgetTitle('');
    setNewWidgetSize('1x1');
    setAddWidgetDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">My Custom Dashboard</h1>
        <p className="text-muted-foreground">
          Customize your dashboard with widgets that matter to you
        </p>
      </div>
      
      <div className="flex items-center gap-2 justify-between">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? <Save className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
          {isEditing ? "Save Layout" : "Edit Layout"}
        </Button>
        
        <div className="flex items-center gap-2">
          {isEditing && (
            <Button onClick={openAddWidgetDialog}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Widget
            </Button>
          )}
          
          {isEditing && (
            <Button variant="outline" onClick={handleSaveLayout}>
              <Save className="h-4 w-4 mr-2" />
              Save Dashboard
            </Button>
          )}
        </div>
      </div>
      
      {widgets.length === 0 ? (
        <Card className="p-12 text-center">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold mb-2">Your dashboard is empty</div>
            <p className="text-muted-foreground mb-6">Add widgets to customize your dashboard</p>
            <Button onClick={openAddWidgetDialog}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add First Widget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map(widget => (
            <Card 
              key={widget.id}
              className={`${widget.colSpan > 1 ? `col-span-1 md:col-span-${widget.colSpan}` : ''} 
                         ${widget.rowSpan > 1 ? `row-span-${widget.rowSpan}` : ''} 
                         ${isEditing ? 'border-2 border-dashed border-blue-400' : ''}`}
            >
              <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                <CardTitle className="text-lg font-medium">{widget.title}</CardTitle>
                {isEditing && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditWidget(widget)}>
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleRemoveWidget(widget.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Move className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {getWidgetComponent(widget.type)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Add Widget Dialog */}
      <Dialog open={addWidgetDialogOpen} onOpenChange={setAddWidgetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Widget</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Widget Type</label>
              <Select value={newWidgetType} onValueChange={setNewWidgetType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select widget type" />
                </SelectTrigger>
                <SelectContent>
                  {widgetTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newWidgetType && (
                <p className="text-xs text-muted-foreground">
                  {widgetTypes.find(w => w.id === newWidgetType)?.description}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Widget Title</label>
              <Input 
                value={newWidgetTitle} 
                onChange={handleWidgetTitleChange} 
                placeholder="Enter widget title"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Widget Size</label>
              <Select value={newWidgetSize} onValueChange={setNewWidgetSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1x1">Small (1×1)</SelectItem>
                  <SelectItem value="2x1">Medium (2×1)</SelectItem>
                  <SelectItem value="3x1">Large (3×1)</SelectItem>
                  <SelectItem value="2x2">Large Square (2×2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddWidgetDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWidget}>
              Add Widget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Widget Dialog */}
      <Dialog open={editWidgetDialogOpen} onOpenChange={setEditWidgetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Widget</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Widget Type</label>
              <p className="px-3 py-2 border rounded-md bg-muted/20">
                {selectedWidget && widgetTypes.find(w => w.id === selectedWidget.type)?.name}
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Widget Title</label>
              <Input 
                value={selectedWidget?.title || ''} 
                onChange={handleWidgetTitleChange} 
                placeholder="Enter widget title"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Widget Size</label>
              <Select value={newWidgetSize} onValueChange={setNewWidgetSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1x1">Small (1×1)</SelectItem>
                  <SelectItem value="2x1">Medium (2×1)</SelectItem>
                  <SelectItem value="3x1">Large (3×1)</SelectItem>
                  <SelectItem value="2x2">Large Square (2×2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditWidgetDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateWidget}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomDashboard;
