import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BarChart3,
    Calendar,
    CheckCircle2,
    Clock,
    Cloud,
    Code,
    Copy,
    Database,
    Download,
    ExternalLink,
    Eye,
    FileText,
    GitBranch,
    Key,
    Layers,
    MessageSquare,
    Plus,
    Search,
    Settings,
    Shield,
    Star,
    TrendingUp,
    Webhook,
    Zap
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  status: 'connected' | 'available' | 'premium';
  rating: number;
  downloads: string;
  developer: string;
  lastUpdated: string;
  features: string[];
  pricing: 'free' | 'paid' | 'freemium';
}

const IntegrationsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('marketplace');

  const integrations: Integration[] = [
    {
      id: 'slack',
      name: 'Slack',
      description: 'Real-time team communication and notifications',
      category: 'communication',
      icon: <MessageSquare className="w-6 h-6" />,
      status: 'connected',
      rating: 4.8,
      downloads: '50K+',
      developer: 'Slack Technologies',
      lastUpdated: '2 days ago',
      features: ['Real-time notifications', 'Channel integration', 'Bot commands', 'File sharing'],
      pricing: 'free'
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Version control and code repository management',
      category: 'development',
      icon: <GitBranch className="w-6 h-6" />,
      status: 'connected',
      rating: 4.9,
      downloads: '75K+',
      developer: 'GitHub Inc.',
      lastUpdated: '1 day ago',
      features: ['Repository sync', 'PR tracking', 'Issue management', 'Commit history'],
      pricing: 'free'
    },
    {
      id: 'jira',
      name: 'Jira',
      description: 'Issue tracking and project management',
      category: 'project-management',
      icon: <FileText className="w-6 h-6" />,
      status: 'available',
      rating: 4.6,
      downloads: '40K+',
      developer: 'Atlassian',
      lastUpdated: '3 days ago',
      features: ['Issue sync', 'Sprint planning', 'Workflow automation', 'Reporting'],
      pricing: 'freemium'
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      description: 'Calendar integration and scheduling',
      category: 'productivity',
      icon: <Calendar className="w-6 h-6" />,
      status: 'available',
      rating: 4.7,
      downloads: '60K+',
      developer: 'Google LLC',
      lastUpdated: '1 week ago',
      features: ['Event sync', 'Meeting scheduling', 'Deadline tracking', 'Reminders'],
      pricing: 'free'
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Workflow automation and app connections',
      category: 'automation',
      icon: <Zap className="w-6 h-6" />,
      status: 'premium',
      rating: 4.5,
      downloads: '30K+',
      developer: 'Zapier Inc.',
      lastUpdated: '5 days ago',
      features: ['Multi-app workflows', 'Trigger automation', 'Data transformation', 'Conditional logic'],
      pricing: 'paid'
    },
    {
      id: 'aws',
      name: 'Amazon Web Services',
      description: 'Cloud infrastructure and deployment',
      category: 'cloud',
      icon: <Cloud className="w-6 h-6" />,
      status: 'available',
      rating: 4.4,
      downloads: '25K+',
      developer: 'Amazon Web Services',
      lastUpdated: '1 week ago',
      features: ['Infrastructure monitoring', 'Deployment tracking', 'Cost management', 'Security alerts'],
      pricing: 'freemium'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Categories', count: integrations.length },
    { id: 'communication', name: 'Communication', count: integrations.filter(i => i.category === 'communication').length },
    { id: 'development', name: 'Development', count: integrations.filter(i => i.category === 'development').length },
    { id: 'project-management', name: 'Project Management', count: integrations.filter(i => i.category === 'project-management').length },
    { id: 'productivity', name: 'Productivity', count: integrations.filter(i => i.category === 'productivity').length },
    { id: 'automation', name: 'Automation', count: integrations.filter(i => i.category === 'automation').length },
    { id: 'cloud', name: 'Cloud Services', count: integrations.filter(i => i.category === 'cloud').length }
  ];

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const connectedIntegrations = integrations.filter(i => i.status === 'connected');

  const handleConnect = (integrationId: string) => {
    toast.success(`Connected to ${integrations.find(i => i.id === integrationId)?.name}`);
  };

  const handleDisconnect = (integrationId: string) => {
    toast.success(`Disconnected from ${integrations.find(i => i.id === integrationId)?.name}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'available': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPricingColor = (pricing: string) => {
    switch (pricing) {
      case 'free': return 'bg-green-100 text-green-800';
      case 'freemium': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Layers className="mr-3 h-7 w-7 text-primary" />
            Integrations Marketplace
        </h1>
          <p className="text-muted-foreground mt-1">
            Connect your favorite tools and supercharge your workflow
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Code className="w-4 h-4 mr-2" />
            API Docs
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Request Integration
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="connected">Connected</TabsTrigger>
          <TabsTrigger value="api">API & Webhooks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search integrations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="whitespace-nowrap"
                >
                  {category.name} ({category.count})
                </Button>
              ))}
            </div>
          </div>

          {/* Integration Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredIntegrations.map((integration) => (
              <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {integration.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{integration.developer}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={getStatusColor(integration.status)}>
                      {integration.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{integration.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{integration.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="w-4 h-4 text-muted-foreground" />
                      <span>{integration.downloads}</span>
                    </div>
                    <Badge variant="outline" className={getPricingColor(integration.pricing)}>
                      {integration.pricing}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Key Features:</p>
                    <div className="flex flex-wrap gap-1">
                      {integration.features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {integration.features.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{integration.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {integration.status === 'connected' ? (
                      <>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Settings className="w-4 h-4 mr-1" />
                          Configure
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDisconnect(integration.id)}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleConnect(integration.id)}
                        >
                          Connect
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="connected" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer transition-colors">
              <CardContent className="p-6 text-center">
                <Plus className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-semibold mb-1">Add Integration</h3>
                <p className="text-sm text-muted-foreground">Browse marketplace</p>
              </CardContent>
            </Card>

            {connectedIntegrations.map((integration) => (
              <Card key={integration.id} className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        {integration.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">Last sync: {integration.lastUpdated}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600">Active</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Status</div>
                      <div className="text-green-600">Connected</div>
                    </div>
                    <div>
                      <div className="font-medium">Health</div>
                      <div className="text-green-600">Excellent</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Settings className="w-4 h-4 mr-1" />
                      Settings
                    </Button>
                    <Button size="sm" variant="outline">
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Stats
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Integration Health Dashboard</CardTitle>
              <CardDescription>Monitor the performance of your connected integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">{connectedIntegrations.length}</div>
                  <div className="text-sm text-muted-foreground">Active Integrations</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-600">99.2%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Zap className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-600">1,247</div>
                  <div className="text-sm text-muted-foreground">API Calls Today</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-600" />
                  API Keys
                </CardTitle>
                <CardDescription>Manage your API keys for external integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Production API Key</div>
                      <div className="text-sm text-muted-foreground font-mono">sk_live_••••••••••••••••</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Development API Key</div>
                      <div className="text-sm text-muted-foreground font-mono">sk_test_••••••••••••••••</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Generate New Key
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-green-600" />
                  Webhooks
                </CardTitle>
                <CardDescription>Configure webhooks for real-time notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input id="webhook-url" placeholder="https://your-app.com/webhook" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="webhook-secret">Secret Key</Label>
                  <Input id="webhook-secret" placeholder="Enter secret key" type="password" />
                </div>
                
                <div className="space-y-3">
                  <Label>Events to Subscribe</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="task-created">Task Created</Label>
                      <Switch id="task-created" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="task-updated">Task Updated</Label>
                      <Switch id="task-updated" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="project-completed">Project Completed</Label>
                      <Switch id="project-completed" />
                    </div>
                  </div>
                </div>
                
                <Button className="w-full">Save Webhook</Button>
              </CardContent>
            </Card>
          </div>

      <Card>
        <CardHeader>
              <CardTitle>API Documentation & Resources</CardTitle>
              <CardDescription>Everything you need to integrate with our platform</CardDescription>
        </CardHeader>
        <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg text-center hover:bg-gray-50 cursor-pointer">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-semibold">API Reference</h4>
                  <p className="text-sm text-muted-foreground">Complete API documentation</p>
                </div>
                <div className="p-4 border rounded-lg text-center hover:bg-gray-50 cursor-pointer">
                  <Code className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-semibold">SDK Downloads</h4>
                  <p className="text-sm text-muted-foreground">Client libraries for popular languages</p>
                </div>
                <div className="p-4 border rounded-lg text-center hover:bg-gray-50 cursor-pointer">
                  <ExternalLink className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-semibold">Postman Collection</h4>
                  <p className="text-sm text-muted-foreground">Ready-to-use API collection</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">API Calls</p>
                    <p className="text-2xl font-bold">12,847</p>
                    <p className="text-xs text-muted-foreground">+23% from last month</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Success Rate</p>
                    <p className="text-2xl font-bold">99.2%</p>
                    <p className="text-xs text-muted-foreground">+0.3% improvement</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Avg Response</p>
                    <p className="text-2xl font-bold">142ms</p>
                    <p className="text-xs text-muted-foreground">-15ms faster</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Data Synced</p>
                    <p className="text-2xl font-bold">2.4GB</p>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </div>
                  <Database className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Integration Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {connectedIntegrations.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded">
                        {integration.icon}
                      </div>
                      <div>
                        <div className="font-medium">{integration.name}</div>
                        <div className="text-sm text-muted-foreground">Last 24 hours</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium">1,247</div>
                        <div className="text-muted-foreground">Requests</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-600">99.8%</div>
                        <div className="text-muted-foreground">Success</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">89ms</div>
                        <div className="text-muted-foreground">Avg Time</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
              <CardDescription>Configure global settings for all integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-sync">Auto-sync enabled</Label>
                    <p className="text-sm text-muted-foreground">Automatically sync data with connected services</p>
                  </div>
                  <Switch id="auto-sync" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="error-notifications">Error notifications</Label>
                    <p className="text-sm text-muted-foreground">Get notified when integrations fail</p>
                  </div>
                  <Switch id="error-notifications" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="rate-limiting">Rate limiting</Label>
                    <p className="text-sm text-muted-foreground">Prevent API rate limit violations</p>
                  </div>
                  <Switch id="rate-limiting" defaultChecked />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-semibold">Security Settings</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ip-whitelist">IP Whitelist</Label>
                    <p className="text-sm text-muted-foreground">Restrict API access to specific IP addresses</p>
                  </div>
                  <Switch id="ip-whitelist" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="audit-logs">Audit Logs</Label>
                    <p className="text-sm text-muted-foreground">Log all integration activities</p>
                  </div>
                  <Switch id="audit-logs" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <h4 className="font-semibold text-red-800 mb-2">Disconnect All Integrations</h4>
                <p className="text-sm text-red-600 mb-3">
                  This will disconnect all your integrations and remove all associated data.
                </p>
                <Button variant="destructive" size="sm">
                  Disconnect All
                </Button>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationsPage;
