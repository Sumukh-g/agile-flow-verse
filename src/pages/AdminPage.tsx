import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
    Activity,
    AlertTriangle,
    BarChart3,
    Bell,
    CheckCircle,
    Clock,
    CreditCard,
    Database,
    Download,
    Edit,
    Eye,
    EyeOff,
    Globe,
    Key,
    Lock,
    Plus,
    RefreshCw,
    Server,
    Settings,
    Shield,
    Trash2,
    Upload,
    Users,
    Zap
} from 'lucide-react';
import React, { useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  lastActive: string;
  projects: number;
  tasks: number;
}

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

const AdminPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [showApiKey, setShowApiKey] = useState(false);

  // Mock data - in real app, this would come from API
  const [users] = useState<User[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@company.com',
      role: 'admin',
      status: 'active',
      lastActive: '2 minutes ago',
      projects: 12,
      tasks: 45
    },
    {
      id: '2',
      name: 'Sarah Wilson',
      email: 'sarah@company.com',
      role: 'manager',
      status: 'active',
      lastActive: '1 hour ago',
      projects: 8,
      tasks: 32
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@company.com',
      role: 'member',
      status: 'inactive',
      lastActive: '3 days ago',
      projects: 3,
      tasks: 18
    },
    {
      id: '4',
      name: 'Emily Chen',
      email: 'emily@company.com',
      role: 'viewer',
      status: 'pending',
      lastActive: 'Never',
      projects: 0,
      tasks: 0
    }
  ]);

  const systemMetrics: SystemMetric[] = [
    { name: 'CPU Usage', value: 45, unit: '%', status: 'healthy', trend: 'stable' },
    { name: 'Memory Usage', value: 72, unit: '%', status: 'warning', trend: 'up' },
    { name: 'Disk Usage', value: 34, unit: '%', status: 'healthy', trend: 'down' },
    { name: 'API Response Time', value: 142, unit: 'ms', status: 'healthy', trend: 'stable' },
    { name: 'Database Connections', value: 23, unit: '', status: 'healthy', trend: 'stable' },
    { name: 'Active Sessions', value: 156, unit: '', status: 'healthy', trend: 'up' }
  ];

  const workspaceStats = {
    totalUsers: 24,
    activeUsers: 18,
    totalProjects: 45,
    activeProjects: 32,
    totalTasks: 1247,
    completedTasks: 892,
    storageUsed: 2.4,
    storageLimit: 10,
    apiCalls: 12847,
    apiLimit: 50000
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'member': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleUserAction = (action: string, userId: string) => {
    toast({
      title: "Action Completed",
      description: `${action} action performed for user ${userId}`,
    });
  };

  const handleSystemAction = (action: string) => {
    toast({
      title: "System Action",
      description: `${action} completed successfully`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Shield className="mr-3 h-7 w-7 text-primary" />
          Admin Panel
        </h1>
          <p className="text-muted-foreground mt-1">
            Manage your workspace, users, and system settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSystemAction('System backup')}>
            <Download className="h-4 w-4 mr-2" />
            Backup
          </Button>
          <Button onClick={() => handleSystemAction('System refresh')}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Workspace Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{workspaceStats.totalUsers}</p>
                    <p className="text-xs text-green-600">+2 this week</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                    <p className="text-2xl font-bold">{workspaceStats.activeProjects}</p>
                    <p className="text-xs text-blue-600">of {workspaceStats.totalProjects} total</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Task Completion</p>
                    <p className="text-2xl font-bold">{Math.round((workspaceStats.completedTasks / workspaceStats.totalTasks) * 100)}%</p>
                    <p className="text-xs text-green-600">{workspaceStats.completedTasks} of {workspaceStats.totalTasks}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
                    <p className="text-2xl font-bold">{workspaceStats.storageUsed}GB</p>
                    <p className="text-xs text-muted-foreground">of {workspaceStats.storageLimit}GB limit</p>
                  </div>
                  <Database className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                System Health
              </CardTitle>
              <CardDescription>Real-time system performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systemMetrics.map((metric, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{metric.name}</span>
                      <span className={`text-sm ${getMetricStatusColor(metric.status)}`}>
                        {metric.value}{metric.unit}
                      </span>
                    </div>
                    <Progress 
                      value={metric.name.includes('Time') ? (metric.value / 500) * 100 : metric.value} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm">System backup completed successfully</p>
                    <p className="text-xs text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm">New user Sarah Wilson added to workspace</p>
                    <p className="text-xs text-muted-foreground">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <div className="flex-1">
                    <p className="text-sm">Memory usage exceeded 70% threshold</p>
                    <p className="text-xs text-muted-foreground">3 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Settings className="h-4 w-4 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm">Security settings updated</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">User Management</h3>
              <p className="text-sm text-muted-foreground">Manage workspace users and their permissions</p>
            </div>
            <Button onClick={() => handleUserAction('Invite user', 'new')}>
              <Plus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">User</th>
                      <th className="text-left p-4 font-medium">Role</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Last Active</th>
                      <th className="text-left p-4 font-medium">Projects</th>
                      <th className="text-left p-4 font-medium">Tasks</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{user.lastActive}</td>
                        <td className="p-4 text-sm">{user.projects}</td>
                        <td className="p-4 text-sm">{user.tasks}</td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUserAction('Edit user', user.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUserAction('Delete user', user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="mr-2 h-5 w-5" />
                  Authentication Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Single Sign-On (SSO)</Label>
                    <p className="text-sm text-muted-foreground">Enable SAML/OAuth integration</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                  </div>
                  <Input className="w-20" defaultValue="30" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="mr-2 h-5 w-5" />
                  API Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>API Key</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input 
                      type={showApiKey ? "text" : "password"}
                      value="sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"
                      readOnly
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New
                  </Button>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Rate Limiting</Label>
                  <div className="text-sm text-muted-foreground">
                    Current: {workspaceStats.apiCalls.toLocaleString()} / {workspaceStats.apiLimit.toLocaleString()} calls this month
                  </div>
                  <Progress value={(workspaceStats.apiCalls / workspaceStats.apiLimit) * 100} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Security Audit Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Successful login</p>
                      <p className="text-xs text-muted-foreground">john@company.com from 192.168.1.100</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">2 min ago</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium">Failed login attempt</p>
                      <p className="text-xs text-muted-foreground">unknown@domain.com from 203.0.113.1</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">1 hour ago</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Security settings updated</p>
                      <p className="text-xs text-muted-foreground">2FA enabled by admin@company.com</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">1 day ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Professional Plan</h3>
                    <p className="text-sm text-muted-foreground">$29/month per user</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Users</span>
                    <span>{workspaceStats.totalUsers} / 50</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Storage</span>
                    <span>{workspaceStats.storageUsed}GB / {workspaceStats.storageLimit}GB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>API Calls</span>
                    <span>{workspaceStats.apiCalls.toLocaleString()} / {workspaceStats.apiLimit.toLocaleString()}</span>
                  </div>
                </div>
                <Button className="w-full">Upgrade Plan</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Storage Usage</span>
                      <span>{Math.round((workspaceStats.storageUsed / workspaceStats.storageLimit) * 100)}%</span>
                    </div>
                    <Progress value={(workspaceStats.storageUsed / workspaceStats.storageLimit) * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>API Usage</span>
                      <span>{Math.round((workspaceStats.apiCalls / workspaceStats.apiLimit) * 100)}%</span>
                    </div>
                    <Progress value={(workspaceStats.apiCalls / workspaceStats.apiLimit) * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>User Seats</span>
                      <span>{Math.round((workspaceStats.totalUsers / 50) * 100)}%</span>
                    </div>
                    <Progress value={(workspaceStats.totalUsers / 50) * 100} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">December 2024</p>
                    <p className="text-sm text-muted-foreground">Professional Plan - 24 users</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">$696.00</p>
                    <Badge className="bg-green-100 text-green-800">Paid</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">November 2024</p>
                    <p className="text-sm text-muted-foreground">Professional Plan - 22 users</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">$638.00</p>
                    <Badge className="bg-green-100 text-green-800">Paid</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">October 2024</p>
                    <p className="text-sm text-muted-foreground">Professional Plan - 20 users</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">$580.00</p>
                    <Badge className="bg-green-100 text-green-800">Paid</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="mr-2 h-5 w-5" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Version</span>
                  <span className="text-sm font-medium">v2.4.1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <span className="text-sm font-medium">15 days, 4 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Backup</span>
                  <span className="text-sm font-medium">2 hours ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Database Size</span>
                  <span className="text-sm font-medium">1.2 GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Connections</span>
                  <span className="text-sm font-medium">23</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5" />
                  System Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleSystemAction('System restart')}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Restart System
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleSystemAction('Database backup')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Create Backup
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleSystemAction('Cache clear')}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Cache
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleSystemAction('System update')}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Check Updates
                </Button>
              </CardContent>
            </Card>
          </div>

      <Card>
        <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Database Management
              </CardTitle>
        </CardHeader>
        <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-medium">Total Records</h4>
                  <p className="text-2xl font-bold text-blue-600">45,231</p>
                  <p className="text-xs text-muted-foreground">Across all tables</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-medium">Query Performance</h4>
                  <p className="text-2xl font-bold text-green-600">98.5%</p>
                  <p className="text-xs text-muted-foreground">Avg success rate</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-medium">Response Time</h4>
                  <p className="text-2xl font-bold text-yellow-600">142ms</p>
                  <p className="text-xs text-muted-foreground">Average query time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Workspace Name</Label>
                  <Input defaultValue="Acme Corporation" />
                </div>
                <div className="space-y-2">
                  <Label>Time Zone</Label>
                  <Input defaultValue="UTC-8 (Pacific Standard Time)" />
                </div>
                <div className="space-y-2">
                  <Label>Default Language</Label>
                  <Input defaultValue="English (US)" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Temporarily disable access</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">System alerts and updates</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Slack Integration</Label>
                    <p className="text-sm text-muted-foreground">Send alerts to Slack</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Alerts</Label>
                    <p className="text-sm text-muted-foreground">Critical system alerts only</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-red-900">Reset All Data</h4>
                  <p className="text-sm text-red-700">Permanently delete all workspace data</p>
                </div>
                <Button variant="destructive" size="sm">
                  Reset Workspace
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-red-900">Delete Workspace</h4>
                  <p className="text-sm text-red-700">Permanently delete this workspace</p>
                </div>
                <Button variant="destructive" size="sm">
                  Delete Workspace
                </Button>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
