import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Calendar,
    Cloud,
    Database,
    ExternalLink,
    Github,
    Mail,
    Plus,
    Settings,
    Slack,
    Trash2,
    Zap
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  category: 'productivity' | 'development' | 'communication' | 'data';
  setupRequired: boolean;
}

const NoteIntegrations: React.FC<{ note: any; onUpdateNote: (noteId: string, updates: any) => void }> = ({ note, onUpdateNote }) => {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'github',
      name: 'GitHub',
      description: 'Sync with GitHub repositories and issues',
      icon: <Github className="h-5 w-5" />,
      connected: false,
      category: 'development',
      setupRequired: true
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Send updates to Slack channels',
      icon: <Slack className="h-5 w-5" />,
      connected: false,
      category: 'communication',
      setupRequired: true
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      description: 'Create calendar events from notes',
      icon: <Calendar className="h-5 w-5" />,
      connected: false,
      category: 'productivity',
      setupRequired: true
    },
    {
      id: 'email',
      name: 'Email',
      description: 'Send notes via email',
      icon: <Mail className="h-5 w-5" />,
      connected: true,
      category: 'communication',
      setupRequired: false
    },
    {
      id: 'database',
      name: 'Database',
      description: 'Store structured data from notes',
      icon: <Database className="h-5 w-5" />,
      connected: false,
      category: 'data',
      setupRequired: true
    },
    {
      id: 'cloud',
      name: 'Cloud Storage',
      description: 'Sync with cloud storage services',
      icon: <Cloud className="h-5 w-5" />,
      connected: false,
      category: 'data',
      setupRequired: true
    }
  ]);

  const [newIntegration, setNewIntegration] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleToggleIntegration = (id: string) => {
    setIntegrations(prev => 
      prev.map(integration => 
        integration.id === id 
          ? { ...integration, connected: !integration.connected }
          : integration
      )
    );
    toast.success('Integration status updated');
  };

  const handleAddIntegration = () => {
    if (newIntegration.trim()) {
      const integration: Integration = {
        id: newIntegration.toLowerCase().replace(/\s+/g, '-'),
        name: newIntegration,
        description: 'Custom integration',
        icon: <Zap className="h-5 w-5" />,
        connected: false,
        category: 'productivity',
        setupRequired: true
      };
      setIntegrations(prev => [...prev, integration]);
      setNewIntegration('');
      setShowAddForm(false);
      toast.success('Custom integration added');
    }
  };

  const handleRemoveIntegration = (id: string) => {
    setIntegrations(prev => prev.filter(integration => integration.id !== id));
    toast.success('Integration removed');
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'productivity': return 'bg-blue-100 text-blue-800';
      case 'development': return 'bg-green-100 text-green-800';
      case 'communication': return 'bg-purple-100 text-purple-800';
      case 'data': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const connectedIntegrations = integrations.filter(i => i.connected);
  const availableIntegrations = integrations.filter(i => !i.connected);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Note Integrations</h3>
          <p className="text-sm text-muted-foreground">
            Connect your notes with external services and tools
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {/* Connected Integrations */}
      {connectedIntegrations.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Connected ({connectedIntegrations.length})
          </h4>
          <div className="grid gap-4 md:grid-cols-2">
            {connectedIntegrations.map((integration) => (
              <Card key={integration.id} className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {integration.icon}
                      <div>
                        <CardTitle className="text-sm">{integration.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {integration.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getCategoryColor(integration.category)}>
                        {integration.category}
                      </Badge>
                      <Switch
                        checked={integration.connected}
                        onCheckedChange={() => handleToggleIntegration(integration.id)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm">
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Integrations */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Available ({availableIntegrations.length})
        </h4>
        <div className="grid gap-4 md:grid-cols-2">
          {availableIntegrations.map((integration) => (
            <Card key={integration.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {integration.icon}
                    <div>
                      <CardTitle className="text-sm">{integration.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {integration.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getCategoryColor(integration.category)}>
                      {integration.category}
                    </Badge>
                    <Switch
                      checked={integration.connected}
                      onCheckedChange={() => handleToggleIntegration(integration.id)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleToggleIntegration(integration.id)}
                  >
                    Connect
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleRemoveIntegration(integration.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Custom Integration */}
      {showAddForm && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Add Custom Integration</CardTitle>
            <CardDescription>
              Create a custom integration for your specific needs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="integration-name">Integration Name</Label>
              <Input
                id="integration-name"
                placeholder="Enter integration name"
                value={newIntegration}
                onChange={(e) => setNewIntegration(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={handleAddIntegration} disabled={!newIntegration.trim()}>
                Add Integration
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NoteIntegrations;