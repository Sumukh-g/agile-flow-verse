import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCrmProject } from '@/hooks/useCrm';
import { ArrowLeft, Building2, Calendar, DollarSign, Mail, Phone, TrendingUp, Users } from 'lucide-react';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

const CrmProjectDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading, error } = useCrmProject(id!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/projects')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to CRM
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Project not found or error loading project.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const client = project.client;
  const deals = (project as any).deals || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'review': return 'bg-purple-100 text-purple-800';
      case 'on-hold': return 'bg-orange-100 text-orange-800';
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
      case 'closed-won': return 'bg-green-100 text-green-800';
      case 'closed-lost': return 'bg-red-100 text-red-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'proposal': return 'bg-purple-100 text-purple-800';
      case 'qualified': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to CRM
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-muted-foreground mt-1">{project.description || 'No description'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
          <Badge className={getPriorityColor(project.priority)}>{project.priority}</Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.progress}%</div>
            <Progress value={project.progress} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${project.budget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Spent: ${project.spent.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{client ? client.name : 'None'}</div>
            <p className="text-xs text-muted-foreground mt-1">{client?.company || 'No client assigned'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Related Deals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${deals.reduce((sum: number, d: any) => sum + (d.value || 0), 0).toLocaleString()} total value
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="client">Client Details</TabsTrigger>
          <TabsTrigger value="deals">Related Deals</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Priority</p>
                  <Badge className={getPriorityColor(project.priority)}>{project.priority}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Progress</p>
                  <Progress value={project.progress} className="mt-2" />
                  <p className="text-sm mt-1">{project.progress}% complete</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Budget</p>
                  <p className="text-lg font-semibold">${project.budget.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Spent: ${project.spent.toLocaleString()}</p>
                </div>
                {project.startDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                    <p className="text-sm">{new Date(project.startDate).toLocaleDateString()}</p>
                  </div>
                )}
                {project.endDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">End Date</p>
                    <p className="text-sm">{new Date(project.endDate).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold">${project.budget.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount Spent</p>
                  <p className="text-2xl font-bold text-orange-600">${project.spent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Remaining Budget</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${(project.budget - project.spent).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Budget Utilization</p>
                  <Progress 
                    value={project.budget > 0 ? (project.spent / project.budget) * 100 : 0} 
                    className="mt-2" 
                  />
                  <p className="text-sm mt-1">
                    {project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0}% used
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="client" className="space-y-4">
          {client ? (
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-lg font-semibold">{client.name}</p>
                </div>
                {client.company && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Company</p>
                    <p className="text-lg">{client.company}</p>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                      {client.email}
                    </a>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                      {client.phone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">No client assigned to this project.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="deals" className="space-y-4">
          {deals.length > 0 ? (
            <div className="space-y-4">
              {deals.map((deal: any) => (
                <Card key={deal.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{deal.title}</CardTitle>
                      <Badge className={getStageColor(deal.stage)}>{deal.stage.replace('-', ' ')}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Value</p>
                        <p className="text-lg font-semibold">${deal.value.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Probability</p>
                        <p className="text-lg font-semibold">{deal.probability}%</p>
                      </div>
                      {deal.expectedCloseDate && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Expected Close</p>
                          <p className="text-sm">{new Date(deal.expectedCloseDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      {deal.source && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Source</p>
                          <p className="text-sm">{deal.source}</p>
                        </div>
                      )}
                    </div>
                    {deal.notes && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-muted-foreground">Notes</p>
                        <p className="text-sm mt-1">{deal.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  {client ? 'No deals found for this client.' : 'Assign a client to see related deals.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <div className="w-0.5 h-full bg-border mt-2"></div>
                  </div>
                  <div>
                    <p className="font-medium">Project Created</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(project.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {project.startDate && (
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <div className="w-0.5 h-full bg-border mt-2"></div>
                    </div>
                    <div>
                      <p className="font-medium">Project Started</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(project.startDate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {project.endDate && (
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div>
                      <p className="font-medium">Expected Completion</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(project.endDate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CrmProjectDashboard;

