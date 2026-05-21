import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useCreateCrmClient, useCreateCrmDeal, useCreateCrmProject, useCrmClients, useCrmDeals, useCrmProjects, useCrmSummary, useUpdateCrmClient, useUpdateCrmDeal, useUpdateCrmProject } from '@/hooks/useCrm';
import { api } from '@/lib/api';

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
  
  // Dialog states
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);
  const [isCrmProjectDialogOpen, setIsCrmProjectDialogOpen] = useState(false);
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
  const [isClientViewOpen, setIsClientViewOpen] = useState(false);
  const [isProjectViewOpen, setIsProjectViewOpen] = useState(false);

  // Quick view and editing state
  const [viewClient, setViewClient] = useState<Client | null>(null);
  const [viewProject, setViewProject] = useState<Project | null>(null);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  
  // Project assignment states
  const [selectedProjectForClient, setSelectedProjectForClient] = useState<string>('');
  const [selectedProjectForDeal, setSelectedProjectForDeal] = useState<Record<string, string>>({});
  
  // Form states
  const [clientForm, setClientForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'lead' as const,
    industry: '',
    source: '',
    notes: ''
  });
  
  const [dealForm, setDealForm] = useState({
    title: '',
    clientId: '',
    value: 0,
    stage: 'lead' as const,
    probability: 50,
    expectedCloseDate: '',
    source: '',
    notes: ''
  });

  // Meeting form
  const [meetingClientId, setMeetingClientId] = useState('');
  const [meetingStart, setMeetingStart] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');

  // CRM API data
  const { data: crmProjects = [], isLoading: projectsLoading } = useCrmProjects();
  const { data: crmClients = [] } = useCrmClients();
  const { data: crmDeals = [] } = useCrmDeals();
  const { data: summary } = useCrmSummary();
  const createCrmProject = useCreateCrmProject();
  const createCrmDeal = useCreateCrmDeal();
  const createCrmClient = useCreateCrmClient();
  const updateCrmClient = useUpdateCrmClient();
  const updateCrmDeal = useUpdateCrmDeal();
  const updateCrmProject = useUpdateCrmProject();

  // Map backend CRM data to local UI shapes
  const clients: Client[] = (crmClients || []).map(c => ({
    id: c.id,
    name: c.name,
    company: c.company || '',
    email: c.email || '',
    phone: c.phone || '',
    status: (c.status as any) || 'lead',
    value: c.value || 0,
    lastContact: c.lastContact ? new Date(c.lastContact).toLocaleDateString() : '',
    projects: 0,
    industry: c.industry || '',
    source: c.source || '',
    assignedTo: c.assignedTo || '',
    tags: c.tags || [],
    notes: c.notes || '',
  }));

  const projects: Project[] = (crmProjects || []).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    clientId: p.clientId || '',
    status: (p.status as any) || 'in-progress',
    priority: (p.priority as any) || 'medium',
    progress: p.progress || 0,
    budget: p.budget || 0,
    spent: p.spent || 0,
    startDate: p.startDate || '',
    endDate: p.endDate || '',
    team: [],
    tasks: 0,
    completedTasks: 0,
    type: 'development' as const,
    profitability: 0,
    riskLevel: 'low' as const
  }));

  const deals: Deal[] = (crmDeals || []).map(d => ({
    id: d.id,
    title: d.title,
    clientId: d.clientId,
    value: d.value || 0,
    stage: d.stage as any,
    probability: d.probability || 0,
    expectedCloseDate: d.expectedCloseDate || '',
    source: d.source || '',
    assignedTo: d.assignedTo || '',
    lastActivity: d.lastActivity || '',
    notes: d.notes || '',
  }));

  // Initialize deal-to-project assignments from existing project client assignments
  React.useEffect(() => {
    if (deals.length > 0 && projects.length > 0) {
      const initialAssignments: Record<string, string> = {};
      deals.forEach(deal => {
        const projectWithClient = projects.find(p => p.clientId === deal.clientId);
        if (projectWithClient) {
          initialAssignments[deal.id] = projectWithClient.id;
        }
      });
      // Update state with current assignments
      setSelectedProjectForDeal(prev => {
        // Check if we need to update
        const needsUpdate = Object.keys(initialAssignments).some(
          dealId => prev[dealId] !== initialAssignments[dealId]
        ) || Object.keys(prev).some(
          dealId => !deals.find(d => d.id === dealId) // Remove assignments for deals that no longer exist
        );
        if (needsUpdate) {
          // Merge with existing, prioritizing existing user selections
          const updated = { ...initialAssignments };
          // Keep user selections that are still valid
          Object.keys(prev).forEach(dealId => {
            if (deals.find(d => d.id === dealId) && projects.find(p => p.id === prev[dealId])) {
              updated[dealId] = prev[dealId];
            }
          });
          return updated;
        }
        return prev;
      });
    }
  }, [crmDeals, crmProjects]);

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

  // Unified save handlers (create or update)
  const handleSaveClient = async () => {
    if (!clientForm.name.trim() || !clientForm.company.trim()) {
      toast.error('Name and company are required');
      return;
    }
    try {
      if (editingClientId) {
        await updateCrmClient.mutateAsync({
          id: editingClientId,
          data: {
            name: clientForm.name,
            company: clientForm.company,
            email: clientForm.email,
            phone: clientForm.phone,
            status: clientForm.status,
            industry: clientForm.industry,
            source: clientForm.source,
            notes: clientForm.notes,
          },
        });
      } else {
        await createCrmClient.mutateAsync({
          name: clientForm.name,
          company: clientForm.company,
          email: clientForm.email,
          phone: clientForm.phone,
          status: clientForm.status,
          industry: clientForm.industry,
          source: clientForm.source,
          notes: clientForm.notes,
        });
      }
      setIsClientDialogOpen(false);
      setEditingClientId(null);
      setClientForm({
        name: '',
        company: '',
        email: '',
        phone: '',
        status: 'lead',
        industry: '',
        source: '',
        notes: ''
      });
    } catch (e: any) {
      toast.error(e?.apiError?.message || 'Failed to save client');
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

  const handleCreateClient = async () => {
    if (!clientForm.name.trim() || !clientForm.company.trim()) {
      toast.error('Name and company are required');
      return;
    }
    try {
      await createCrmClient.mutateAsync({
        name: clientForm.name,
        company: clientForm.company,
        email: clientForm.email,
        phone: clientForm.phone,
        status: clientForm.status,
        industry: clientForm.industry,
        source: clientForm.source,
        notes: clientForm.notes,
      });
      toast.success('Client created successfully');
      setIsClientDialogOpen(false);
      setClientForm({
        name: '',
        company: '',
        email: '',
        phone: '',
        status: 'lead',
        industry: '',
        source: '',
        notes: ''
      });
    } catch (e: any) {
      toast.error(e?.apiError?.message || 'Failed to create client');
    }
  };

  const handleCreateDeal = async () => {
    if (!dealForm.title.trim() || !dealForm.clientId) {
      toast.error('Title and client are required');
      return;
    }
    try {
      if (editingDealId) {
        await updateCrmDeal.mutateAsync({
          id: editingDealId,
          data: {
            title: dealForm.title,
            clientId: dealForm.clientId,
            value: dealForm.value,
            stage: dealForm.stage,
            probability: dealForm.probability,
            expectedCloseDate: dealForm.expectedCloseDate || undefined,
            source: dealForm.source,
            notes: dealForm.notes,
          }
        });
        toast.success('Deal updated successfully');
      } else {
        await createCrmDeal.mutateAsync({
          title: dealForm.title,
          clientId: dealForm.clientId,
          value: dealForm.value,
          stage: dealForm.stage,
          probability: dealForm.probability,
          expectedCloseDate: dealForm.expectedCloseDate || undefined,
          source: dealForm.source,
          notes: dealForm.notes,
        });
        toast.success('Deal created successfully');
      }
      setIsDealDialogOpen(false);
      setEditingDealId(null);
      setDealForm({
        title: '',
        clientId: '',
        value: 0,
        stage: 'lead',
        probability: 50,
        expectedCloseDate: '',
        source: '',
        notes: ''
      });
    } catch (e: any) {
      toast.error(e?.apiError?.message || `Failed to ${editingDealId ? 'update' : 'create'} deal`);
    }
  };

  const totalRevenue = (summary?.totalRevenue ?? projects.reduce((sum, project) => sum + (project.budget || 0), 0));
  const totalProfit = projects.reduce((sum, project) => sum + ((project.budget || 0) * (project.profitability || 0) / 100), 0);
  const activeProjects = (summary?.activeProjects ?? projects.filter(p => p.status === 'in-progress').length);
  const totalClients = (summary?.totalClients ?? clients.length);

  const exportCrmReport = () => {
    const csvEscape = (v: any) => {
      const s = String(v ?? '').replace(/"/g, '""');
      return `"${s}"`;
    };

    const clientsCsv = [
      ['Clients'],
      ['id', 'name', 'company', 'email', 'phone', 'status', 'value', 'lastContact', 'industry', 'source', 'notes'],
      ...clients.map(c => [
        c.id, c.name, c.company, c.email, c.phone, c.status, c.value, c.lastContact, c.industry, c.source, c.notes,
      ]),
      [''],
    ].map(row => row.map(csvEscape).join(',')).join('\n');

    const projectsCsv = [
      ['Projects'],
      ['id', 'name', 'clientId', 'status', 'priority', 'progress', 'budget', 'spent', 'startDate', 'endDate'],
      ...projects.map(p => [
        p.id, p.name, p.clientId, p.status, p.priority, p.progress, p.budget, p.spent, p.startDate, p.endDate,
      ]),
      [''],
    ].map(row => row.map(csvEscape).join(',')).join('\n');

    const dealsCsv = [
      ['Deals'],
      ['id', 'title', 'clientId', 'value', 'stage', 'probability', 'expectedCloseDate', 'source', 'notes'],
      ...deals.map(d => [
        d.id, d.title, d.clientId, d.value, d.stage, d.probability, d.expectedCloseDate, d.source, d.notes,
      ]),
    ].map(row => row.map(csvEscape).join(',')).join('\n');

    const content = [clientsCsv, projectsCsv, dealsCsv].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('CRM report generated');
  };

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
          <Button variant="outline" onClick={exportCrmReport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => { setEditingClientId(null); setIsClientDialogOpen(true); }}>
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
                    <p className="text-2xl font-bold">{totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0}%</p>
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
                <Dialog open={isClientDialogOpen} onOpenChange={(open) => {
                  setIsClientDialogOpen(open);
                  if (!open) setEditingClientId(null);
                }}>
                  <DialogTrigger asChild>
                    <Button className="w-full justify-start">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Client
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingClientId ? 'Edit Client' : 'Add New Client'}</DialogTitle>
                      <DialogDescription>{editingClientId ? 'Update client details' : 'Create a new client in your CRM'}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="client-name">Name *</Label>
                          <Input
                            id="client-name"
                            value={clientForm.name}
                            onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="client-company">Company *</Label>
                          <Input
                            id="client-company"
                            value={clientForm.company}
                            onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                            placeholder="Company Inc."
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="client-email">Email</Label>
                          <Input
                            id="client-email"
                            type="email"
                            value={clientForm.email}
                            onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                            placeholder="john@company.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="client-phone">Phone</Label>
                          <Input
                            id="client-phone"
                            value={clientForm.phone}
                            onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="client-status">Status</Label>
                          <Select value={clientForm.status} onValueChange={(value: any) => setClientForm({ ...clientForm, status: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lead">Lead</SelectItem>
                              <SelectItem value="prospect">Prospect</SelectItem>
                              <SelectItem value="client">Client</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="client-industry">Industry</Label>
                          <Input
                            id="client-industry"
                            value={clientForm.industry}
                            onChange={(e) => setClientForm({ ...clientForm, industry: e.target.value })}
                            placeholder="Technology"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client-source">Source</Label>
                        <Input
                          id="client-source"
                          value={clientForm.source}
                          onChange={(e) => setClientForm({ ...clientForm, source: e.target.value })}
                          placeholder="Website, Referral, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client-notes">Notes</Label>
                        <Textarea
                          id="client-notes"
                          value={clientForm.notes}
                          onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                          placeholder="Additional notes about the client"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsClientDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleSaveClient}>{editingClientId ? 'Save Changes' : 'Create Client'}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={isCrmProjectDialogOpen} onOpenChange={setIsCrmProjectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full justify-start" variant="outline" onClick={() => setIsCrmProjectDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Project
                    </Button>
                  </DialogTrigger>
                  <CrmProjectDialog
                    onClose={() => { setIsCrmProjectDialogOpen(false); setEditingProject(null); }}
                    project={editingProject || undefined}
                    onSave={async (payload: any) => {
                      if (editingProject?.id) {
                        await updateCrmProject.mutateAsync({ id: editingProject.id, data: payload });
                      } else {
                        await createCrmProject.mutateAsync(payload);
                      }
                    }}
                  />
                </Dialog>
                <Dialog open={isDealDialogOpen} onOpenChange={(open) => {
                  setIsDealDialogOpen(open);
                  if (!open) {
                    setEditingDealId(null);
                    setDealForm({
                      title: '',
                      clientId: '',
                      value: 0,
                      stage: 'lead',
                      probability: 50,
                      expectedCloseDate: '',
                      source: '',
                      notes: ''
                    });
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="w-full justify-start" variant="outline" onClick={() => {
                      setEditingDealId(null);
                      setDealForm({
                        title: '',
                        clientId: '',
                        value: 0,
                        stage: 'lead',
                        probability: 50,
                        expectedCloseDate: '',
                        source: '',
                        notes: ''
                      });
                      setIsDealDialogOpen(true);
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Deal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingDealId ? 'Edit Deal' : 'Add New Deal'}</DialogTitle>
                      <DialogDescription>{editingDealId ? 'Update deal details' : 'Create a new deal in your sales pipeline'}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="deal-title-dash">Deal Title *</Label>
                        <Input
                          id="deal-title-dash"
                          value={dealForm.title}
                          onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                          placeholder="Enterprise CRM System"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="deal-client-dash">Client *</Label>
                          <Select value={dealForm.clientId} onValueChange={(value) => setDealForm({ ...dealForm, clientId: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                            <SelectContent>
                              {clients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name} - {client.company}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deal-value-dash">Deal Value</Label>
                          <Input
                            id="deal-value-dash"
                            type="number"
                            value={dealForm.value}
                            onChange={(e) => setDealForm({ ...dealForm, value: Number(e.target.value) })}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="deal-stage-dash">Stage</Label>
                          <Select value={dealForm.stage} onValueChange={(value: any) => setDealForm({ ...dealForm, stage: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lead">Lead</SelectItem>
                              <SelectItem value="qualified">Qualified</SelectItem>
                              <SelectItem value="proposal">Proposal</SelectItem>
                              <SelectItem value="negotiation">Negotiation</SelectItem>
                              <SelectItem value="closed-won">Closed Won</SelectItem>
                              <SelectItem value="closed-lost">Closed Lost</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deal-probability-dash">Probability (%)</Label>
                          <Input
                            id="deal-probability-dash"
                            type="number"
                            min="0"
                            max="100"
                            value={dealForm.probability}
                            onChange={(e) => setDealForm({ ...dealForm, probability: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="deal-close-date-dash">Expected Close Date</Label>
                          <Input
                            id="deal-close-date-dash"
                            type="date"
                            value={dealForm.expectedCloseDate}
                            onChange={(e) => setDealForm({ ...dealForm, expectedCloseDate: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deal-source-dash">Source</Label>
                          <Input
                            id="deal-source-dash"
                            value={dealForm.source}
                            onChange={(e) => setDealForm({ ...dealForm, source: e.target.value })}
                            placeholder="Website, Referral, etc."
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deal-notes-dash">Notes</Label>
                        <Textarea
                          id="deal-notes-dash"
                          value={dealForm.notes}
                          onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })}
                          placeholder="Additional notes about the deal"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDealDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateDeal}>{editingDealId ? 'Save Changes' : 'Create Deal'}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={isMeetingDialogOpen} onOpenChange={setIsMeetingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full justify-start" variant="outline">
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Meeting
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Schedule Meeting</DialogTitle>
                      <DialogDescription>Choose the client and time. We’ll prepare an email invite with a meeting link.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Client</Label>
                        <Select value={meetingClientId} onValueChange={setMeetingClientId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client with email" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.filter(c => !!c.email).map(c => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name} {c.email ? `(${c.email})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start</Label>
                          <Input type="datetime-local" value={meetingStart} onChange={e => setMeetingStart(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input value={meetingTitle} onChange={e => setMeetingTitle(e.target.value)} placeholder="Optional subject" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea value={meetingNotes} onChange={e => setMeetingNotes(e.target.value)} placeholder="Any notes to share with client" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsMeetingDialogOpen(false)}>Cancel</Button>
                      <Button onClick={async () => {
                        if (!meetingClientId || !meetingStart) {
                          toast.error('Client and start time are required');
                          return;
                        }
                        try {
                          const resp = await api.crm.scheduleMeeting({
                            clientId: meetingClientId,
                            start: new Date(meetingStart).toISOString(),
                            title: meetingTitle || undefined,
                            notes: meetingNotes || undefined,
                          } as any);
                          setIsMeetingDialogOpen(false);
                          const mailto = `mailto:${resp.email}?subject=${encodeURIComponent(resp.subject)}&body=${encodeURIComponent(resp.body)}`;
                          window.location.href = mailto;
                          navigator.clipboard?.writeText(resp.meetingLink).catch(() => {});
                          toast.success('Invite prepared. Email draft opened and meeting link copied.');
                        } catch (e: any) {
                          toast.error(e?.apiError?.message || 'Failed to schedule meeting');
                        }
                      }}>Send Invite</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
              {projectsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading projects...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No projects found. Create your first project to get started!
                </div>
              ) : (
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
              )}
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
              <Dialog open={isClientDialogOpen} onOpenChange={(open) => {
                setIsClientDialogOpen(open);
                if (!open) setEditingClientId(null);
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Client
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingClientId ? 'Edit Client' : 'Add New Client'}</DialogTitle>
                    <DialogDescription>{editingClientId ? 'Update client details' : 'Create a new client in your CRM'}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="client-name-2">Name *</Label>
                        <Input
                          id="client-name-2"
                          value={clientForm.name}
                          onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client-company-2">Company *</Label>
                        <Input
                          id="client-company-2"
                          value={clientForm.company}
                          onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                          placeholder="Company Inc."
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="client-email-2">Email</Label>
                        <Input
                          id="client-email-2"
                          type="email"
                          value={clientForm.email}
                          onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                          placeholder="john@company.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client-phone-2">Phone</Label>
                        <Input
                          id="client-phone-2"
                          value={clientForm.phone}
                          onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="client-status-2">Status</Label>
                        <Select value={clientForm.status} onValueChange={(value: any) => setClientForm({ ...clientForm, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lead">Lead</SelectItem>
                            <SelectItem value="prospect">Prospect</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client-industry-2">Industry</Label>
                        <Input
                          id="client-industry-2"
                          value={clientForm.industry}
                          onChange={(e) => setClientForm({ ...clientForm, industry: e.target.value })}
                          placeholder="Technology"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client-source-2">Source</Label>
                      <Input
                        id="client-source-2"
                        value={clientForm.source}
                        onChange={(e) => setClientForm({ ...clientForm, source: e.target.value })}
                        placeholder="Website, Referral, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client-notes-2">Notes</Label>
                      <Textarea
                        id="client-notes-2"
                        value={clientForm.notes}
                        onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                        placeholder="Additional notes about the client"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsClientDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveClient}>{editingClientId ? 'Save Changes' : 'Create Client'}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                    <Button size="sm" className="flex-1" onClick={() => { setViewClient(client); setIsClientViewOpen(true); }}>
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingClientId(client.id);
                        setClientForm({
                          name: client.name,
                          company: client.company,
                          email: client.email,
                          phone: client.phone,
                          status: client.status as any,
                          industry: client.industry,
                          source: client.source,
                          notes: client.notes,
                        });
                        setIsClientDialogOpen(true);
                      }}
                    >
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

          {/* Client Quick View */}
          <Dialog open={isClientViewOpen} onOpenChange={(open) => {
            setIsClientViewOpen(open);
            if (!open) {
              setSelectedProjectForClient('');
            }
          }}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>{viewClient?.name}</DialogTitle>
                <DialogDescription>{viewClient?.company}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p><strong>Email:</strong> {viewClient?.email || '-'}</p>
                  <p><strong>Phone:</strong> {viewClient?.phone || '-'}</p>
                  <p><strong>Status:</strong> {viewClient?.status}</p>
                  <p><strong>Industry:</strong> {viewClient?.industry || '-'}</p>
                  <p><strong>Source:</strong> {viewClient?.source || '-'}</p>
                  <p className="text-sm text-muted-foreground">{viewClient?.notes || ''}</p>
                </div>
                
                {/* Project Assignment Section */}
                <div className="space-y-2 pt-4 border-t">
                  <Label>Assign to Project</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={selectedProjectForClient || projects.find(p => p.clientId === viewClient?.id)?.id || 'none'} 
                      onValueChange={setSelectedProjectForClient}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No project</SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={async () => {
                        if (!selectedProjectForClient || selectedProjectForClient === 'none' || !viewClient) return;
                        try {
                          await updateCrmProject.mutateAsync({
                            id: selectedProjectForClient,
                            data: { clientId: viewClient.id }
                          });
                          toast.success('Client assigned to project');
                          setSelectedProjectForClient('');
                        } catch (e: any) {
                          toast.error(e?.apiError?.message || 'Failed to assign client');
                        }
                      }}
                      disabled={!selectedProjectForClient || selectedProjectForClient === 'none' || selectedProjectForClient === projects.find(p => p.clientId === viewClient?.id)?.id}
                    >
                      Assign
                    </Button>
                  </div>
                  {projects.find(p => p.clientId === viewClient?.id) && (
                    <p className="text-xs text-muted-foreground">
                      Currently assigned to: {projects.find(p => p.clientId === viewClient?.id)?.name}
                    </p>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
              <Dialog open={isCrmProjectDialogOpen} onOpenChange={setIsCrmProjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </DialogTrigger>
                <CrmProjectDialog
                  onClose={() => { setIsCrmProjectDialogOpen(false); setEditingProject(null); }}
                  project={editingProject || undefined}
                  onSave={async (payload: any) => {
                    if (editingProject?.id) {
                      await updateCrmProject.mutateAsync({ id: editingProject.id, data: payload });
                    } else {
                      await createCrmProject.mutateAsync(payload);
                    }
                  }}
                />
              </Dialog>
            </div>
          </div>

          {/* Projects Display */}
          {projectsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No projects found. Create your first project to get started!</p>
            </div>
          ) : viewMode === 'grid' ? (
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
                      <Button 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => window.location.href = `/crm-projects/${(project as any).id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingProject({
                            id: (project as any).id,
                            name: project.name,
                            description: project.description,
                            status: project.status,
                            priority: project.priority,
                            budget: project.budget,
                            progress: project.progress,
                            clientId: project.clientId,
                          });
                          setIsCrmProjectDialogOpen(true);
                        }}
                      >
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
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => window.location.href = `/crm-projects/${(project as any).id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingProject({
                                    id: (project as any).id,
                                    name: project.name,
                                    description: project.description,
                                    status: project.status,
                                    priority: project.priority,
                                    budget: project.budget,
                                    progress: project.progress,
                                    clientId: project.clientId,
                                  });
                                  setIsCrmProjectDialogOpen(true);
                                }}
                              >
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

          {/* Project Quick View */}
          <Dialog open={isProjectViewOpen} onOpenChange={(open) => {
            setIsProjectViewOpen(open);
            if (!open) {
              setViewProject(null);
            }
          }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{viewProject?.name}</DialogTitle>
                <DialogDescription>
                  {clients.find(c => c.id === viewProject?.clientId)?.company || 'No client assigned'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{viewProject?.description || 'No description'}</p>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(viewProject?.status || 'planning')}>{viewProject?.status}</Badge>
                    <Badge className={getPriorityColor(viewProject?.priority || 'medium')}>{viewProject?.priority}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Progress:</strong> {viewProject?.progress}%</div>
                    <div><strong>Budget:</strong> ${viewProject?.budget.toLocaleString()}</div>
                  </div>
                </div>

                {/* Add Client Section */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label>Assign Client to Project</Label>
                    <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Create New Client
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Create New Client</DialogTitle>
                          <DialogDescription>Add a new client and assign to this project</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="new-client-name">Name *</Label>
                            <Input
                              id="new-client-name"
                              value={clientForm.name}
                              onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                              placeholder="John Doe"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="new-client-company">Company</Label>
                              <Input
                                id="new-client-company"
                                value={clientForm.company}
                                onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                                placeholder="Acme Corp"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-client-email">Email</Label>
                              <Input
                                id="new-client-email"
                                type="email"
                                value={clientForm.email}
                                onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                                placeholder="john@acme.com"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="new-client-phone">Phone</Label>
                              <Input
                                id="new-client-phone"
                                value={clientForm.phone}
                                onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                                placeholder="+1 234 567 8900"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-client-status">Status</Label>
                              <Select value={clientForm.status} onValueChange={(value: any) => setClientForm({ ...clientForm, status: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="lead">Lead</SelectItem>
                                  <SelectItem value="prospect">Prospect</SelectItem>
                                  <SelectItem value="client">Client</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsClientDialogOpen(false)}>Cancel</Button>
                          <Button onClick={async () => {
                            try {
                              const newClient = await createCrmClient.mutateAsync({
                                name: clientForm.name,
                                company: clientForm.company,
                                email: clientForm.email,
                                phone: clientForm.phone,
                                status: clientForm.status,
                                industry: clientForm.industry,
                                source: clientForm.source,
                                notes: clientForm.notes
                              });
                              // Assign the new client to the project
                              if (viewProject && newClient?.id) {
                                await updateCrmProject.mutateAsync({
                                  id: viewProject.id,
                                  data: { clientId: newClient.id }
                                });
                                toast.success('Client created and assigned to project');
                              } else {
                                toast.success('Client created');
                              }
                              setIsClientDialogOpen(false);
                              setClientForm({
                                name: '',
                                company: '',
                                email: '',
                                phone: '',
                                status: 'lead',
                                industry: '',
                                source: '',
                                notes: ''
                              });
                            } catch (e: any) {
                              toast.error(e?.apiError?.message || 'Failed to create client');
                            }
                          }} disabled={!clientForm.name}>
                            Create & Assign
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Select 
                    value={viewProject?.clientId || 'none'} 
                    onValueChange={async (value) => {
                      if (!viewProject) return;
                      try {
                        await updateCrmProject.mutateAsync({
                          id: viewProject.id,
                          data: { clientId: value === 'none' ? null : value }
                        });
                        // Refresh project data immediately
                        setViewProject({ ...viewProject, clientId: value === 'none' ? undefined : value });
                      } catch (e: any) {
                        toast.error(e?.apiError?.message || 'Failed to assign client');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No client</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.company ? `(${c.company})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Add Deal Section */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label>Create Deal for Project Client</Label>
                    <Dialog open={isDealDialogOpen} onOpenChange={(open) => {
                      setIsDealDialogOpen(open);
                      if (!open) {
                        setEditingDealId(null);
                        setDealForm({
                          title: '',
                          clientId: viewProject?.clientId || '',
                          value: 0,
                          stage: 'lead',
                          probability: 50,
                          expectedCloseDate: '',
                          source: '',
                          notes: ''
                        });
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" disabled={!viewProject?.clientId}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Deal
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Create New Deal</DialogTitle>
                          <DialogDescription>
                            Create a deal for {clients.find(c => c.id === viewProject?.clientId)?.name || 'the project client'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="project-deal-title">Deal Title *</Label>
                            <Input
                              id="project-deal-title"
                              value={dealForm.title}
                              onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                              placeholder="Enterprise CRM System"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="project-deal-client">Client *</Label>
                              <Select 
                                value={dealForm.clientId || viewProject?.clientId || ''} 
                                onValueChange={(value) => setDealForm({ ...dealForm, clientId: value })}
                                disabled={!!viewProject?.clientId}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select client" />
                                </SelectTrigger>
                                <SelectContent>
                                  {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                      {client.name} - {client.company}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="project-deal-value">Deal Value</Label>
                              <Input
                                id="project-deal-value"
                                type="number"
                                value={dealForm.value}
                                onChange={(e) => setDealForm({ ...dealForm, value: Number(e.target.value) })}
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="project-deal-stage">Stage</Label>
                              <Select value={dealForm.stage} onValueChange={(value: any) => setDealForm({ ...dealForm, stage: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="lead">Lead</SelectItem>
                                  <SelectItem value="qualified">Qualified</SelectItem>
                                  <SelectItem value="proposal">Proposal</SelectItem>
                                  <SelectItem value="negotiation">Negotiation</SelectItem>
                                  <SelectItem value="closed-won">Closed Won</SelectItem>
                                  <SelectItem value="closed-lost">Closed Lost</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="project-deal-probability">Probability (%)</Label>
                              <Input
                                id="project-deal-probability"
                                type="number"
                                min="0"
                                max="100"
                                value={dealForm.probability}
                                onChange={(e) => setDealForm({ ...dealForm, probability: Number(e.target.value) })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="project-deal-close-date">Expected Close Date</Label>
                            <Input
                              id="project-deal-close-date"
                              type="date"
                              value={dealForm.expectedCloseDate}
                              onChange={(e) => setDealForm({ ...dealForm, expectedCloseDate: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsDealDialogOpen(false)}>Cancel</Button>
                          <Button onClick={async () => {
                            try {
                              await createCrmDeal.mutateAsync({
                                title: dealForm.title,
                                clientId: dealForm.clientId || viewProject?.clientId || '',
                                value: dealForm.value,
                                stage: dealForm.stage,
                                probability: dealForm.probability,
                                expectedCloseDate: dealForm.expectedCloseDate || undefined,
                                source: dealForm.source,
                                notes: dealForm.notes
                              });
                              setIsDealDialogOpen(false);
                              setDealForm({
                                title: '',
                                clientId: viewProject?.clientId || '',
                                value: 0,
                                stage: 'lead',
                                probability: 50,
                                expectedCloseDate: '',
                                source: '',
                                notes: ''
                              });
                            } catch (e: any) {
                              toast.error(e?.apiError?.message || 'Failed to create deal');
                            }
                          }} disabled={!dealForm.title || !(dealForm.clientId || viewProject?.clientId)}>
                            Create Deal
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {viewProject?.clientId 
                      ? `Deals can be created for ${clients.find(c => c.id === viewProject.clientId)?.name || 'the assigned client'}`
                      : 'Assign a client to this project first to create deals'}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="deals" className="space-y-6">
          {/* Header with Add Deal button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Sales Pipeline</h2>
              <p className="text-muted-foreground">Manage your deals and track sales progress</p>
            </div>
            <Dialog open={isDealDialogOpen} onOpenChange={(open) => {
              setIsDealDialogOpen(open);
              if (!open) {
                setEditingDealId(null);
                setDealForm({
                  title: '',
                  clientId: '',
                  value: 0,
                  stage: 'lead',
                  probability: 50,
                  expectedCloseDate: '',
                  source: '',
                  notes: ''
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Deal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingDealId ? 'Edit Deal' : 'Add New Deal'}</DialogTitle>
                  <DialogDescription>{editingDealId ? 'Update deal details' : 'Create a new deal in your sales pipeline'}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="deal-title">Deal Title *</Label>
                    <Input
                      id="deal-title"
                      value={dealForm.title}
                      onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                      placeholder="Enterprise CRM System"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deal-client">Client *</Label>
                      <Select value={dealForm.clientId} onValueChange={(value) => setDealForm({ ...dealForm, clientId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} - {client.company}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deal-value">Deal Value</Label>
                      <Input
                        id="deal-value"
                        type="number"
                        value={dealForm.value}
                        onChange={(e) => setDealForm({ ...dealForm, value: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deal-stage">Stage</Label>
                      <Select value={dealForm.stage} onValueChange={(value: any) => setDealForm({ ...dealForm, stage: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lead">Lead</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="proposal">Proposal</SelectItem>
                          <SelectItem value="negotiation">Negotiation</SelectItem>
                          <SelectItem value="closed-won">Closed Won</SelectItem>
                          <SelectItem value="closed-lost">Closed Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deal-probability">Probability (%)</Label>
                      <Input
                        id="deal-probability"
                        type="number"
                        min="0"
                        max="100"
                        value={dealForm.probability}
                        onChange={(e) => setDealForm({ ...dealForm, probability: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deal-close-date">Expected Close Date</Label>
                      <Input
                        id="deal-close-date"
                        type="date"
                        value={dealForm.expectedCloseDate}
                        onChange={(e) => setDealForm({ ...dealForm, expectedCloseDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deal-source">Source</Label>
                      <Input
                        id="deal-source"
                        value={dealForm.source}
                        onChange={(e) => setDealForm({ ...dealForm, source: e.target.value })}
                        placeholder="Website, Referral, etc."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deal-notes">Notes</Label>
                    <Textarea
                      id="deal-notes"
                      value={dealForm.notes}
                      onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })}
                      placeholder="Additional notes about the deal"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDealDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateDeal}>{editingDealId ? 'Save Changes' : 'Create Deal'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

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
                {deals.map((deal) => {
                  const dealClient = clients.find(c => c.id === deal.clientId);
                  // Find project that has this deal's client assigned
                  const assignedProject = projects.find(p => p.clientId === deal.clientId);
                  // Use selectedProjectForDeal state if set, otherwise use assignedProject, otherwise 'none'
                  const currentProjectId = selectedProjectForDeal[deal.id] !== undefined 
                    ? selectedProjectForDeal[deal.id] 
                    : (assignedProject?.id || 'none');
                  
                  return (
                    <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h4 className="font-medium">{deal.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {dealClient?.name || dealClient?.company || 'No client'}
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
                          <p className="text-sm font-medium">{deal.expectedCloseDate || 'Not set'}</p>
                          <p className="text-xs text-muted-foreground">Expected close</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select 
                            value={currentProjectId}
                            onValueChange={async (value) => {
                              // Update state immediately for UI responsiveness
                              setSelectedProjectForDeal({ ...selectedProjectForDeal, [deal.id]: value });
                              
                              if (value !== 'none' && dealClient) {
                                try {
                                  await updateCrmProject.mutateAsync({
                                    id: value,
                                    data: { clientId: deal.clientId }
                                  });
                                  // State already updated above, no need to update again
                                } catch (e: any) {
                                  // Revert state on error
                                  setSelectedProjectForDeal(prev => {
                                    const newState = { ...prev };
                                    delete newState[deal.id];
                                    return newState;
                                  });
                                  toast.error(e?.apiError?.message || 'Failed to assign deal to project');
                                }
                              } else if (value === 'none' && assignedProject) {
                                // If unassigning, clear the clientId from the project
                                try {
                                  await updateCrmProject.mutateAsync({
                                    id: assignedProject.id,
                                    data: { clientId: null }
                                  });
                                  // State already updated above
                                } catch (e: any) {
                                  // Revert state on error
                                  setSelectedProjectForDeal(prev => {
                                    const newState = { ...prev };
                                    newState[deal.id] = assignedProject.id;
                                    return newState;
                                  });
                                  toast.error(e?.apiError?.message || 'Failed to unassign deal');
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Assign to project" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No project</SelectItem>
                              {projects.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingDealId(deal.id);
                              setDealForm({
                                title: deal.title || '',
                                clientId: deal.clientId || '',
                                value: deal.value || 0,
                                stage: (deal.stage as any) || 'lead',
                                probability: deal.probability || 0,
                                expectedCloseDate: deal.expectedCloseDate || '',
                                source: deal.source || '',
                                notes: deal.notes || '',
                              });
                              setIsDealDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                    <span className="font-bold">{totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0}%</span>
                  </div>
                  <Progress value={totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0} className="h-2" />
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
                <Button className="w-full" variant="outline" onClick={exportCrmReport}>
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

function CrmProjectDialog({
  onClose,
  project,
  onSave,
}: {
  onClose: () => void;
  project?: any;
  onSave: (payload: any) => Promise<any> | void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'planning' | 'in-progress' | 'review' | 'completed' | 'on-hold' | 'cancelled'>('in-progress');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [budget, setBudget] = useState<number>(0);
  const [clientId, setClientId] = useState<string>('');
  
  const { data: clients = [] } = useCrmClients();

  React.useEffect(() => {
    if (project) {
      setName(project.name ?? '');
      setDescription(project.description ?? '');
      setStatus(project.status ?? 'in-progress');
      setPriority(project.priority ?? 'medium');
      setBudget(project.budget ?? 0);
      setClientId(project.clientId ?? '');
    } else {
      setName('');
      setDescription('');
      setStatus('in-progress');
      setPriority('medium');
      setBudget(0);
      setClientId('');
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name,
      description,
      status,
      priority,
      budget,
      progress: project?.progress ?? 0,
      clientId: clientId || undefined,
    });
    setName('');
    setDescription('');
    setBudget(0);
    setClientId('');
    onClose();
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{project?.id ? 'Edit CRM Project' : 'Create CRM Project'}</DialogTitle>
        <DialogDescription>
          {project?.id ? 'Update CRM project details.' : 'Create a project within CRM (does not affect main Projects module).'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="space-y-2">
          <Label htmlFor="crm-name">Name</Label>
          <Input id="crm-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="New CRM Project" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="crm-desc">Description</Label>
          <Textarea id="crm-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the project" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
              <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="crm-client">Client (Optional)</Label>
          <Select value={clientId || "none"} onValueChange={(value) => setClientId(value === "none" ? "" : value)}>
            <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No client</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="crm-budget">Budget</Label>
          <Input id="crm-budget" type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
        </div>
        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!name}>
            {project?.id ? 'Save Changes' : 'Create Project'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export default ProjectsCRM;
