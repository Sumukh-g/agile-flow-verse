import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import {
    AlertCircle,
    BarChart3,
    Bug,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    Filter,
    Flag,
    MessageSquare,
    Plus,
    Search,
    Settings,
    Target,
    TrendingUp,
    User
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ProjectAllWorkViewProps {
  projectId: string | undefined;
}

const ProjectAllWorkView: React.FC<ProjectAllWorkViewProps> = ({ projectId }) => {
  const [workItems, setWorkItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateWorkItemOpen, setIsCreateWorkItemOpen] = useState(false);
  const [selectedWorkItem, setSelectedWorkItem] = useState<any>(null);
  const [isWorkItemDetailsOpen, setIsWorkItemDetailsOpen] = useState(false);

  useEffect(() => {
    // Mock work items data
    setWorkItems([
      {
        id: 1,
        title: "Implement user authentication system",
        description: "Create secure login/logout functionality with JWT tokens",
        type: "Task",
        status: "In Progress",
        priority: "High",
        assignee: "John Smith",
        reporter: "Sarah Johnson",
        createdDate: "2024-01-10",
        dueDate: "2024-01-20",
        updatedDate: "2024-01-15",
        progress: 65,
        tags: ["backend", "security", "authentication"],
        comments: 8,
        attachments: 3,
        timeSpent: "12h 30m",
        estimatedTime: "20h"
      },
      {
        id: 2,
        title: "Design system color palette inconsistency",
        description: "Colors are not consistent across different components",
        type: "Bug",
        status: "Open",
        priority: "Medium",
        assignee: "Lisa Brown",
        reporter: "Mike Wilson",
        createdDate: "2024-01-12",
        dueDate: "2024-01-18",
        updatedDate: "2024-01-14",
        progress: 0,
        tags: ["design", "ui", "bug"],
        comments: 5,
        attachments: 2,
        timeSpent: "2h",
        estimatedTime: "8h"
      },
      {
        id: 3,
        title: "API Documentation",
        description: "Complete API documentation for all endpoints",
        type: "Documentation",
        status: "Review",
        priority: "Medium",
        assignee: "Tom Davis",
        reporter: "John Smith",
        createdDate: "2024-01-08",
        dueDate: "2024-01-16",
        updatedDate: "2024-01-15",
        progress: 90,
        tags: ["documentation", "api"],
        comments: 3,
        attachments: 1,
        timeSpent: "8h",
        estimatedTime: "10h"
      },
      {
        id: 4,
        title: "Database performance optimization",
        description: "Optimize slow queries and improve database performance",
        type: "Enhancement",
        status: "Done",
        priority: "High",
        assignee: "Mike Wilson",
        reporter: "Sarah Johnson",
        createdDate: "2024-01-05",
        dueDate: "2024-01-15",
        updatedDate: "2024-01-14",
        progress: 100,
        tags: ["database", "performance", "optimization"],
        comments: 12,
        attachments: 4,
        timeSpent: "16h",
        estimatedTime: "15h"
      },
      {
        id: 5,
        title: "Mobile app crash on startup",
        description: "App crashes immediately after launch on Android devices",
        type: "Bug",
        status: "In Progress",
        priority: "Critical",
        assignee: "Emma Davis",
        reporter: "User Support",
        createdDate: "2024-01-14",
        dueDate: "2024-01-17",
        updatedDate: "2024-01-15",
        progress: 30,
        tags: ["mobile", "android", "crash", "critical"],
        comments: 15,
        attachments: 6,
        timeSpent: "6h",
        estimatedTime: "12h"
      },
      {
        id: 6,
        title: "User onboarding flow improvement",
        description: "Redesign the user onboarding process to improve conversion",
        type: "Feature",
        status: "Planning",
        priority: "Medium",
        assignee: "Lisa Brown",
        reporter: "Product Team",
        createdDate: "2024-01-13",
        dueDate: "2024-01-25",
        updatedDate: "2024-01-15",
        progress: 15,
        tags: ["ux", "onboarding", "conversion"],
        comments: 7,
        attachments: 2,
        timeSpent: "4h",
        estimatedTime: "24h"
      }
    ]);
  }, [projectId]);

  const filteredWorkItems = workItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === "all" || item.type.toLowerCase() === typeFilter.toLowerCase();
    const matchesStatus = statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesAssignee = assigneeFilter === "all" || item.assignee === assigneeFilter;
    const matchesPriority = priorityFilter === "all" || item.priority.toLowerCase() === priorityFilter.toLowerCase();
    
    const matchesTab = activeTab === "all" || 
                      (activeTab === "my_work" && item.assignee === "John Smith") ||
                      (activeTab === "overdue" && new Date(item.dueDate) < new Date()) ||
                      (activeTab === "high_priority" && item.priority === "Critical" || item.priority === "High");
    
    return matchesSearch && matchesType && matchesStatus && matchesAssignee && matchesPriority && matchesTab;
  });

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'task': return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      case 'bug': return <Bug className="h-4 w-4 text-red-500" />;
      case 'feature': return <Target className="h-4 w-4 text-green-500" />;
      case 'enhancement': return <TrendingUp className="h-4 w-4 text-purple-500" />;
      case 'documentation': return <FileText className="h-4 w-4 text-orange-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-gray-100 text-gray-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'in progress': return 'bg-yellow-100 text-yellow-800';
      case 'review': return 'bg-purple-100 text-purple-800';
      case 'done': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'border-l-red-600 bg-red-50';
      case 'high': return 'border-l-red-400 bg-red-50';
      case 'medium': return 'border-l-yellow-400 bg-yellow-50';
      case 'low': return 'border-l-green-400 bg-green-50';
      default: return 'border-l-gray-400 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'high': return <Flag className="h-4 w-4 text-red-500" />;
      case 'medium': return <Flag className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Flag className="h-4 w-4 text-green-500" />;
      default: return <Flag className="h-4 w-4 text-gray-500" />;
    }
  };

  const CreateWorkItemForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" placeholder="Enter work item title" />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Describe the work item..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Type</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="task">Task</SelectItem>
              <SelectItem value="bug">Bug</SelectItem>
              <SelectItem value="feature">Feature</SelectItem>
              <SelectItem value="enhancement">Enhancement</SelectItem>
              <SelectItem value="documentation">Documentation</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="assignee">Assignee</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="john">John Smith</SelectItem>
              <SelectItem value="sarah">Sarah Johnson</SelectItem>
              <SelectItem value="mike">Mike Wilson</SelectItem>
              <SelectItem value="lisa">Lisa Brown</SelectItem>
              <SelectItem value="tom">Tom Davis</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="dueDate">Due Date</Label>
          <Input id="dueDate" type="date" />
        </div>
      </div>
      <div>
        <Label htmlFor="tags">Tags</Label>
        <Input id="tags" placeholder="Enter tags (comma separated)" />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setIsCreateWorkItemOpen(false)}>Cancel</Button>
        <Button onClick={() => {
          toast.success("Work item created successfully!");
          setIsCreateWorkItemOpen(false);
        }}>Create Work Item</Button>
      </div>
    </div>
  );

  const WorkItemCard = ({ item }: { item: any }) => (
    <Card className={`hover:shadow-md transition-shadow cursor-pointer border-l-4 ${getPriorityColor(item.priority)}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getTypeIcon(item.type)}
            <h3 className="font-semibold">{item.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {getPriorityIcon(item.priority)}
            <Badge className={getStatusColor(item.status)}>
              {item.status}
            </Badge>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {item.description}
        </p>
        
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-xs">
            {item.type}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {item.priority}
          </Badge>
          {item.tags.slice(0, 2).map((tag: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              #{tag}
            </Badge>
          ))}
          {item.tags.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{item.tags.length - 2}
            </Badge>
          )}
        </div>
        
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{item.progress}%</span>
          </div>
          <Progress value={item.progress} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{item.assignee}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{item.dueDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{item.timeSpent} / {item.estimatedTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            <span>{item.comments} comments</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-3 border-t">
          <span className="text-xs text-muted-foreground">
            Updated: {item.updatedDate}
          </span>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => {
              setSelectedWorkItem(item);
              setIsWorkItemDetailsOpen(true);
            }}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const WorkItemDetails = ({ item }: { item: any }) => (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {getTypeIcon(item.type)}
            <h3 className="text-xl font-semibold">{item.title}</h3>
            <Badge className={getStatusColor(item.status)}>
              {item.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">{item.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {getPriorityIcon(item.priority)}
          <Badge variant="outline">{item.priority}</Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Assignee</p>
          <p className="font-medium">{item.assignee}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Reporter</p>
          <p className="font-medium">{item.reporter}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Due Date</p>
          <p className="font-medium">{item.dueDate}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Time Tracking</p>
          <p className="font-medium">{item.timeSpent} / {item.estimatedTime}</p>
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Progress</span>
          <span className="text-sm font-medium">{item.progress}%</span>
        </div>
        <Progress value={item.progress} className="h-3" />
      </div>
      
      <div>
        <h4 className="font-medium mb-2">Tags</h4>
        <div className="flex flex-wrap gap-2">
          {item.tags.map((tag: string, index: number) => (
            <Badge key={index} variant="secondary">
              #{tag}
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button 
          variant="outline"
          onClick={() => {
            setSelectedWorkItem(item);
            setIsCreateWorkItemOpen(true);
            toast.info(`Editing work item: ${item.title}`);
          }}
        >
          Edit
        </Button>
        <Button 
          variant="outline"
          onClick={() => toast.info('Comment feature coming soon')}
        >
          Comment
        </Button>
        <Button
          onClick={() => toast.info('Update status feature coming soon')}
        >
          Update Status
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">All Work</h2>
          <p className="text-muted-foreground">Comprehensive view of all project work items</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => toast.info('Configure view settings coming soon')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Dialog open={isCreateWorkItemOpen} onOpenChange={setIsCreateWorkItemOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Work Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Work Item</DialogTitle>
                <DialogDescription>
                  Add a new work item to your project
                </DialogDescription>
              </DialogHeader>
              <CreateWorkItemForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{workItems.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{workItems.filter(i => i.status === 'In Progress').length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{workItems.filter(i => i.status === 'Done').length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bugs</p>
                <p className="text-2xl font-bold">{workItems.filter(i => i.type === 'Bug').length}</p>
              </div>
              <Bug className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{workItems.filter(i => new Date(i.dueDate) < new Date()).length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search work items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="task">Task</SelectItem>
              <SelectItem value="bug">Bug</SelectItem>
              <SelectItem value="feature">Feature</SelectItem>
              <SelectItem value="enhancement">Enhancement</SelectItem>
              <SelectItem value="documentation">Documentation</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
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
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button 
          variant="outline"
          onClick={() => toast.info('Advanced filters coming soon')}
        >
          <Filter className="h-4 w-4 mr-2" />
          Advanced Filters
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">All Work</TabsTrigger>
          <TabsTrigger value="my_work">My Work</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="high_priority">High Priority</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredWorkItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No work items found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || typeFilter !== "all" || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "Create your first work item to get started"
                  }
                </p>
                <Button onClick={() => setIsCreateWorkItemOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Work Item
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredWorkItems.map((item) => (
                <WorkItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Work Item Details Dialog */}
      <Dialog open={isWorkItemDetailsOpen} onOpenChange={setIsWorkItemDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Work Item Details</DialogTitle>
          </DialogHeader>
          {selectedWorkItem && <WorkItemDetails item={selectedWorkItem} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectAllWorkView; 