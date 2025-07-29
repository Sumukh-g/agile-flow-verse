import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFeatures } from '@/hooks/useFeatures';
import {
    Activity,
    Brain,
    CheckCircle,
    CreditCard,
    Crown,
    Database,
    Shield,
    Star,
    Users,
    Zap
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface Feature {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'basic' | 'pro' | 'enterprise';
  icon: React.ReactNode;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  sku: 'basic' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

const SettingsPage: React.FC = () => {
  const { features: apiFeatures, isLoading, refetch } = useFeatures();
  
  const [tenant, setTenant] = useState<Tenant>({
    id: 'tenant-123',
    name: 'Acme Corp',
    slug: 'acme-corp',
    sku: 'pro',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  });

  const [features, setFeatures] = useState<Feature[]>([
    {
      key: 'wbs_gantt',
      name: 'WBS & Gantt Charts',
      description: 'Create work breakdown structures and Gantt charts for project planning',
      enabled: true,
      category: 'basic',
      icon: <Activity className="w-4 h-4" />
    },
    {
      key: 'risk_register',
      name: 'Risk Register',
      description: 'Track and manage project risks with advanced risk assessment tools',
      enabled: true,
      category: 'pro',
      icon: <Shield className="w-4 h-4" />
    },
    {
      key: 'ai_insights',
      name: 'AI Insights',
      description: 'Get AI-powered project insights and recommendations',
      enabled: false,
      category: 'enterprise',
      icon: <Brain className="w-4 h-4" />
    },
    {
      key: 'advanced_analytics',
      name: 'Advanced Analytics',
      description: 'Deep dive analytics with custom dashboards and reporting',
      enabled: false,
      category: 'enterprise',
      icon: <Database className="w-4 h-4" />
    },
    {
      key: 'custom_integrations',
      name: 'Custom Integrations',
      description: 'Build custom integrations with your existing tools and APIs',
      enabled: false,
      category: 'enterprise',
      icon: <Zap className="w-4 h-4" />
    },
    {
      key: 'priority_support',
      name: 'Priority Support',
      description: 'Get priority support with dedicated account management',
      enabled: false,
      category: 'enterprise',
      icon: <Star className="w-4 h-4" />
    }
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync features with API data when it loads
  React.useEffect(() => {
    if (apiFeatures.length > 0) {
      setFeatures(prev => 
        prev.map(feature => {
          const apiFeature = apiFeatures.find(af => af.key === feature.key);
          return apiFeature ? { ...feature, enabled: apiFeature.enabled } : feature;
        })
      );
    }
  }, [apiFeatures]);

  const handleFeatureToggle = (featureKey: string, enabled: boolean) => {
    setFeatures(prev => 
      prev.map(feature => 
        feature.key === featureKey 
          ? { ...feature, enabled }
          : feature
      )
    );
    setHasChanges(true);
  };

  const handleSaveFeatures = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would call the admin API
      const response = await fetch(`/api/admin/tenants/${tenant.id}/features`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          features: features.map(f => ({
            key: f.key,
            enabled: f.enabled
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update features');
      }

      toast.success('Features updated successfully');
      setHasChanges(false);
      
      // Refetch features to sync with server
      await refetch();
    } catch (error) {
      console.error('Error updating features:', error);
      toast.error('Failed to update features');
    } finally {
      setIsSaving(false);
    }
  };

  const getSkuColor = (sku: string) => {
    switch (sku) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pro':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'basic':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSkuIcon = (sku: string) => {
    switch (sku) {
      case 'enterprise':
        return <Crown className="w-4 h-4" />;
      case 'pro':
        return <Star className="w-4 h-4" />;
      case 'basic':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account and workspace settings</p>
      </div>

      <Tabs defaultValue="plan-features" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="plan-features">Plan & Features</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="plan-features" className="space-y-6">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Current Plan</span>
              </CardTitle>
              <CardDescription>
                Your current subscription plan and available features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getSkuIcon(tenant.sku)}
                  <div>
                    <h3 className="font-semibold capitalize">{tenant.sku} Plan</h3>
                    <p className="text-sm text-gray-600">Active subscription</p>
                  </div>
                </div>
                <Badge className={getSkuColor(tenant.sku)}>
                  {tenant.sku.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Feature Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Feature Management</span>
              </CardTitle>
              <CardDescription>
                Enable or disable features for your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {features.map((feature) => (
                  <div key={feature.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-gray-500">
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{feature.name}</h4>
                          <Badge 
                            variant={feature.category === 'enterprise' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {feature.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={feature.enabled}
                        onCheckedChange={(enabled) => handleFeatureToggle(feature.key, enabled)}
                        disabled={isSaving}
                      />
                      {feature.enabled && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {hasChanges && (
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      You have unsaved changes
                    </p>
                    <Button 
                      onClick={handleSaveFeatures}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Usage Statistics</span>
              </CardTitle>
              <CardDescription>
                Monitor your feature usage and limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Team Members</span>
                  </div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-sm text-gray-600">of 25 allowed</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Database className="w-4 h-4 text-green-500" />
                    <span className="font-medium">Projects</span>
                  </div>
                  <p className="text-2xl font-bold">47</p>
                  <p className="text-sm text-gray-600">unlimited</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-4 h-4 text-purple-500" />
                    <span className="font-medium">Automation Runs</span>
                  </div>
                  <p className="text-2xl font-bold">1,247</p>
                  <p className="text-sm text-gray-600">of 5,000 this month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Profile settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Security settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>
                Manage your billing information and subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Billing settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage; 