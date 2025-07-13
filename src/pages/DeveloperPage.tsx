import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    AlertCircle,
    BarChart3,
    Book,
    CheckCircle2,
    Clock,
    Code,
    Copy,
    Database,
    Download,
    ExternalLink,
    Eye,
    FileText,
    Github,
    Globe,
    Key,
    Lightbulb,
    Play,
    Send,
    Settings,
    Shield,
    Terminal,
    Webhook,
    Zap
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  category: string;
}

interface SDKLanguage {
  name: string;
  version: string;
  downloads: string;
  icon: React.ReactNode;
  installCommand: string;
}

const DeveloperPage: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookPayload, setWebhookPayload] = useState('{\n  "event": "task.created",\n  "data": {\n    "id": "task_123",\n    "title": "New Task",\n    "status": "todo"\n  }\n}');
  const [activeTab, setActiveTab] = useState('overview');

  const apiEndpoints: APIEndpoint[] = [
    { method: 'GET', path: '/api/v1/projects', description: 'List all projects', category: 'Projects' },
    { method: 'POST', path: '/api/v1/projects', description: 'Create a new project', category: 'Projects' },
    { method: 'GET', path: '/api/v1/projects/{id}', description: 'Get project details', category: 'Projects' },
    { method: 'PUT', path: '/api/v1/projects/{id}', description: 'Update project', category: 'Projects' },
    { method: 'DELETE', path: '/api/v1/projects/{id}', description: 'Delete project', category: 'Projects' },
    { method: 'GET', path: '/api/v1/tasks', description: 'List all tasks', category: 'Tasks' },
    { method: 'POST', path: '/api/v1/tasks', description: 'Create a new task', category: 'Tasks' },
    { method: 'GET', path: '/api/v1/tasks/{id}', description: 'Get task details', category: 'Tasks' },
    { method: 'PUT', path: '/api/v1/tasks/{id}', description: 'Update task', category: 'Tasks' },
    { method: 'DELETE', path: '/api/v1/tasks/{id}', description: 'Delete task', category: 'Tasks' },
    { method: 'GET', path: '/api/v1/users', description: 'List team members', category: 'Users' },
    { method: 'GET', path: '/api/v1/analytics', description: 'Get analytics data', category: 'Analytics' }
  ];

  const sdkLanguages: SDKLanguage[] = [
    {
      name: 'JavaScript/Node.js',
      version: 'v2.1.0',
      downloads: '15K+',
      icon: <Code className="w-6 h-6" />,
      installCommand: 'npm install agile-flow-sdk'
    },
    {
      name: 'Python',
      version: 'v1.8.2',
      downloads: '12K+',
      icon: <Code className="w-6 h-6" />,
      installCommand: 'pip install agile-flow-python'
    },
    {
      name: 'PHP',
      version: 'v1.5.1',
      downloads: '8K+',
      icon: <Code className="w-6 h-6" />,
      installCommand: 'composer require agile-flow/php-sdk'
    },
    {
      name: 'Ruby',
      version: 'v1.4.0',
      downloads: '5K+',
      icon: <Code className="w-6 h-6" />,
      installCommand: 'gem install agile_flow'
    },
    {
      name: 'Go',
      version: 'v1.2.3',
      downloads: '3K+',
      icon: <Code className="w-6 h-6" />,
      installCommand: 'go get github.com/agile-flow/go-sdk'
    },
    {
      name: 'Java',
      version: 'v1.1.0',
      downloads: '2K+',
      icon: <Code className="w-6 h-6" />,
      installCommand: 'implementation "com.agileflow:java-sdk:1.1.0"'
    }
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-orange-100 text-orange-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const handleTestWebhook = () => {
    if (!webhookUrl) {
      toast.error('Please enter a webhook URL');
      return;
    }
    toast.success('Webhook test sent successfully');
  };

  const codeExamples = {
    javascript: `// Initialize the SDK
const AgileFlow = require('agile-flow-sdk');
const client = new AgileFlow('your-api-key');

// Create a new task
const task = await client.tasks.create({
  title: 'New Task',
  description: 'Task description',
  projectId: 'project_123',
  assigneeId: 'user_456'
});

console.log('Task created:', task);`,
    
    python: `# Initialize the SDK
from agile_flow import AgileFlowClient

client = AgileFlowClient(api_key='your-api-key')

# Create a new task
task = client.tasks.create(
    title='New Task',
    description='Task description',
    project_id='project_123',
    assignee_id='user_456'
)

print(f'Task created: {task}')`,
    
    curl: `# Create a new task
curl -X POST https://api.agileflow.com/v1/tasks \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "New Task",
    "description": "Task description",
    "projectId": "project_123",
    "assigneeId": "user_456"
  }'`
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Code className="mr-3 h-7 w-7 text-primary" />
            Developer Portal
        </h1>
          <p className="text-muted-foreground mt-1">
            Build powerful integrations with our comprehensive API and tools
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Github className="w-4 h-4 mr-2" />
            GitHub
          </Button>
          <Button>
            <Book className="w-4 h-4 mr-2" />
            Documentation
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="api-reference">API Reference</TabsTrigger>
          <TabsTrigger value="sdks">SDKs</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Start */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Quick Start Guide
              </CardTitle>
              <CardDescription>Get up and running with our API in minutes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <span className="font-semibold">Get API Key</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Generate your API key from the settings page</p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <span className="font-semibold">Install SDK</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Choose your preferred language and install our SDK</p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <span className="font-semibold">Make API Call</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Start building with our comprehensive API</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Stats */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">API Endpoints</p>
                    <p className="text-2xl font-bold">{apiEndpoints.length}</p>
                    <p className="text-xs text-muted-foreground">RESTful endpoints</p>
                  </div>
                  <Globe className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">SDK Languages</p>
                    <p className="text-2xl font-bold">{sdkLanguages.length}</p>
                    <p className="text-xs text-muted-foreground">Official SDKs</p>
                  </div>
                  <Code className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Uptime</p>
                    <p className="text-2xl font-bold">99.9%</p>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Response Time</p>
                    <p className="text-2xl font-bold">89ms</p>
                    <p className="text-xs text-muted-foreground">Average</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Code Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Code Examples</CardTitle>
              <CardDescription>Get started with these common use cases</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="javascript" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                </TabsList>
                
                {Object.entries(codeExamples).map(([lang, code]) => (
                  <TabsContent key={lang} value={lang}>
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{code}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2"
                        onClick={() => handleCopyCode(code)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Resources */}
      <Card>
        <CardHeader>
              <CardTitle>Developer Resources</CardTitle>
        </CardHeader>
        <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 border rounded-lg text-center hover:bg-gray-50 cursor-pointer">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-semibold">API Documentation</h4>
                  <p className="text-sm text-muted-foreground">Complete reference guide</p>
                </div>
                <div className="p-4 border rounded-lg text-center hover:bg-gray-50 cursor-pointer">
                  <Book className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-semibold">Tutorials</h4>
                  <p className="text-sm text-muted-foreground">Step-by-step guides</p>
                </div>
                <div className="p-4 border rounded-lg text-center hover:bg-gray-50 cursor-pointer">
                  <Github className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-semibold">Sample Apps</h4>
                  <p className="text-sm text-muted-foreground">Example implementations</p>
                </div>
                <div className="p-4 border rounded-lg text-center hover:bg-gray-50 cursor-pointer">
                  <Lightbulb className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <h4 className="font-semibold">Best Practices</h4>
                  <p className="text-sm text-muted-foreground">Tips and recommendations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-reference" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>API Endpoints</CardTitle>
                  <CardDescription>Browse all available endpoints</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {['Projects', 'Tasks', 'Users', 'Analytics'].map((category) => (
                    <div key={category}>
                      <h4 className="font-semibold text-sm mb-2">{category}</h4>
                      {apiEndpoints
                        .filter(endpoint => endpoint.category === category)
                        .map((endpoint, index) => (
                          <div
                            key={index}
                            className={`p-2 rounded cursor-pointer hover:bg-gray-50 ${
                              selectedEndpoint === endpoint ? 'bg-blue-50 border border-blue-200' : ''
                            }`}
                            onClick={() => setSelectedEndpoint(endpoint)}
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getMethodColor(endpoint.method)}>
                                {endpoint.method}
                              </Badge>
                              <span className="text-sm font-mono">{endpoint.path}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{endpoint.description}</p>
                          </div>
                        ))}
                      <Separator className="my-3" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {selectedEndpoint ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="outline" className={getMethodColor(selectedEndpoint.method)}>
                        {selectedEndpoint.method}
                      </Badge>
                      <span className="font-mono">{selectedEndpoint.path}</span>
                    </CardTitle>
                    <CardDescription>{selectedEndpoint.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">Request</h4>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                        <code>
                          {selectedEndpoint.method} https://api.agileflow.com{selectedEndpoint.path}
                          <br />
                          Authorization: Bearer your-api-key
              <br />
                          Content-Type: application/json
                        </code>
                      </div>
                    </div>

                    {selectedEndpoint.method !== 'GET' && (
                      <div>
                        <h4 className="font-semibold mb-2">Request Body</h4>
                        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                          <code>
                            {JSON.stringify({
                              title: "Example Task",
                              description: "Task description",
                              status: "todo",
                              priority: "medium"
                            }, null, 2)}
                          </code>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold mb-2">Response</h4>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                        <code>
                          {JSON.stringify({
                            id: "task_123",
                            title: "Example Task",
                            description: "Task description",
                            status: "todo",
                            priority: "medium",
                            createdAt: "2024-01-15T10:30:00Z",
                            updatedAt: "2024-01-15T10:30:00Z"
                          }, null, 2)}
                        </code>
                      </div>
                    </div>

                    <Button>
                      <Play className="w-4 h-4 mr-2" />
                      Try it out
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Select an Endpoint</h3>
                    <p className="text-muted-foreground">Choose an endpoint from the left to view its documentation</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sdks" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sdkLanguages.map((sdk) => (
              <Card key={sdk.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {sdk.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{sdk.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{sdk.version}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Download className="w-4 h-4 text-muted-foreground" />
                      <span>{sdk.downloads}</span>
                    </div>
                    <Badge variant="secondary">Official</Badge>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Installation</Label>
                    <div className="mt-1 relative">
                      <code className="block bg-gray-900 text-gray-100 p-3 rounded text-sm">
                        {sdk.installCommand}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-1 right-1"
                        onClick={() => handleCopyCode(sdk.installCommand)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline">
                      <Github className="w-4 h-4 mr-1" />
                      GitHub
                    </Button>
                    <Button size="sm" variant="outline">
                      <FileText className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>SDK Features</CardTitle>
              <CardDescription>All our SDKs include these powerful features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 text-center">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-semibold">Type Safety</h4>
                  <p className="text-sm text-muted-foreground">Full TypeScript support</p>
                </div>
                <div className="p-4 text-center">
                  <Zap className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-semibold">Auto Retry</h4>
                  <p className="text-sm text-muted-foreground">Built-in retry logic</p>
                </div>
                <div className="p-4 text-center">
                  <Database className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-semibold">Caching</h4>
                  <p className="text-sm text-muted-foreground">Intelligent response caching</p>
                </div>
                <div className="p-4 text-center">
                  <Settings className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <h4 className="font-semibold">Configurable</h4>
                  <p className="text-sm text-muted-foreground">Flexible configuration options</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-green-600" />
                  Webhook Tester
                </CardTitle>
                <CardDescription>Test your webhook endpoints with sample payloads</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://your-app.com/webhook"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhook-event">Event Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task.created">Task Created</SelectItem>
                      <SelectItem value="task.updated">Task Updated</SelectItem>
                      <SelectItem value="task.completed">Task Completed</SelectItem>
                      <SelectItem value="project.created">Project Created</SelectItem>
                      <SelectItem value="project.completed">Project Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhook-payload">Payload</Label>
                  <Textarea
                    id="webhook-payload"
                    value={webhookPayload}
                    onChange={(e) => setWebhookPayload(e.target.value)}
                    className="font-mono text-sm min-h-[200px]"
                  />
                </div>

                <Button onClick={handleTestWebhook} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Send Test Webhook
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhook Events</CardTitle>
                <CardDescription>Available webhook events and their payloads</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { event: 'task.created', description: 'Triggered when a new task is created' },
                    { event: 'task.updated', description: 'Triggered when a task is modified' },
                    { event: 'task.completed', description: 'Triggered when a task is marked as complete' },
                    { event: 'project.created', description: 'Triggered when a new project is created' },
                    { event: 'project.completed', description: 'Triggered when a project is completed' },
                    { event: 'user.invited', description: 'Triggered when a user is invited to the workspace' }
                  ].map((webhook) => (
                    <div key={webhook.event} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {webhook.event}
                        </code>
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">{webhook.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Webhook Security</CardTitle>
              <CardDescription>Best practices for securing your webhook endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Signature Verification</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Verify webhook signatures using HMAC-SHA256 with your secret key
                  </p>
                  <code className="text-xs bg-gray-100 p-2 rounded block">
                    X-Signature: sha256=abc123...
                  </code>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Idempotency</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Handle duplicate webhooks using the idempotency key
                  </p>
                  <code className="text-xs bg-gray-100 p-2 rounded block">
                    X-Idempotency-Key: uuid...
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-blue-600" />
                  API Explorer
                </CardTitle>
                <CardDescription>Interactive API testing tool</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <Terminal className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <h4 className="font-semibold mb-2">Interactive API Console</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Test API endpoints directly from your browser
                  </p>
                  <Button>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Console
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-green-600" />
                  API Key Manager
                </CardTitle>
                <CardDescription>Manage your API keys and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Production Key</div>
                      <div className="text-sm text-muted-foreground font-mono">sk_live_••••••••••••••••</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Development Key</div>
                      <div className="text-sm text-muted-foreground font-mono">sk_test_••••••••••••••••</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full" variant="outline">
                  <Key className="w-4 h-4 mr-2" />
                  Generate New Key
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Developer Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 border rounded-lg text-center hover:bg-gray-50 cursor-pointer">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-semibold">Postman Collection</h4>
                  <p className="text-sm text-muted-foreground">Ready-to-use API collection</p>
                </div>
                <div className="p-4 border rounded-lg text-center hover:bg-gray-50 cursor-pointer">
                  <Code className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-semibold">OpenAPI Spec</h4>
                  <p className="text-sm text-muted-foreground">Machine-readable API specification</p>
                </div>
                <div className="p-4 border rounded-lg text-center hover:bg-gray-50 cursor-pointer">
                  <Github className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-semibold">Sample Code</h4>
                  <p className="text-sm text-muted-foreground">Example implementations</p>
                </div>
                <div className="p-4 border rounded-lg text-center hover:bg-gray-50 cursor-pointer">
                  <Webhook className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <h4 className="font-semibold">Webhook Logs</h4>
                  <p className="text-sm text-muted-foreground">Debug webhook deliveries</p>
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
                    <p className="text-sm font-medium text-blue-600">API Requests</p>
                    <p className="text-2xl font-bold">24,847</p>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
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
                    <p className="text-xs text-muted-foreground">+0.3% from last month</p>
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
                    <p className="text-2xl font-bold">89ms</p>
                    <p className="text-xs text-muted-foreground">-12ms improvement</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Error Rate</p>
                    <p className="text-2xl font-bold">0.8%</p>
                    <p className="text-xs text-muted-foreground">-0.2% improvement</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>API Usage by Endpoint</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { endpoint: 'GET /api/v1/tasks', requests: 8247, percentage: 33 },
                  { endpoint: 'POST /api/v1/tasks', requests: 5123, percentage: 21 },
                  { endpoint: 'GET /api/v1/projects', requests: 4891, percentage: 20 },
                  { endpoint: 'PUT /api/v1/tasks/{id}', requests: 3456, percentage: 14 },
                  { endpoint: 'GET /api/v1/users', requests: 3130, percentage: 12 }
                ].map((item) => (
                  <div key={item.endpoint} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-sm font-mono">{item.endpoint}</code>
                        <span className="text-sm text-muted-foreground">{item.requests.toLocaleString()} requests</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent API Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { time: '2 minutes ago', method: 'POST', endpoint: '/api/v1/tasks', status: 201, response: '89ms' },
                  { time: '5 minutes ago', method: 'GET', endpoint: '/api/v1/projects', status: 200, response: '45ms' },
                  { time: '8 minutes ago', method: 'PUT', endpoint: '/api/v1/tasks/123', status: 200, response: '67ms' },
                  { time: '12 minutes ago', method: 'GET', endpoint: '/api/v1/users', status: 200, response: '34ms' },
                  { time: '15 minutes ago', method: 'DELETE', endpoint: '/api/v1/tasks/456', status: 204, response: '23ms' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={getMethodColor(activity.method)}>
                        {activity.method}
                      </Badge>
                      <code className="text-sm">{activity.endpoint}</code>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{activity.time}</span>
                      <span className="text-green-600">{activity.status}</span>
                      <span>{activity.response}</span>
                    </div>
                  </div>
                ))}
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeveloperPage;