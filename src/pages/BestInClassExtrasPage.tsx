import HillChartDisplay from '@/components/extras/HillChartDisplay';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    BarChart3,
    Bookmark,
    Bot,
    Brain,
    Code,
    Download,
    Eye,
    FileText,
    Globe,
    Lightbulb,
    MessageSquare,
    Palette,
    Play,
    Plus,
    Rocket,
    Settings,
    Share2,
    Shield,
    Sparkles,
    Target,
    TrendingUp,
    Users,
    Workflow,
    Zap
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const BestInClassExtrasPage = () => {
  const [aiInsightsEnabled, setAiInsightsEnabled] = useState(true);
  const [automationRules, setAutomationRules] = useState([
    { id: 1, name: 'Auto-assign based on expertise', active: true, triggers: 12 },
    { id: 2, name: 'Deadline reminder notifications', active: true, triggers: 8 },
    { id: 3, name: 'Sprint burndown alerts', active: false, triggers: 0 }
  ]);
  const [customScript, setCustomScript] = useState('// Write your automation script here\nwhen("task.status").changes.to("Done")\n  .then(notify.team)\n  .and(update.progress);');

  const handleRunAutomation = (id: number) => {
    toast.success(`Automation rule ${id} executed successfully`);
  };

  const handleSaveScript = () => {
    toast.success('Custom automation script saved');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
      <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Best-in-Class Extras
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Advanced features that make this the world's most powerful agile management platform
          </p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          <Sparkles className="w-4 h-4 mr-1" />
          Premium Features
        </Badge>
      </div>
      
      <Tabs defaultValue="ai-insights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="ai-insights" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="interfaces" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Interfaces
          </TabsTrigger>
          <TabsTrigger value="collaboration" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Collaboration
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-insights" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI Project Health Score
                </CardTitle>
                <CardDescription>
                  Real-time analysis of project health using machine learning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Health</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>
                </div>
                <Progress value={92} className="h-3" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Velocity</div>
                    <div className="font-semibold text-green-600">+15% ↗</div>
                  </div>
      <div>
                    <div className="text-muted-foreground">Risk Level</div>
                    <div className="font-semibold text-blue-600">Low</div>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  View Detailed Analysis
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  Smart Recommendations
                </CardTitle>
                <CardDescription>
                  AI-powered suggestions to optimize your workflow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="font-medium text-sm">Resource Optimization</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Consider reassigning 2 tasks from John to Alice to balance workload
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="font-medium text-sm">Sprint Planning</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Based on velocity, you can add 3 more story points to next sprint
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="font-medium text-sm">Risk Mitigation</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Task "API Integration" may need additional time buffer
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-red-600" />
                Predictive Analytics Dashboard
              </CardTitle>
              <CardDescription>
                Machine learning predictions for project outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">94%</div>
                  <div className="text-sm text-muted-foreground">On-time Delivery Probability</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">May 25</div>
                  <div className="text-sm text-muted-foreground">Predicted Completion</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">$2.3K</div>
                  <div className="text-sm text-muted-foreground">Estimated Cost Savings</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <HillChartDisplay />
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-600" />
                Butler Automation Engine
              </CardTitle>
              <CardDescription>
                Intelligent automation that learns from your workflow patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="ai-butler">Enable AI Butler</Label>
                <Switch id="ai-butler" checked={aiInsightsEnabled} onCheckedChange={setAiInsightsEnabled} />
      </div>

      <Separator />
              
              <div className="space-y-3">
                <h4 className="font-semibold">Active Automation Rules</h4>
                {automationRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Switch checked={rule.active} onCheckedChange={() => {}} />
                      <div>
                        <div className="font-medium">{rule.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Triggered {rule.triggers} times this week
                        </div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleRunAutomation(rule.id)}>
                      <Play className="w-4 h-4 mr-1" />
                      Run
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create New Automation Rule
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-green-600" />
                Custom Automation Scripts
              </CardTitle>
              <CardDescription>
                Write custom automation logic with our visual scripting language
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="script">Automation Script</Label>
                <Textarea
                  id="script"
                  value={customScript}
                  onChange={(e) => setCustomScript(e.target.value)}
                  className="font-mono text-sm min-h-[120px]"
                  placeholder="Write your automation script here..."
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveScript}>
                  <Download className="w-4 h-4 mr-2" />
                  Save Script
                </Button>
                <Button variant="outline">
                  <Play className="w-4 h-4 mr-2" />
                  Test Run
                </Button>
                <Button variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Team Velocity</p>
                    <p className="text-2xl font-bold">42 SP</p>
                    <p className="text-xs text-muted-foreground">+12% from last sprint</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Cycle Time</p>
                    <p className="text-2xl font-bold">3.2 days</p>
                    <p className="text-xs text-muted-foreground">-0.8 days improvement</p>
                  </div>
                  <Target className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Quality Score</p>
                    <p className="text-2xl font-bold">94%</p>
                    <p className="text-xs text-muted-foreground">2% above target</p>
                  </div>
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Burndown Rate</p>
                    <p className="text-2xl font-bold">85%</p>
                    <p className="text-xs text-muted-foreground">On track for sprint goal</p>
                  </div>
                  <Rocket className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Advanced Performance Metrics</CardTitle>
              <CardDescription>
                Deep insights into team performance and project health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Sprint Completion Rate</span>
                    <span className="text-sm text-muted-foreground">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Code Review Efficiency</span>
                    <span className="text-sm text-muted-foreground">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
      
      <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Technical Debt Ratio</span>
                    <span className="text-sm text-muted-foreground">15%</span>
                  </div>
                  <Progress value={15} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interfaces" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-pink-600" />
                Custom Interface Designer
              </CardTitle>
              <CardDescription>
                Create personalized dashboards and views for different team roles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer transition-colors">
                  <CardContent className="p-6 text-center">
                    <Plus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Create New Interface</p>
                    <p className="text-xs text-muted-foreground">Drag & drop builder</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Developer Dashboard</h4>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Code metrics & PR status</p>
                    <Button size="sm" variant="outline" className="w-full">
                      <Settings className="w-4 h-4 mr-1" />
                      Customize
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Manager View</h4>
                      <Badge variant="outline">Draft</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">High-level project overview</p>
                    <Button size="sm" variant="outline" className="w-full">
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                  </CardContent>
                </Card>
      </div>

      <Separator />

      <div>
                <h4 className="font-semibold mb-3">Interface Templates</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Analytics Dashboard</span>
                    </div>
                    <Button size="sm" variant="ghost">Use Template</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Team Overview</span>
                    </div>
                    <Button size="sm" variant="ghost">Use Template</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Smart Notifications
                </CardTitle>
                <CardDescription>
                  AI-powered notification system that learns your preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Priority-based filtering</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Smart digest emails</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Real-time mentions</Label>
                    <Switch />
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Advanced Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Team Collaboration Hub
                </CardTitle>
                <CardDescription>
                  Centralized space for team communication and knowledge sharing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm">5 team members online</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm">3 active discussions</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-sm">12 shared documents</span>
                  </div>
                </div>
                <Button className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Open Team Chat
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Knowledge Management System
              </CardTitle>
              <CardDescription>
                Intelligent documentation and knowledge base with AI-powered search
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-semibold">Documentation</h4>
                  <p className="text-sm text-muted-foreground">Auto-generated docs</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <Bookmark className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-semibold">Best Practices</h4>
                  <p className="text-sm text-muted-foreground">Team knowledge base</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <Brain className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-semibold">AI Search</h4>
                  <p className="text-sm text-muted-foreground">Semantic search</p>
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
                  <Code className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold mb-1">GitHub</h4>
                <p className="text-sm text-muted-foreground mb-3">Connected</p>
                <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold mb-1">Slack</h4>
                <p className="text-sm text-muted-foreground mb-3">Connected</p>
                <Badge variant="default" className="bg-blue-100 text-blue-800">Active</Badge>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-gray-300 hover:border-purple-400 cursor-pointer transition-colors">
              <CardContent className="p-6 text-center">
                <Plus className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <h4 className="font-semibold mb-1">Add Integration</h4>
                <p className="text-sm text-muted-foreground">Connect more tools</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>API & Webhooks</CardTitle>
              <CardDescription>
                Powerful API access and webhook system for custom integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="api-key">API Key</Label>
                  <div className="flex gap-2 mt-1">
                    <Input id="api-key" value="sk-proj-..." readOnly className="font-mono" />
                    <Button size="sm" variant="outline">Copy</Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input id="webhook-url" placeholder="https://your-app.com/webhook" />
                    <Button size="sm">Save</Button>
                  </div>
                </div>
      </div>
      
              <div className="flex gap-2">
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  API Documentation
                </Button>
                <Button variant="outline">
                  <Code className="w-4 h-4 mr-2" />
                  SDK Downloads
                </Button>
                <Button variant="outline">
                  <Workflow className="w-4 h-4 mr-2" />
                  Webhook Tester
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BestInClassExtrasPage;

