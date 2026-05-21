import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useCrmClients,
  useCrmDeals,
  useCreateCrmClient,
  useUpdateCrmClient,
  useDeleteCrmClient,
  useCreateCrmDeal,
  useUpdateCrmDeal,
  useDeleteCrmDeal,
  useCrmSummary,
} from '@/hooks/useCrm';
import { CrmClient, CrmDeal } from '@/lib/api/types';
import {
  Building2,
  Calendar,
  DollarSign,
  Edit,
  Eye,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Target,
  TrendingUp,
  Trash2,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Briefcase,
  RefreshCw,
  Filter,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProjectCRMProps {
  projectId: string | undefined;
  projectName?: string;
}

// Status colors
const clientStatusColors: Record<string, string> = {
  lead: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  prospect: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  client: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

const dealStageColors: Record<string, string> = {
  lead: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  qualified: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  proposal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  negotiation: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'closed-won': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'closed-lost': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const dealStageLabels: Record<string, string> = {
  lead: 'Lead',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  'closed-won': 'Closed Won',
  'closed-lost': 'Closed Lost',
};

const ProjectCRM: React.FC<ProjectCRMProps> = ({ projectId, projectName }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Dialog states
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showDealDialog, setShowDealDialog] = useState(false);
  const [showClientDetail, setShowClientDetail] = useState(false);
  const [selectedClient, setSelectedClient] = useState<CrmClient | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<CrmDeal | null>(null);
  const [editingClient, setEditingClient] = useState<CrmClient | null>(null);
  const [editingDeal, setEditingDeal] = useState<CrmDeal | null>(null);

  // Queries - use real API
  const { data: allClients = [], isLoading: clientsLoading, refetch: refetchClients } = useCrmClients();
  const { data: allDeals = [], isLoading: dealsLoading, refetch: refetchDeals } = useCrmDeals();
  const { data: summary } = useCrmSummary();

  // Mutations
  const createClient = useCreateCrmClient();
  const updateClient = useUpdateCrmClient();
  const deleteClient = useDeleteCrmClient();
  const createDeal = useCreateCrmDeal();
  const updateDeal = useUpdateCrmDeal();
  const deleteDeal = useDeleteCrmDeal();

  // Filter clients and deals based on search and status
  const clients = useMemo(() => {
    let filtered = allClients;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(term) ||
        c.company?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    return filtered;
  }, [allClients, searchTerm, statusFilter]);

  const deals = useMemo(() => {
    let filtered = allDeals;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d => 
        d.title.toLowerCase().includes(term) ||
        d.client?.name?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [allDeals, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status === 'client').length;
    const totalDeals = deals.length;
    const openDeals = deals.filter(d => !['closed-won', 'closed-lost'].includes(d.stage)).length;
    const wonDeals = deals.filter(d => d.stage === 'closed-won').length;
    const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
    const wonValue = deals.filter(d => d.stage === 'closed-won').reduce((sum, d) => sum + (d.value || 0), 0);
    const pipelineValue = deals.filter(d => !['closed-won', 'closed-lost'].includes(d.stage)).reduce((sum, d) => sum + (d.value || 0), 0);
    
    return { totalClients, activeClients, totalDeals, openDeals, wonDeals, totalValue, wonValue, pipelineValue };
  }, [clients, deals]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handlers
  const handleRefresh = () => {
    refetchClients();
    refetchDeals();
    toast.success('Data refreshed');
  };

  const handleCreateClient = (data: Partial<CrmClient>) => {
    createClient.mutate(data, {
      onSuccess: () => {
        setShowClientDialog(false);
        setEditingClient(null);
      },
    });
  };

  const handleUpdateClient = (data: Partial<CrmClient>) => {
    if (!editingClient) return;
    updateClient.mutate({ id: editingClient.id, data }, {
      onSuccess: () => {
        setShowClientDialog(false);
        setEditingClient(null);
      },
    });
  };

  const handleDeleteClient = (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteClient.mutate(id);
    }
  };

  const handleCreateDeal = (data: Partial<CrmDeal>) => {
    createDeal.mutate(data, {
      onSuccess: () => {
        setShowDealDialog(false);
        setEditingDeal(null);
      },
    });
  };

  const handleUpdateDeal = (data: Partial<CrmDeal>) => {
    if (!editingDeal) return;
    updateDeal.mutate({ id: editingDeal.id, data }, {
      onSuccess: () => {
        setShowDealDialog(false);
        setEditingDeal(null);
      },
    });
  };

  const handleDeleteDeal = (id: string) => {
    if (confirm('Are you sure you want to delete this deal?')) {
      deleteDeal.mutate(id);
    }
  };

  const isLoading = clientsLoading || dealsLoading;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CRM</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {projectName || 'Project'} • Customer Relationship Management
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            onClick={() => { setEditingClient(null); setShowClientDialog(true); }}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-6 py-2 border-b bg-white/50 dark:bg-slate-900/50">
          <TabsList className="bg-slate-100 dark:bg-slate-800">
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Users className="w-4 h-4" />
              Clients
              {clients.length > 0 && (
                <Badge variant="secondary" className="ml-1">{clients.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="deals" className="gap-2">
              <Target className="w-4 h-4" />
              Deals
              {deals.length > 0 && (
                <Badge variant="secondary" className="ml-1">{deals.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-2">
              <Briefcase className="w-4 h-4" />
              Pipeline
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {/* Overview Tab */}
          <TabsContent value="overview" className="p-6 m-0">
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Total Clients</CardTitle>
                    <Users className="w-4 h-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalClients}</div>
                    <p className="text-xs text-slate-500 mt-1">
                      {stats.activeClients} active
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Open Deals</CardTitle>
                    <Target className="w-4 h-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.openDeals}</div>
                    <p className="text-xs text-slate-500 mt-1">
                      {stats.wonDeals} won
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Pipeline Value</CardTitle>
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.pipelineValue)}</div>
                    <p className="text-xs text-slate-500 mt-1">
                      in active deals
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Won Revenue</CardTitle>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.wonValue)}</div>
                    <p className="text-xs text-slate-500 mt-1">
                      from closed deals
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Clients */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Recent Clients</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('clients')}>
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {clients.slice(0, 5).map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-2 cursor-pointer"
                        onClick={() => { setSelectedClient(client); setShowClientDetail(true); }}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-slate-500">{client.company || 'No company'}</p>
                          </div>
                        </div>
                        <Badge className={clientStatusColors[client.status]}>
                          {client.status}
                        </Badge>
                      </div>
                    ))}
                    {clients.length === 0 && (
                      <p className="text-center text-slate-500 py-8">No clients yet</p>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Deals */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Recent Deals</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('deals')}>
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {deals.slice(0, 5).map((deal) => (
                      <div
                        key={deal.id}
                        className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-2"
                      >
                        <div>
                          <p className="font-medium">{deal.title}</p>
                          <p className="text-sm text-slate-500">{deal.client?.name || 'No client'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600">{formatCurrency(deal.value)}</p>
                          <Badge className={dealStageColors[deal.stage]} variant="secondary">
                            {dealStageLabels[deal.stage]}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {deals.length === 0 && (
                      <p className="text-center text-slate-500 py-8">No deals yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="p-6 m-0">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Clients</CardTitle>
                    <CardDescription>Manage your customer relationships</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Search clients..."
                        className="pl-9 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="lead">Leads</SelectItem>
                        <SelectItem value="prospect">Prospects</SelectItem>
                        <SelectItem value="client">Clients</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => { setEditingClient(null); setShowClientDialog(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Client
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : clients.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Last Contact</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                  {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{client.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{client.company || '—'}</TableCell>
                          <TableCell>{client.email || '—'}</TableCell>
                          <TableCell>
                            <Badge className={clientStatusColors[client.status]}>
                              {client.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(client.value)}</TableCell>
                          <TableCell>
                            {client.lastContact
                              ? formatDistanceToNow(parseISO(client.lastContact), { addSuffix: true })
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setSelectedClient(client); setShowClientDetail(true); }}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setEditingClient(client); setShowClientDialog(true); }}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteClient(client.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No clients yet</h3>
                    <p className="text-slate-500 mb-4">Start building your customer relationships</p>
                    <Button onClick={() => { setEditingClient(null); setShowClientDialog(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Client
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deals Tab */}
          <TabsContent value="deals" className="p-6 m-0">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Deals</CardTitle>
                    <CardDescription>Track your sales opportunities</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Search deals..."
                        className="pl-9 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button onClick={() => { setEditingDeal(null); setShowDealDialog(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Deal
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : deals.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Deal</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Probability</TableHead>
                        <TableHead>Expected Close</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deals.map((deal) => (
                        <TableRow key={deal.id}>
                          <TableCell className="font-medium">{deal.title}</TableCell>
                          <TableCell>{deal.client?.name || '—'}</TableCell>
                          <TableCell>
                            <Badge className={dealStageColors[deal.stage]}>
                              {dealStageLabels[deal.stage]}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-emerald-600">
                            {formatCurrency(deal.value)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={deal.probability} className="w-16 h-2" />
                              <span className="text-sm">{deal.probability}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {deal.expectedCloseDate
                              ? format(parseISO(deal.expectedCloseDate), 'MMM dd, yyyy')
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setEditingDeal(deal); setShowDealDialog(true); }}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => updateDeal.mutate({ id: deal.id, data: { stage: 'closed-won' } })}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Mark as Won
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => updateDeal.mutate({ id: deal.id, data: { stage: 'closed-lost' } })}
                                  className="text-red-600"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Mark as Lost
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteDeal(deal.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No deals yet</h3>
                    <p className="text-slate-500 mb-4">Start tracking your sales opportunities</p>
                    <Button onClick={() => { setEditingDeal(null); setShowDealDialog(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Deal
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pipeline Tab */}
          <TabsContent value="pipeline" className="p-6 m-0">
            <div className="grid grid-cols-6 gap-4">
              {Object.entries(dealStageLabels).map(([stage, label]) => {
                const stageDeals = deals.filter(d => d.stage === stage);
                const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
                
                return (
                  <Card key={stage} className="border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">{label}</CardTitle>
                        <Badge variant="secondary">{stageDeals.length}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">{formatCurrency(stageValue)}</p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {stageDeals.map((deal) => (
                        <Card
                          key={deal.id}
                          className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => { setEditingDeal(deal); setShowDealDialog(true); }}
                        >
                          <p className="font-medium text-sm truncate">{deal.title}</p>
                          <p className="text-xs text-slate-500 truncate">{deal.client?.name}</p>
                          <p className="text-sm font-bold text-emerald-600 mt-1">
                            {formatCurrency(deal.value)}
                          </p>
                        </Card>
                      ))}
                      {stageDeals.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-4">No deals</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Client Dialog */}
      <ClientDialog
        open={showClientDialog}
        onOpenChange={setShowClientDialog}
        client={editingClient}
        onSave={editingClient ? handleUpdateClient : handleCreateClient}
        isLoading={createClient.isPending || updateClient.isPending}
      />

      {/* Deal Dialog */}
      <DealDialog
        open={showDealDialog}
        onOpenChange={setShowDealDialog}
        deal={editingDeal}
        clients={allClients}
        onSave={editingDeal ? handleUpdateDeal : handleCreateDeal}
        isLoading={createDeal.isPending || updateDeal.isPending}
      />

      {/* Client Detail Dialog */}
      {selectedClient && (
        <ClientDetailDialog
          open={showClientDetail}
          onOpenChange={setShowClientDetail}
          client={selectedClient}
          onEdit={() => {
            setShowClientDetail(false);
            setEditingClient(selectedClient);
            setShowClientDialog(true);
          }}
        />
      )}
    </div>
  );
};

// Client Dialog Component
function ClientDialog({
  open,
  onOpenChange,
  client,
  onSave,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: CrmClient | null;
  onSave: (data: Partial<CrmClient>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'lead' as CrmClient['status'],
    value: 0,
    industry: '',
    source: '',
    notes: '',
  });

  React.useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        company: client.company || '',
        email: client.email || '',
        phone: client.phone || '',
        status: client.status,
        value: client.value,
        industry: client.industry || '',
        source: client.source || '',
        notes: client.notes || '',
      });
    } else {
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        status: 'lead',
        value: 0,
        industry: '',
        source: '',
        notes: '',
      });
    }
  }, [client]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          <DialogDescription>
            {client ? 'Update client information' : 'Enter details for the new client'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name *</Label>
              <Input
                className="mt-1"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div>
              <Label>Company</Label>
              <Input
                className="mt-1"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Acme Inc"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                className="mt-1"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.com"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                className="mt-1"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as CrmClient['status'] })}
              >
                <SelectTrigger className="mt-1">
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
            <div>
              <Label>Estimated Value</Label>
              <Input
                type="number"
                className="mt-1"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Industry</Label>
              <Input
                className="mt-1"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="Technology"
              />
            </div>
            <div>
              <Label>Source</Label>
              <Input
                className="mt-1"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="Website, Referral, etc."
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              className="mt-1"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this client..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSave(formData)} disabled={isLoading || !formData.name}>
            {isLoading ? 'Saving...' : client ? 'Update Client' : 'Create Client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Deal Dialog Component
function DealDialog({
  open,
  onOpenChange,
  deal,
  clients,
  onSave,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: CrmDeal | null;
  clients: CrmClient[];
  onSave: (data: Partial<CrmDeal>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    value: 0,
    stage: 'lead' as CrmDeal['stage'],
    probability: 10,
    expectedCloseDate: '',
    source: '',
    notes: '',
  });

  React.useEffect(() => {
    if (deal) {
      setFormData({
        title: deal.title,
        clientId: deal.clientId,
        value: deal.value,
        stage: deal.stage,
        probability: deal.probability,
        expectedCloseDate: deal.expectedCloseDate?.split('T')[0] || '',
        source: deal.source || '',
        notes: deal.notes || '',
      });
    } else {
      setFormData({
        title: '',
        clientId: '',
        value: 0,
        stage: 'lead',
        probability: 10,
        expectedCloseDate: '',
        source: '',
        notes: '',
      });
    }
  }, [deal]);

  // Auto-update probability based on stage
  const handleStageChange = (stage: CrmDeal['stage']) => {
    const probabilities: Record<CrmDeal['stage'], number> = {
      lead: 10,
      qualified: 25,
      proposal: 50,
      negotiation: 75,
      'closed-won': 100,
      'closed-lost': 0,
    };
    setFormData({ ...formData, stage, probability: probabilities[stage] });
  };

  const handleSave = () => {
    const data: Partial<CrmDeal> = {
      ...formData,
      expectedCloseDate: formData.expectedCloseDate || undefined,
    };
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{deal ? 'Edit Deal' : 'Create New Deal'}</DialogTitle>
          <DialogDescription>
            {deal ? 'Update deal information' : 'Enter details for the new deal'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Deal Title *</Label>
            <Input
              className="mt-1"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enterprise Software License"
            />
          </div>

          <div>
            <Label>Client *</Label>
            <Select
              value={formData.clientId}
              onValueChange={(v) => setFormData({ ...formData, clientId: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a client..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} {client.company && `(${client.company})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Value *</Label>
              <Input
                type="number"
                className="mt-1"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Expected Close Date</Label>
              <Input
                type="date"
                className="mt-1"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Stage</Label>
              <Select
                value={formData.stage}
                onValueChange={(v) => handleStageChange(v as CrmDeal['stage'])}
              >
                <SelectTrigger className="mt-1">
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
            <div>
              <Label>Probability ({formData.probability}%)</Label>
              <Input
                type="range"
                min="0"
                max="100"
                className="mt-1"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label>Source</Label>
            <Input
              className="mt-1"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="Inbound, Outbound, Referral, etc."
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              className="mt-1"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this deal..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !formData.title || !formData.clientId}
          >
            {isLoading ? 'Saving...' : deal ? 'Update Deal' : 'Create Deal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Client Detail Dialog
function ClientDetailDialog({
  open,
  onOpenChange,
  client,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: CrmClient;
  onEdit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xl">
                {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">{client.name}</DialogTitle>
              <DialogDescription>{client.company || 'No company'}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Badge className={clientStatusColors[client.status]} variant="secondary">
              {client.status}
            </Badge>
            <span className="font-bold text-emerald-600 text-lg">
              ${client.value.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                  {client.email}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                  {client.phone}
                </a>
              </div>
            )}
          </div>

          {(client.industry || client.source) && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              {client.industry && (
                <div>
                  <span className="text-slate-500">Industry:</span>{' '}
                  <span className="font-medium">{client.industry}</span>
                </div>
              )}
              {client.source && (
                <div>
                  <span className="text-slate-500">Source:</span>{' '}
                  <span className="font-medium">{client.source}</span>
                </div>
              )}
            </div>
          )}

          {client.lastContact && (
            <div className="text-sm">
              <span className="text-slate-500">Last Contact:</span>{' '}
              <span className="font-medium">
                {formatDistanceToNow(parseISO(client.lastContact), { addSuffix: true })}
              </span>
            </div>
          )}

          {client.notes && (
            <div>
              <Label className="text-slate-500">Notes</Label>
              <p className="mt-1 text-sm">{client.notes}</p>
            </div>
          )}

          {client.tags && client.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {client.tags.map((tag, i) => (
                <Badge key={i} variant="outline">{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ProjectCRM;
