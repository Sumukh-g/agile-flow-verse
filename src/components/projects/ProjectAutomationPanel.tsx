import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Zap,
  Plus,
  Calendar,
  MessageSquare,
  Clock,
  Bell,
  ArrowRight,
  Workflow,
  ExternalLink,
  Mail,
  FileText,
  CheckSquare,
  Settings,
  MoreHorizontal,
  Trash2,
  Edit,
  Play,
  Pause,
  AlertTriangle
} from 'lucide-react';
import { toast } from "sonner";

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'status-change' | 'date-based' | 'task-created' | 'manual' | 'scheduled';
    condition?: string;
  };
  actions: {
    type: 'update-status' | 'assign' | 'notify' | 'create-task' | 'webhook' | 'send-email';
    config: any;
  }[];
  enabled: boolean;
  lastRun?: string;
  runCount?: number;
}

interface ProjectAutomationPanelProps {
  projectId?: string;
}

const ProjectAutomationPanel = ({ projectId }: ProjectAutomationPanelProps) => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rules');
  const [newAutomation, setNewAutomation] = useState<Partial<Automation>>({
    name: '',
    description: '',
    trigger: {
      type: 'status-change'
    },
    actions: [{ type: 'notify', config: { recipients: ['assignee'] } }],
    enabled: true
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  
  useEffect(() => {
    setTimeout(() => {
      const mockAutomations: Automation[] = [
        {
          id: 'auto1',
          name: 'Auto-assign to creator',
          description: 'When a new task is created, assign it to the creator',
          trigger: {
            type: 'task-created'
          },
          actions: [
            {
              type: 'assign',
              config: {
                assignee: 'creator'
              }
            }
          ],
          enabled: true,
          lastRun: '2 days ago',
          runCount: 15
        },
        {
          id: 'auto2',
          name: 'Overdue task notification',
          description: 'Send notification when tasks pass due date',
          trigger: {
            type: 'date-based',
            condition: 'dueDate < today'
          },
          actions: [
            {
              type: 'notify',
              config: {
                channels: ['email', 'app'],
                recipients: ['assignee', 'project-lead'],
                message: 'Task {{taskName}} is overdue!'
              }
            }
          ],
          enabled: true,
          lastRun: '1 day ago',
          runCount: 3
        },
        {
          id: 'auto3',
          name: 'Move completed tasks to Done',
          description: 'When a task is marked complete, move it to the Done column',
          trigger: {
            type: 'status-change',
            condition: 'status == "Completed"'
          },
          actions: [
            {
              type: 'update-status',
              config: {
                newStatus: 'Done'
              }
            }
          ],
          enabled: true,
          lastRun: '3 hours ago',
          runCount: 8
        },
        {
          id: 'auto4',
          name: 'Create weekly progress report task',
          description: 'Generate a task for reviewing weekly progress every Monday',
          trigger: {
            type: 'scheduled',
            condition: 'day == "Monday" && time == "9:00 AM"'
          },
          actions: [
            {
              type: 'create-task',
              config: {
                title: 'Review weekly progress',
                assignee: 'project-lead',
                priority: 'Medium'
              }
            }
          ],
          enabled: false,
          lastRun: '7 days ago',
          runCount: 4
        },
        // New "Email on Task Completion" automation
        {
          id: 'auto5',
          name: 'Notify Team on Task Completion',
          description: 'When a task is marked as complete, send an email notification to the project team. (Email sending requires backend setup)',
          trigger: {
            type: 'status-change',
            condition: 'status == "Completed"',
          },
          actions: [
            {
              type: 'send-email',
              config: {
                recipients: ['project-team'],
                subjectTemplate: 'Task Completed: {{task.name}}',
                bodyTemplate: 'The task "{{task.name}}" in project "{{project.name}}" has been marked as complete by {{user.name}}.',
              },
            },
          ],
          enabled: true,
          lastRun: 'Never',
          runCount: 0,
        },
      ];
      setAutomations(mockAutomations);
      setLoading(false);
    }, 800);
  }, [projectId]);
  
  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'status-change':
        return <CheckSquare className="h-4 w-4" />;
      case 'date-based':
        return <Calendar className="h-4 w-4" />;
      case 'task-created':
        return <Plus className="h-4 w-4" />;
      case 'manual':
        return <Play className="h-4 w-4" />;
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };
  
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'update-status':
        return <CheckSquare className="h-4 w-4" />;
      case 'assign':
        return <FileText className="h-4 w-4" />;
      case 'notify':
        return <Bell className="h-4 w-4" />;
      case 'create-task':
        return <Plus className="h-4 w-4" />;
      case 'webhook':
        return <ExternalLink className="h-4 w-4" />;
      case 'send-email':
        return <Mail className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };
  
  const handleToggleAutomation = (id: string, enabled: boolean) => {
    setAutomations(prev => 
      prev.map(auto => 
        auto.id === id ? { ...auto, enabled } : auto
      )
    );
    toast.success(`Automation ${enabled ? 'enabled' : 'disabled'}`);
  };
  
  const handleDeleteAutomation = (id: string) => {
    setAutomations(prev => prev.filter(auto => auto.id !== id));
    toast.success('Automation deleted');
  };
  
  const handleCreateAutomation = () => {
    if (!newAutomation.name) {
      toast.error('Please enter a name for the automation');
      return;
    }
    
    let currentActions = newAutomation.actions;
    if (!Array.isArray(currentActions) || currentActions.length === 0) {
        currentActions = [{ type: 'notify', config: { message: 'Default notification' } }];
        toast.info("Default action added as none was selected.");
    }

    const newAuto: Automation = {
      id: `auto${Date.now()}`,
      name: newAutomation.name || 'New Automation',
      description: newAutomation.description || 'New automation rule',
      trigger: newAutomation.trigger || { type: 'manual' },
      actions: currentActions,
      enabled: newAutomation.enabled !== undefined ? newAutomation.enabled : true,
    };
    
    setAutomations(prev => [newAuto, ...prev]);
    setDialogOpen(false);
    setNewAutomation({
      name: '',
      description: '',
      trigger: { type: 'status-change' },
      actions: [{ type: 'notify', config: { recipients: ['assignee'] } }],
      enabled: true
    });
    toast.success('New automation created');
  };
  
  const handleRunAutomation = (id: string) => {
    const automation = automations.find(a => a.id === id);
    if (automation?.actions.some(act => act.type === 'send-email')) {
        toast.info(`Manually triggered automation "${automation.name}". Email sending requires backend setup.`);
    } else {
        toast.success(`Manually triggered automation "${automation?.name || 'Unknown'}"`);
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Automations</CardTitle>
          <CardDescription>
            Configure automated workflows for this project
          </CardDescription>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <p>Loading automations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Project Automations</CardTitle>
          <CardDescription>
            Configure automated workflows for this project. (Backend needed for full execution)
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Automation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Automation</DialogTitle>
              <DialogDescription>
                Set up a new automated workflow. (Full execution requires backend integration)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="automation-name">Name</Label>
                <Input
                  id="automation-name"
                  placeholder="Enter automation name"
                  value={newAutomation.name}
                  onChange={(e) => setNewAutomation({ ...newAutomation, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="automation-description">Description</Label>
                <Textarea
                  id="automation-description"
                  placeholder="Describe what this automation does"
                  value={newAutomation.description}
                  onChange={(e) => setNewAutomation({ ...newAutomation, description: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trigger-type">Trigger</Label>
                <Select 
                  value={newAutomation.trigger?.type} 
                  onValueChange={(val) => 
                    setNewAutomation({ 
                      ...newAutomation, 
                      trigger: { ...newAutomation.trigger, type: val as any } 
                    })
                  }
                >
                  <SelectTrigger id="trigger-type">
                    <SelectValue placeholder="Select trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status-change">Status Changes</SelectItem>
                    <SelectItem value="task-created">Task Created</SelectItem>
                    <SelectItem value="date-based">Date Condition</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="manual">Manual Trigger</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Actions</Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toast.info("Adding multiple actions dynamically is a more complex UI feature for future enhancement.")}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Action Step
                  </Button>
                </div>
                
                <Select
                    value={newAutomation.actions && newAutomation.actions.length > 0 ? newAutomation.actions[0].type : undefined}
                    onValueChange={(val) => 
                        setNewAutomation({
                            ...newAutomation,
                            actions: [{ type: val as any, config: { message: 'Configure this action' } }] 
                        })
                    }
                >
                  <SelectTrigger id="action-type">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update-status">Update Status</SelectItem>
                    <SelectItem value="assign">Assign to Someone</SelectItem>
                    <SelectItem value="notify">Send Notification</SelectItem>
                    <SelectItem value="create-task">Create Task</SelectItem>
                    <SelectItem value="webhook">Trigger Webhook</SelectItem>
                    <SelectItem value="send-email">Send Email</SelectItem>
                  </SelectContent>
                </Select>
                 <p className="text-xs text-muted-foreground">
                    Detailed configuration for actions (e.g., email content, recipients) would appear here based on selection.
                </p>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                  id="auto-enable" 
                  checked={newAutomation.enabled} 
                  onCheckedChange={(val) => setNewAutomation({ ...newAutomation, enabled: val })}
                />
                <Label htmlFor="auto-enable">Enable automation immediately</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateAutomation}>Create Automation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="rules">Automation Rules</TabsTrigger>
            <TabsTrigger value="history">Execution History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rules" className="space-y-4">
            {automations.length === 0 ? (
              <div className="border rounded-md p-8 text-center">
                <Zap className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium">No Automations Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first automation to streamline your workflow
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Automation
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {automations.map((auto) => (
                  <Card key={auto.id} className="overflow-hidden">
                    <div className={`h-0.5 ${auto.enabled ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-lg">{auto.name}</h3>
                            <Badge variant={auto.enabled ? "default" : "secondary"} className="text-xs">
                              {auto.enabled ? 'Active' : 'Disabled'}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm mt-1">
                            {auto.description}
                          </p>
                          
                          <div className="mt-4 flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                              <p className="text-xs font-medium text-muted-foreground mb-1">WHEN</p>
                              <div className="flex items-center p-2 bg-slate-50 rounded-md">
                                <div className="p-1.5 rounded-md bg-slate-200 mr-2">
                                  {getTriggerIcon(auto.trigger.type)}
                                </div>
                                <div className="text-sm">
                                  {auto.trigger.type === 'status-change' && 'Status changes'}
                                  {auto.trigger.type === 'task-created' && 'Task is created'}
                                  {auto.trigger.type === 'date-based' && 'Date condition is met'}
                                  {auto.trigger.type === 'scheduled' && 'On schedule'}
                                  {auto.trigger.type === 'manual' && 'Manually triggered'}
                                  {auto.trigger.condition && (
                                    <span className="text-xs bg-slate-100 px-1.5 py-0.5 ml-1 rounded">
                                      {auto.trigger.condition}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="self-center hidden sm:block">
                              <ArrowRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                            
                            <div className="flex-1">
                              <p className="text-xs font-medium text-muted-foreground mb-1">THEN</p>
                              <div className="flex flex-col gap-2">
                                {auto.actions.map((action, idx) => (
                                  <div key={idx} className="flex items-center p-2 bg-slate-50 rounded-md">
                                    <div className="p-1.5 rounded-md bg-slate-200 mr-2">
                                      {getActionIcon(action.type)}
                                    </div>
                                    <div className="text-sm truncate">
                                      {action.type === 'update-status' && `Update status to "${action.config.newStatus}"`}
                                      {action.type === 'assign' && `Assign to ${action.config.assignee}`}
                                      {action.type === 'notify' && `Send notification to ${action.config.recipients?.join(', ')}: "${action.config.message?.substring(0,30)}..."`}
                                      {action.type === 'create-task' && `Create task "${action.config.title}"`}
                                      {action.type === 'webhook' && `Trigger webhook: ${action.config.url || 'Not configured'}`}
                                      {action.type === 'send-email' && `Send email to ${action.config.recipients?.join(', ')} (Subject: "${action.config.subjectTemplate?.substring(0,20)}...")`}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-row md:flex-col items-center md:items-end gap-2 mt-4 md:mt-0">
                          {auto.lastRun && (
                            <div className="text-xs text-right text-muted-foreground">
                              Last run: {auto.lastRun} ({auto.runCount || 0} times)
                            </div>
                          )}
                          <div className="flex gap-2 items-center">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRunAutomation(auto.id)}
                              title="Manually run this automation"
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Run
                            </Button>
                            <Switch 
                              id={`switch-${auto.id}`} 
                              checked={auto.enabled} 
                              onCheckedChange={(checked) => handleToggleAutomation(auto.id, checked)}
                              title={auto.enabled ? "Disable Automation" : "Enable Automation"}
                            />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleDeleteAutomation(auto.id)}
                              title="Delete Automation"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            <div className="border rounded-md overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b">
                <h3 className="font-medium">Recent Executions</h3>
                <Button variant="outline" size="sm" onClick={() => toast.info("Log download feature coming soon.")}>
                  Download Logs
                </Button>
              </div>
              
              <div className="divide-y">
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                  <div>
                    <div className="font-medium">Overdue task notification</div>
                    <div className="text-sm text-muted-foreground">Yesterday at 9:15 AM</div>
                  </div>
                  <div className="flex items-center">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Success</Badge>
                    <Button variant="ghost" size="sm" onClick={() => toast.info("Viewing execution details")}>
                      View Details
                    </Button>
                  </div>
                </div>
                
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                  <div>
                    <div className="font-medium">Move completed tasks to Done</div>
                    <div className="text-sm text-muted-foreground">Yesterday at 3:45 PM</div>
                  </div>
                  <div className="flex items-center">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Success</Badge>
                    <Button variant="ghost" size="sm" onClick={() => toast.info("Viewing execution details")}>
                      View Details
                    </Button>
                  </div>
                </div>
                
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                  <div>
                    <div className="font-medium">Create weekly progress report</div>
                    <div className="text-sm text-muted-foreground">Monday at 9:00 AM</div>
                  </div>
                  <div className="flex items-center">
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Failed</Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600"
                      onClick={() => toast.error("Error executing automation: Missing permissions")}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      View Error
                    </Button>
                  </div>
                </div>
                 <div className="px-4 py-3 text-center text-muted-foreground">
                    No recent executions for new automations. Execution history requires backend logging.
                  </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Automation Settings</h3>
                <p className="text-muted-foreground">
                  Configure global settings for automations in this project. (Settings persistence requires backend).
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Error Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Send notifications (e.g., to project admins) when automations fail.
                    </p>
                  </div>
                  <Switch id="error-notifications" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Audit Logging Level</h4>
                    <p className="text-sm text-muted-foreground">
                      Control the detail level of automation execution logs.
                    </p>
                  </div>
                   <Select defaultValue="basic">
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="detailed">Detailed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Allow Manual Triggers by Default</h4>
                    <p className="text-sm text-muted-foreground">
                      Enable manually running automations by default for new rules.
                    </p>
                  </div>
                  <Switch id="manual-triggers-default" defaultChecked />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Monthly Execution Quota</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Used: 38 / 1,000 (Example)</span>
                    <span className="text-muted-foreground">3.8%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: '3.8%' }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Quota resets on the 1st of each month. (Tracking requires backend).
                  </p>
                </div>
              </div>
              
              <div className="pt-2">
                <Button variant="outline" onClick={() => toast.success("Settings saved (locally for demo). Backend needed for persistence.")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProjectAutomationPanel;
