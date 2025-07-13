import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Activity,
    Building2,
    Calendar,
    CheckCircle2,
    DollarSign,
    Download,
    Edit,
    Eye,
    FileText,
    Filter,
    Grid,
    List,
    Mail,
    MoreVertical,
    Phone,
    Plus,
    Search,
    Target,
    Trash2,
    TrendingUp,
    Upload,
    Users,
    Zap
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'lead' | 'prospect' | 'client' | 'inactive';
  value: number;
  lastContact: string;
  projects: number;
  industry: string;
  source: string;
  assignedTo: string;
  tags: string[];
  notes: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  clientId: string;
  status: 'planning' | 'in-progress' | 'review' | 'completed' | 'on-hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  team: string[];
  tasks: number;
  completedTasks: number;
  type: 'development' | 'design' | 'marketing' | 'consulting' | 'maintenance';
  profitability: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface Deal {
  id: string;
  title: string;
  clientId: string;
  value: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  expectedCloseDate: string;
  source: string;
  assignedTo: string;
  lastActivity: string;
  notes: string;
}

const ProjectsCRM: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Mock data - in real app, this would come from API
  const [clients] = useState<Client[]>([
    {
      id: '1',
      name: 'John Smith',
      company: 'TechCorp Inc.',
      email: 'john@techcorp.com',
      phone: '+1 (555) 123-4567',
      status: 'client',
      value: 125000,
      lastContact: '2 days ago',
      projects: 3,
      industry: 'Technology',
      source: 'Referral',
      assignedTo: 'Sarah Wilson',
      tags: ['enterprise', 'high-value'],
      notes: 'Key decision maker for technology initiatives'
    },
    {
      id: '2',
      name: 'Emily Chen',
      company: 'StartupXYZ',
      email: 'emily@startupxyz.com',
      phone: '+1 (555) 987-6543',
      status: 'prospect',
      value: 45000,
      lastContact: '1 week ago',
      projects: 1,
      industry: 'Fintech',
      source: 'Website',
      assignedTo: 'Mike Johnson',
      tags: ['startup', 'growth'],
      notes: 'Interested in MVP development'
    },
    {
      id: '3',
      name: 'David Rodriguez',
      company: 'Global Solutions',
      email: 'david@globalsolutions.com',
      phone: '+1 (555) 456-7890',
      status: 'lead',
      value: 85000,
      lastContact: '3 days ago',
      projects: 0,
      industry: 'Consulting',
      source: 'LinkedIn',
      assignedTo: 'Sarah Wilson',
      tags: ['enterprise', 'consulting'],
      notes: 'Evaluating digital transformation options'
    }
  ]);

  const [projects] = useState<Project[]>([
    {
      id: '1',
      name: 'E-commerce Platform',
      description: 'Complete e-commerce solution with payment integration',
      clientId: '1',
      status: 'in-progress',
      priority: 'high',
      progress: 75,
      budget: 85000,
      spent: 63750,
      startDate: '2024-01-15',
      endDate: '2024-03-30',
      team: ['dev-1', 'dev-2', 'designer-1'],
      tasks: 45,
      completedTasks: 34,
      type: 'development',
      profitability: 35,
      riskLevel: 'low'
    },
    {
      id: '2',
      name: 'Mobile App MVP',
      description: 'iOS and Android app for fintech startup',
      clientId: '2',
      status: 'planning',
      priority: 'medium',
      progress: 15,
      budget: 45000,
      spent: 6750,
      startDate: '2024-02-01',
      endDate: '2024-05-15',
      team: ['dev-3', 'designer-2'],
      tasks: 28,
      completedTasks: 4,
      type: 'development',
      profitability: 42,
      riskLevel: 'medium'
    },
    {
      id: '3',
      name: 'Brand Identity Design',
      description: 'Complete brand redesign and marketing materials',
      clientId: '3',
      status: 'review',
      priority: 'medium',
      progress: 90,
      budget: 25000,
      spent: 22500,
      startDate: '2024-01-01',
      endDate: '2024-02-28',
      team: ['designer-1', 'designer-3'],
      tasks: 18,
      completedTasks: 16,
      type: 'design',
      profitability: 28,
      riskLevel: 'low'
    }
  ]);

  const [deals] = useState<Deal[]>([
    {
      id: '1',
      title: 'Enterprise CRM System',
      clientId: '1',
      value: 150000,
      stage: 'proposal',
      probability: 75,
      expectedCloseDate: '2024-03-15',
      source: 'Referral',
      assignedTo: 'Sarah Wilson',
      lastActivity: '2 days ago',
      notes: 'Proposal submitted, waiting for feedback'
    },
    {
      id: '2',
      title: 'Mobile App Development',
      clientId: '2',
      value: 65000,
      stage: 'negotiation',
      probability: 85,
      expectedCloseDate: '2024-02-28',
      source: 'Website',
      assignedTo: 'Mike Johnson',
      lastActivity: '1 day ago',
      notes: 'Finalizing contract terms'
    },
    {
      id: '3',
      title: 'Digital Marketing Campaign',
      clientId: '3',
      value: 35000,
      stage: 'qualified',
      probability: 60,
      expectedCloseDate: '2024-04-10',
      source: 'LinkedIn',
      assignedTo: 'Sarah Wilson',
      lastActivity: '5 days ago',
      notes: 'Scheduled demo for next week'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lead': return 'bg-yellow-100 text-yellow-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      case 'client': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'planning': return 'bg-purple-100 text-purple-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on-hold': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'lead': return 'bg-gray-100 text-gray-800';
      case 'qualified': return 'bg-blue-100 text-blue-800';
      case 'proposal': return 'bg-purple-100 text-purple-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'closed-won': return 'bg-green-100 text-green-800';
      case 'closed-lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateClient = () => {
    toast.success('Client creation dialog would open');
  };

  const handleCreateProject = () => {
    toast.success('Project creation dialog would open');
  };

  const handleCreateDeal = () => {
    toast.success('Deal creation dialog would open');
  };

  const totalRevenue = projects.reduce((sum, project) => sum + project.budget, 0);
  const totalProfit = projects.reduce((sum, project) => sum + (project.budget * project.profitability / 100), 0);
  const activeProjects = projects.filter(p => p.status === 'in-progress').length;
  const totalClients = clients.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Building2 className="mr-3 h-7 w-7 text-primary" />
            Project CRM
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive client relationship and project management system
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Quick Add
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="deals">Sales Pipeline</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-green-600">+12% from last month</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                    <p className="text-2xl font-bold">{activeProjects}</p>
                    <p className="text-xs text-blue-600">3 starting this week</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                    <p className="text-2xl font-bold">{totalClients}</p>
                    <p className="text-xs text-purple-600">2 new this week</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
                    <p className="text-2xl font-bold">{Math.round((totalProfit / totalRevenue) * 100)}%</p>
                    <p className="text-xs text-orange-600">+3% improvement</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm">Project milestone completed</p>
                    <p className="text-xs text-muted-foreground">E-commerce Platform - 2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm">New client onboarded</p>
                    <p className="text-xs text-muted-foreground">TechCorp Inc. - 1 day ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm">Deal closed successfully</p>
                    <p className="text-xs text-muted-foreground">$65,000 Mobile App Development - 2 days ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-sm">Meeting scheduled</p>
                    <p className="text-xs text-muted-foreground">Demo with Global Solutions - Tomorrow 2 PM</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" onClick={handleCreateClient}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Client
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={handleCreateProject}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={handleCreateDeal}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Deal
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Project Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Project Status Overview</CardTitle>
              <CardDescription>Current status of all active projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {clients.find(c => c.id === project.clientId)?.company}
                        </p>
                      </div>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                      <Badge className={getPriorityColor(project.priority)}>
                        {project.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{project.progress}%</p>
                        <Progress value={project.progress} className="w-24 h-2" />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${project.budget.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Budget</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  <SelectItem value="lead">Leads</SelectItem>
                  <SelectItem value="prospect">Prospects</SelectItem>
                  <SelectItem value="client">Active Clients</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
              <Button onClick={handleCreateClient}>
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </div>
          </div>

          {/* Clients Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{client.company}</p>
                    </div>
                    <Badge className={getStatusColor(client.status)}>
                      {client.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{client.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span>{client.industry}</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium">${client.value.toLocaleString()}</p>
                      <p className="text-muted-foreground">Total Value</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{client.projects}</p>
                      <p className="text-muted-foreground">Projects</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {client.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          {/* Project Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="border rounded-md flex">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button onClick={handleCreateProject}>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>

          {/* Projects Display */}
          {viewMode === 'grid' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {clients.find(c => c.id === project.clientId)?.company}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                        <Badge className={getPriorityColor(project.priority)}>
                          {project.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">${project.budget.toLocaleString()}</p>
                        <p className="text-muted-foreground">Budget</p>
                      </div>
                      <div>
                        <p className="font-medium">{project.completedTasks}/{project.tasks}</p>
                        <p className="text-muted-foreground">Tasks</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">Project</th>
                        <th className="text-left p-4 font-medium">Client</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Progress</th>
                        <th className="text-left p-4 font-medium">Budget</th>
                        <th className="text-left p-4 font-medium">Due Date</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((project) => (
                        <tr key={project.id} className="border-b">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{project.name}</p>
                              <p className="text-sm text-muted-foreground">{project.type}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            {clients.find(c => c.id === project.clientId)?.company}
                          </td>
                          <td className="p-4">
                            <Badge className={getStatusColor(project.status)}>
                              {project.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Progress value={project.progress} className="w-16 h-2" />
                              <span className="text-sm">{project.progress}%</span>
                            </div>
                          </td>
                          <td className="p-4">${project.budget.toLocaleString()}</td>
                          <td className="p-4">{project.endDate}</td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="deals" className="space-y-6">
          {/* Sales Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Pipeline</CardTitle>
              <CardDescription>Track deals through your sales process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-6">
                {['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'].map((stage) => (
                  <div key={stage} className="space-y-3">
                    <div className="text-center">
                      <h4 className="font-medium capitalize">{stage.replace('-', ' ')}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${deals.filter(d => d.stage === stage).reduce((sum, d) => sum + d.value, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {deals.filter(d => d.stage === stage).map((deal) => (
                        <Card key={deal.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow">
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm">{deal.title}</h5>
                            <p className="text-xs text-muted-foreground">
                              {clients.find(c => c.id === deal.clientId)?.company}
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">${deal.value.toLocaleString()}</span>
                              <span className="text-xs text-muted-foreground">{deal.probability}%</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Deal Details */}
          <Card>
            <CardHeader>
              <CardTitle>Deal Management</CardTitle>
              <CardDescription>Detailed view of all deals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="font-medium">{deal.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {clients.find(c => c.id === deal.clientId)?.company}
                        </p>
                      </div>
                      <Badge className={getStageColor(deal.stage)}>
                        {deal.stage.replace('-', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">${deal.value.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{deal.probability}% probability</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{deal.expectedCloseDate}</p>
                        <p className="text-xs text-muted-foreground">Expected close</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Dashboard */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Revenue</span>
                    <span className="font-bold">${totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Profit</span>
                    <span className="font-bold text-green-600">${totalProfit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Profit Margin</span>
                    <span className="font-bold">{Math.round((totalProfit / totalRevenue) * 100)}%</span>
                  </div>
                  <Progress value={(totalProfit / totalRevenue) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>On Time Delivery</span>
                    <span className="font-bold text-green-600">87%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Budget Adherence</span>
                    <span className="font-bold text-blue-600">92%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Client Satisfaction</span>
                    <span className="font-bold text-purple-600">4.8/5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Team Utilization</span>
                    <span className="font-bold">78%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sales Funnel Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['lead', 'qualified', 'proposal', 'negotiation', 'closed-won'].map((stage, index) => {
                  const stageDeals = deals.filter(d => d.stage === stage);
                  const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
                  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
                  const percentage = (stageValue / totalValue) * 100;
                  
                  return (
                    <div key={stage} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="capitalize">{stage.replace('-', ' ')}</span>
                        <span>${stageValue.toLocaleString()} ({stageDeals.length} deals)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>CRM Settings</CardTitle>
                <CardDescription>Configure your CRM preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-assign leads</Label>
                    <p className="text-sm text-muted-foreground">Automatically assign new leads to team members</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email notifications</Label>
                    <p className="text-sm text-muted-foreground">Send email alerts for important events</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Activity tracking</Label>
                    <p className="text-sm text-muted-foreground">Track user activities and interactions</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Manage your CRM data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export All Data
                </Button>
                <Button className="w-full" variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </Button>
                <Button className="w-full" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
                <Separator />
                <Button className="w-full" variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectsCRM;
