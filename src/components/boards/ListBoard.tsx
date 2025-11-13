import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    Circle,
    Clock,
    MoreHorizontal,
    Plus,
    Search,
    SortAsc,
    SortDesc,
    Tag,
    User
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface ListItem {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completed: boolean;
}

const ListBoard: React.FC = () => {
  const [items, setItems] = useState<ListItem[]>([
    {
      id: '1',
      title: 'Research competitor analysis',
      description: 'Analyze top 5 competitors in the market and identify key differentiators',
      status: 'todo',
      priority: 'high',
      assignee: 'John Doe',
      dueDate: '2024-01-20',
      tags: ['research', 'analysis'],
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15',
      completed: false
    },
    {
      id: '2',
      title: 'Create user personas',
      description: 'Define target user groups and their needs based on research',
      status: 'in-progress',
      priority: 'medium',
      assignee: 'Jane Smith',
      dueDate: '2024-01-22',
      tags: ['ux', 'research'],
      createdAt: '2024-01-16',
      updatedAt: '2024-01-17',
      completed: false
    },
    {
      id: '3',
      title: 'Design wireframes',
      description: 'Create low-fidelity wireframes for main pages',
      status: 'review',
      priority: 'high',
      assignee: 'Mike Johnson',
      dueDate: '2024-01-25',
      tags: ['design', 'wireframes'],
      createdAt: '2024-01-14',
      updatedAt: '2024-01-18',
      completed: false
    },
    {
      id: '4',
      title: 'User testing plan',
      description: 'Plan and schedule user testing sessions',
      status: 'done',
      priority: 'medium',
      assignee: 'Sarah Wilson',
      dueDate: '2024-01-28',
      tags: ['testing', 'planning'],
      createdAt: '2024-01-12',
      updatedAt: '2024-01-19',
      completed: true
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    status: 'todo' as ListItem['status'],
    priority: 'medium' as ListItem['priority'],
    assignee: '',
    dueDate: '',
    tags: ''
  });

  const handleCreateItem = () => {
    if (newItem.title.trim()) {
      const item: ListItem = {
        id: Date.now().toString(),
        title: newItem.title,
        description: newItem.description,
        status: newItem.status,
        priority: newItem.priority,
        assignee: newItem.assignee,
        dueDate: newItem.dueDate,
        tags: newItem.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        completed: false
      };
      setItems(prev => [...prev, item]);
      setNewItem({ title: '', description: '', status: 'todo', priority: 'medium', assignee: '', dueDate: '', tags: '' });
      setShowCreateForm(false);
      toast.success('Item created successfully');
    }
  };

  const handleToggleComplete = (id: string) => {
    setItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, completed: !item.completed, status: !item.completed ? 'done' : 'todo' }
          : item
      )
    );
    toast.success('Item status updated');
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    toast.success('Item deleted');
  };

  const handleUpdateStatus = (id: string, status: ListItem['status']) => {
    setItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, status, updatedAt: new Date().toISOString().split('T')[0] }
          : item
      )
    );
    toast.success('Status updated');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return <Circle className="h-4 w-4 text-gray-400" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'review': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'done': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
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

  const filteredItems = items
    .filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof ListItem];
      const bValue = b[sortBy as keyof ListItem];
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">List View</h3>
          <p className="text-sm text-muted-foreground">
            Manage your tasks in a structured list format
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="updatedAt">Updated</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <div className="space-y-2">
        {filteredItems.map((item) => (
          <Card key={item.id} className={`${item.completed ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => handleToggleComplete(item.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(item.status)}
                      <h4 className={`font-medium ${item.completed ? 'line-through' : ''}`}>
                        {item.title}
                      </h4>
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
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-3 text-xs text-muted-foreground">
                    {item.assignee && (
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{item.assignee}</span>
                      </div>
                    )}
                    {item.dueDate && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{item.dueDate}</span>
                      </div>
                    )}
                    {item.tags.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Tag className="h-3 w-3" />
                        <div className="flex space-x-1">
                          {item.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <span>Updated {item.updatedAt}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Item Form */}
      {showCreateForm && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Create New Item</CardTitle>
            <CardDescription>
              Add a new item to your list
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
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-description">Description</Label>
              <Input
                id="item-description"
                placeholder="Enter item description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
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
                <Label htmlFor="item-due-date">Due Date</Label>
                <Input
                  id="item-due-date"
                  type="date"
                  value={newItem.dueDate}
                  onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })}
                />
              </div>
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
            <div className="flex items-center space-x-2">
              <Button onClick={handleCreateItem} disabled={!newItem.title.trim()}>
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

export default ListBoard;






