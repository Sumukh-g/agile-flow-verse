import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    AlertTriangle,
    BarChart3,
    Brain,
    Calendar,
    CheckCircle2,
    Clock,
    Code,
    Copy,
    Download,
    Edit,
    Eye,
    FileText,
    GitBranch,
    Link as LinkIcon,
    Mail,
    MessageSquare,
    Pause,
    Play,
    Plus,
    RefreshCw,
    Sparkles,
    Target,
    TrendingUp,
    Workflow,
    Zap
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  status: 'active' | 'paused' | 'draft';
  executions: number;
  lastRun: string;
  successRate: number;
  category: 'workflow' | 'notification' | 'integration' | 'ai';
}

const AutomationsPage: React.FC = () => {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Auto-assign based on expertise',
      description: 'Automatically assign tasks to team members based on their skills and workload',
      trigger: 'Task created with specific tags',
      action: 'Assign to best-fit team member',
      status: 'active',
      executions: 156,
      lastRun: '2 hours ago',
      successRate: 94,
      category: 'ai'
    },
    {
      id: '2',
      name: 'Sprint burndown alerts',
      description: 'Send alerts when sprint progress falls behind schedule',
      trigger: 'Daily at 9 AM',
      action: 'Send Slack notification to team',
      status: 'active',
      executions: 23,
      lastRun: '1 day ago',
      successRate: 100,
      category: 'notification'
    },
    {
      id: '3',
      name: 'Code review reminders',
      description: 'Remind reviewers about pending pull requests',
      trigger: 'PR open for 24+ hours',
      action: 'Send email reminder',
      status: 'paused',
      executions: 89,
      lastRun: '3 days ago',
      successRate: 87,
      category: 'workflow'
    },
    {
      id: '4',
      name: 'Jira sync integration',
      description: 'Sync task status changes with Jira tickets',
      trigger: 'Task status changed',
      action: 'Update Jira ticket status',
      status: 'active',
      executions: 342,
      lastRun: '15 minutes ago',
      successRate: 98,
      category: 'integration'
    }
  ]);

  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDescription, setNewRuleDescription] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const handleToggleRule = (id: string) => {
    setAutomationRules(prev => prev.map(rule => 
      rule.id === id 
        ? { ...rule, status: rule.status === 'active' ? 'paused' : 'active' }
        : rule
    ));
    toast.success('Automation rule updated');
  };

  const handleRunRule = (id: string) => {
    const rule = automationRules.find(r => r.id === id);
    toast.success(`Running automation: ${rule?.name}`);
  };

  const handleCreateRule = () => {
    if (!newRuleName.trim()) {
      toast.error('Please enter a rule name');
      return;
    }

    const newRule: AutomationRule = {
      id: Date.now().toString(),
      name: newRuleName,
      description: newRuleDescription,
      trigger: 'Manual trigger',
      action: 'Custom action',
      status: 'draft',
      executions: 0,
      lastRun: 'Never',
      successRate: 0,
      category: 'workflow'
    };

    setAutomationRules(prev => [newRule, ...prev]);
    setNewRuleName('');
    setNewRuleDescription('');
    setIsCreating(false);
    toast.success('Automation rule created');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ai': return <Brain className="w-4 h-4" />;
      case 'workflow': return <Workflow className="w-4 h-4" />;
      case 'notification': return <MessageSquare className="w-4 h-4" />;
      case 'integration': return <LinkIcon className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ai': return 'bg-purple-100 text-purple-800';
      case 'workflow': return 'bg-blue-100 text-blue-800';
      case 'notification': return 'bg-green-100 text-green-800';
      case 'integration': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Zap className="mr-3 h-7 w-7 text-primary" />
            Automation Center
        </h1>
          <p className="text-muted-foreground mt-1">
            Intelligent automation that adapts to your workflow patterns
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Import Rules
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Automation
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Active Rules</p>
                    <p className="text-2xl font-bold">{automationRules.filter(r => r.status === 'active').length}</p>
                    <p className="text-xs text-muted-foreground">+2 this week</p>
                  </div>
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Total Executions</p>
                    <p className="text-2xl font-bold">{automationRules.reduce((sum, rule) => sum + rule.executions, 0)}</p>
                    <p className="text-xs text-muted-foreground">+15% from last month</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Success Rate</p>
                    <p className="text-2xl font-bold">94%</p>
                    <p className="text-xs text-muted-foreground">Above target</p>
                  </div>
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Time Saved</p>
                    <p className="text-2xl font-bold">24h</p>
                    <p className="text-xs text-muted-foreground">This week</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Suggestions */}
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                AI-Powered Automation Suggestions
              </CardTitle>
          <CardDescription>
                Based on your workflow patterns, here are some automation opportunities
          </CardDescription>
        </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-sm">Smart Task Prioritization</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Automatically prioritize tasks based on deadlines, dependencies, and team capacity
                  </p>
                  <Button size="sm" variant="outline">Create Rule</Button>
                </div>
                
                <div className="p-4 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-sm">Daily Standup Prep</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Generate daily standup summaries with completed tasks and blockers
                  </p>
                  <Button size="sm" variant="outline">Create Rule</Button>
                </div>
          </div>
        </CardContent>
      </Card>

          {/* Recent Activity */}
      <Card>
        <CardHeader>
              <CardTitle>Recent Automation Activity</CardTitle>
        </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {automationRules.slice(0, 5).map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(rule.category)}
          <div>
                        <div className="font-medium text-sm">{rule.name}</div>
                        <div className="text-xs text-muted-foreground">Last run: {rule.lastRun}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getStatusColor(rule.status)}>
                        {rule.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{rule.executions} runs</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          {isCreating && (
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle>Create New Automation Rule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="rule-name">Rule Name</Label>
                    <Input
                      id="rule-name"
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                      placeholder="Enter rule name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rule-category">Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="workflow">Workflow</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                        <SelectItem value="integration">Integration</SelectItem>
                        <SelectItem value="ai">AI-Powered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rule-description">Description</Label>
                  <Textarea
                    id="rule-description"
                    value={newRuleDescription}
                    onChange={(e) => setNewRuleDescription(e.target.value)}
                    placeholder="Describe what this automation does"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateRule}>Create Rule</Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {automationRules.map((rule) => (
              <Card key={rule.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                        {getCategoryIcon(rule.category)}
                        <div>
                          <h3 className="font-semibold">{rule.name}</h3>
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <div className="font-medium">{rule.executions} executions</div>
                        <div className="text-muted-foreground">{rule.successRate}% success rate</div>
            </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getCategoryColor(rule.category)}>
                          {rule.category}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(rule.status)}>
                          {rule.status}
                        </Badge>
          </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleRule(rule.id)}
                        >
                          {rule.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRunRule(rule.id)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid gap-2 md:grid-cols-2 text-sm">
          <div>
                      <span className="font-medium">Trigger: </span>
                      <span className="text-muted-foreground">{rule.trigger}</span>
                    </div>
              <div>
                      <span className="font-medium">Action: </span>
                      <span className="text-muted-foreground">{rule.action}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="w-5 h-5 text-blue-600" />
                Visual Automation Builder
              </CardTitle>
              <CardDescription>
                Drag and drop interface to create complex automation workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <GitBranch className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Visual Workflow Builder</h3>
                  <p className="text-muted-foreground mb-4">
                    Create sophisticated automation workflows with our drag-and-drop interface
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Start Building
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Templates</CardTitle>
                <CardDescription>Pre-built automation templates for common scenarios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="font-medium">Sprint Planning Automation</div>
                  <div className="text-sm text-muted-foreground">Automatically create sprint tasks from backlog</div>
                </div>
                <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="font-medium">Bug Triage Workflow</div>
                  <div className="text-sm text-muted-foreground">Auto-assign bugs based on severity and component</div>
                </div>
                <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="font-medium">Release Pipeline</div>
                  <div className="text-sm text-muted-foreground">Automated testing and deployment workflow</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Scripts</CardTitle>
                <CardDescription>Write custom automation logic with JavaScript</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="// Write your custom automation script here
function onTaskCreated(task) {
  if (task.priority === 'high') {
    notify.team('High priority task created');
  }
}"
                  className="font-mono text-sm min-h-[120px]"
                />
                <div className="flex gap-2">
                  <Button size="sm">
                    <Play className="w-4 h-4 mr-1" />
                    Test Script
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Automation Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Success Rate</span>
                      <span className="text-sm text-muted-foreground">94%</span>
                    </div>
                    <Progress value={94} className="h-2" />
                  </div>
                  
              <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Execution Speed</span>
                      <span className="text-sm text-muted-foreground">1.2s avg</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Error Rate</span>
                      <span className="text-sm text-muted-foreground">2.1%</span>
                    </div>
                    <Progress value={21} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">24.5 hours</div>
                  <div className="text-sm text-muted-foreground mb-4">Saved this week</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Daily Average</div>
                      <div className="text-muted-foreground">3.5 hours</div>
                    </div>
                    <div>
                      <div className="font-medium">Monthly Total</div>
                      <div className="text-muted-foreground">98 hours</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Automation Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="font-semibold">Most Used</div>
                  <div className="text-sm text-muted-foreground">Auto-assign tasks</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <div className="font-semibold">Highest Success</div>
                  <div className="text-sm text-muted-foreground">Sprint alerts (100%)</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <div className="font-semibold">Needs Attention</div>
                  <div className="text-sm text-muted-foreground">Code review reminders</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-600 rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold mb-1">Slack</h4>
                <p className="text-sm text-muted-foreground mb-3">Send notifications and updates</p>
                <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold mb-1">GitHub</h4>
                <p className="text-sm text-muted-foreground mb-3">Sync with repositories and PRs</p>
                <Badge variant="default" className="bg-blue-100 text-blue-800">Connected</Badge>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 bg-purple-50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold mb-1">Jira</h4>
                <p className="text-sm text-muted-foreground mb-3">Sync issues and project data</p>
                <Badge variant="default" className="bg-purple-100 text-purple-800">Connected</Badge>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-orange-600 rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold mb-1">Email</h4>
                <p className="text-sm text-muted-foreground mb-3">Send automated email notifications</p>
                <Badge variant="default" className="bg-orange-100 text-orange-800">Connected</Badge>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 bg-gray-50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gray-600 rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
            </div>
                <h4 className="font-semibold mb-1">Google Calendar</h4>
                <p className="text-sm text-muted-foreground mb-3">Sync deadlines and meetings</p>
                <Badge variant="outline">Not Connected</Badge>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer transition-colors">
              <CardContent className="p-6 text-center">
                <Plus className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <h4 className="font-semibold mb-1">Add Integration</h4>
                <p className="text-sm text-muted-foreground">Connect more tools</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>
                Set up webhooks to trigger automations from external systems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input id="webhook-url" value="https://api.agileflow.com/webhooks/abc123" readOnly className="font-mono" />
                    <Button size="sm" variant="outline">Copy</Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="webhook-secret">Secret Key</Label>
                  <div className="flex gap-2 mt-1">
                    <Input id="webhook-secret" value="sk_live_..." readOnly className="font-mono" />
                    <Button size="sm" variant="outline">Regenerate</Button>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Documentation
                </Button>
                <Button variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  Test Webhook
                </Button>
                <Button variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Logs
            </Button>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutomationsPage;
