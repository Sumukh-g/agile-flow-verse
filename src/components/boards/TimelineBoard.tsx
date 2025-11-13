import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Calendar,
    Clock,
    Plus,
    RotateCcw,
    Tag,
    Trash2,
    User,
    ZoomIn,
    ZoomOut
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'in-progress' | 'completed' | 'delayed';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  tags: string[];
  dependencies?: string[];
}

const TimelineBoard: React.FC = () => {
  const [items, setItems] = useState<TimelineItem[]>([
    {
      id: '1',
      title: 'Project Kickoff',
      description: 'Initial project planning and team setup',
      startDate: '2024-01-01',
      endDate: '2024-01-05',
      status: 'completed',
      priority: 'high',
      assignee: 'John Doe',
      tags: ['planning', 'setup']
    },
    {
      id: '2',
      title: 'Research Phase',
      description: 'Market research and competitor analysis',
      startDate: '2024-01-06',
      endDate: '2024-01-20',
      status: 'in-progress',
      priority: 'high',
      assignee: 'Jane Smith',
      tags: ['research', 'analysis']
    },
    {
      id: '3',
      title: 'Design Phase',
      description: 'UI/UX design and wireframing',
      startDate: '2024-01-21',
      endDate: '2024-02-10',
      status: 'planned',
      priority: 'medium',
      assignee: 'Mike Johnson',
      tags: ['design', 'wireframes'],
      dependencies: ['2']
    },
    {
      id: '4',
      title: 'Development Phase',
      description: 'Frontend and backend development',
      startDate: '2024-02-11',
      endDate: '2024-03-15',
      status: 'planned',
      priority: 'high',
      assignee: 'Sarah Wilson',
      tags: ['development', 'coding'],
      dependencies: ['3']
    },
    {
      id: '5',
      title: 'Testing Phase',
      description: 'Quality assurance and testing',
      startDate: '2024-03-16',
      endDate: '2024-03-30',
      status: 'planned',
      priority: 'medium',
      assignee: 'Alex Brown',
      tags: ['testing', 'qa'],
      dependencies: ['4']
    }
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'planned' as TimelineItem['status'],
    priority: 'medium' as TimelineItem['priority'],
    assignee: '',
    tags: '',
    dependencies: ''
  });
  const [zoom, setZoom] = useState(100);
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleCreateItem = () => {
    if (newItem.title.trim() && newItem.startDate && newItem.endDate) {
      const item: TimelineItem = {
        id: Date.now().toString(),
        title: newItem.title,
        description: newItem.description,
        startDate: newItem.startDate,
        endDate: newItem.endDate,
        status: newItem.status,
        priority: newItem.priority,
        assignee: newItem.assignee,
        tags: newItem.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        dependencies: newItem.dependencies.split(',').map(dep => dep.trim()).filter(dep => dep)
      };
      setItems(prev => [...prev, item]);
      setNewItem({ title: '', description: '', startDate: '', endDate: '', status: 'planned', priority: 'medium', assignee: '', tags: '', dependencies: '' });
      setShowCreateForm(false);
      toast.success('Timeline item created successfully');
    }
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    toast.success('Timeline item deleted');
  };

  const handleUpdateStatus = (id: string, status: TimelineItem['status']) => {
    setItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, status }
          : item
      )
    );
    toast.success('Status updated');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'planned': return 'bg-gray-100 text-gray-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const sortedItems = [...items].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Timeline View</h3>
          <p className="text-sm text-muted-foreground">
            Visualize your project timeline and dependencies
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(zoom - 25, 25))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{zoom}%</span>
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(zoom + 25, 200))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom(100)}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300"></div>
        <div className="space-y-8 pl-8">
          {sortedItems.map((item, index) => (
            <div key={item.id} className="relative">
              <div className="absolute -left-8 top-4 w-4 h-4 bg-white border-2 border-gray-300 rounded-full"></div>
              <Card className={`${getStatusColor(item.status).includes('green') ? 'border-green-200 bg-green-50' : 
                              getStatusColor(item.status).includes('blue') ? 'border-blue-200 bg-blue-50' : 
                              getStatusColor(item.status).includes('red') ? 'border-red-200 bg-red-50' : 
                              'border-gray-200'}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CardTitle className="text-sm">{item.title}</CardTitle>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select value={item.status} onValueChange={(value: any) => handleUpdateStatus(item.id, value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planned">Planned</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="delayed">Delayed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {item.description && (
                    <CardDescription className="text-xs">
                      {item.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(item.startDate)} - {formatDate(item.endDate)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{getDuration(item.startDate, item.endDate)} days</span>
                    </div>
                    {item.assignee && (
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{item.assignee}</span>
                      </div>
                    )}
                    {item.tags.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Tag className="h-3 w-3" />
                        <div className="flex space-x-1">
                          {item.tags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {item.dependencies && item.dependencies.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium">Dependencies:</span> {item.dependencies.join(', ')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Create Item Form */}
      {showCreateForm && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Create Timeline Item</CardTitle>
            <CardDescription>
              Add a new item to your timeline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="item-title">Title</Label>
                <Input
                  id="item-title"
                  placeholder="Enter item title"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-status">Status</Label>
                <Select value={newItem.status} onValueChange={(value: any) => setNewItem({ ...newItem, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-description">Description</Label>
              <Textarea
                id="item-description"
                placeholder="Enter item description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="item-start-date">Start Date</Label>
                <Input
                  id="item-start-date"
                  type="date"
                  value={newItem.startDate}
                  onChange={(e) => setNewItem({ ...newItem, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-end-date">End Date</Label>
                <Input
                  id="item-end-date"
                  type="date"
                  value={newItem.endDate}
                  onChange={(e) => setNewItem({ ...newItem, endDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-priority">Priority</Label>
                <Select value={newItem.priority} onValueChange={(value: any) => setNewItem({ ...newItem, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="item-assignee">Assignee</Label>
                <Input
                  id="item-assignee"
                  placeholder="Enter assignee name"
                  value={newItem.assignee}
                  onChange={(e) => setNewItem({ ...newItem, assignee: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-tags">Tags (comma-separated)</Label>
                <Input
                  id="item-tags"
                  placeholder="e.g. design, frontend, bug"
                  value={newItem.tags}
                  onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-dependencies">Dependencies (comma-separated item IDs)</Label>
              <Input
                id="item-dependencies"
                placeholder="e.g. 1, 2, 3"
                value={newItem.dependencies}
                onChange={(e) => setNewItem({ ...newItem, dependencies: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={handleCreateItem} disabled={!newItem.title.trim() || !newItem.startDate || !newItem.endDate}>
                Create Item
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TimelineBoard;






