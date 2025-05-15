
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { NewDashboardData } from '@/types/dashboard';

interface CreateDashboardDialogProps {
  onCreateDashboard: (data: NewDashboardData) => void;
}

const CreateDashboardDialog: React.FC<CreateDashboardDialogProps> = ({ onCreateDashboard }) => {
  const [newDashboardData, setNewDashboardData] = useState<NewDashboardData>({ name: '', description: '' });
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    onCreateDashboard(newDashboardData);
    setNewDashboardData({ name: '', description: '' });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Dashboard</DialogTitle>
          <DialogDescription>
            Create a new custom dashboard to organize your widgets.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="dashboard-name">Name</Label>
            <Input
              id="dashboard-name"
              value={newDashboardData.name}
              onChange={(e) => setNewDashboardData({ ...newDashboardData, name: e.target.value })}
              placeholder="My Dashboard"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dashboard-description">Description</Label>
            <Input
              id="dashboard-description"
              value={newDashboardData.description}
              onChange={(e) => setNewDashboardData({ ...newDashboardData, description: e.target.value })}
              placeholder="Dashboard description..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Create Dashboard</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDashboardDialog;
