import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Pause,
    Play,
    Plus,
    Settings,
    Trash2,
    Zap
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface WorkflowStep {
  id: string;
  name: string;
  type: 'trigger' | 'action' | 'condition';
  description: string;
  enabled: boolean;
}

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actions: string[];
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

const NoteWorkflows: React.FC<{ note: any; onUpdateNote: (noteId: string, updates: any) => void }> = ({ note, onUpdateNote }) => {
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([
    {
      id: '1',
      name: 'Auto-save to Cloud',
      description: 'Automatically save notes to cloud storage',
      trigger: 'When note is updated',
      actions: ['Save to Google Drive', 'Send backup email'],
      enabled: true,
      lastRun: '2 minutes ago',
      nextRun: 'In 5 minutes'
    },
    {
      id: '2',
      name: 'Team Notification',
      description: 'Notify team when important notes are created',
      trigger: 'When note is tagged as "important"',
      actions: ['Send Slack message', 'Create calendar reminder'],
      enabled: false,
      lastRun: '1 hour ago'
    },
    {
      id: '3',
      name: 'Content Analysis',
      description: 'Analyze note content for insights',
      trigger: 'When note contains keywords',
      actions: ['Run AI analysis', 'Generate summary', 'Extract key points'],
      enabled: true,
      lastRun: '30 minutes ago',
      nextRun: 'In 2 hours'
    }
  ]);

  const [workflowSteps] = useState<WorkflowStep[]>([
    {
      id: 'trigger-1',
      name: 'Note Created',
      type: 'trigger',
      description: 'Triggers when a new note is created',
      enabled: true
    },
    {
      id: 'trigger-2',
      name: 'Note Updated',
      type: 'trigger',
      description: 'Triggers when a note is modified',
      enabled: true
    },
    {
      id: 'action-1',
      name: 'Send Email',
      type: 'action',
      description: 'Send email notification',
      enabled: true
    },
    {
      id: 'action-2',
      name: 'Create Task',
      type: 'action',
      description: 'Create a task from note content',
      enabled: true
    },
    {
      id: 'condition-1',
      name: 'Contains Keywords',
      type: 'condition',
      description: 'Check if note contains specific keywords',
      enabled: true
    }
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    trigger: '',
    actions: [] as string[]
  });

  const handleToggleWorkflow = (id: string) => {
    setWorkflows(prev => 
      prev.map(workflow => 
        workflow.id === id 
          ? { ...workflow, enabled: !workflow.enabled }
          : workflow
      )
    );
    toast.success('Workflow status updated');
  };

  const handleDeleteWorkflow = (id: string) => {
    setWorkflows(prev => prev.filter(workflow => workflow.id !== id));
    toast.success('Workflow deleted');
  };

  const handleCreateWorkflow = () => {
    if (newWorkflow.name.trim() && newWorkflow.trigger && newWorkflow.actions.length > 0) {
      const workflow: WorkflowRule = {
        id: Date.now().toString(),
        name: newWorkflow.name,
        description: newWorkflow.description,
        trigger: newWorkflow.trigger,
        actions: newWorkflow.actions,
        enabled: true
      };
      setWorkflows(prev => [...prev, workflow]);
      setNewWorkflow({ name: '', description: '', trigger: '', actions: [] });
      setShowCreateForm(false);
      toast.success('Workflow created successfully');
    }
  };

  const handleRunWorkflow = (id: string) => {
    toast.success('Workflow executed');
  };

  const getStatusIcon = (enabled: boolean, lastRun?: string) => {
    if (!enabled) return <Pause className="h-4 w-4 text-gray-400" />;
    if (lastRun) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Note Workflows</h3>
          <p className="text-sm text-muted-foreground">
            Automate actions based on note events and content
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Active Workflows */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Active Workflows ({workflows.filter(w => w.enabled).length})
        </h4>
        <div className="space-y-3">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className={`${workflow.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(workflow.enabled, workflow.lastRun)}
                    <div>
                      <CardTitle className="text-sm">{workflow.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {workflow.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={workflow.enabled ? 'default' : 'secondary'}>
                      {workflow.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                    <Switch
                      checked={workflow.enabled}
                      onCheckedChange={() => handleToggleWorkflow(workflow.id)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span><strong>Trigger:</strong> {workflow.trigger}</span>
                    <span><strong>Actions:</strong> {workflow.actions.join(', ')}</span>
                  </div>
                  {workflow.lastRun && (
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span><Clock className="h-3 w-3 inline mr-1" />Last run: {workflow.lastRun}</span>
                      {workflow.nextRun && (
                        <span>Next run: {workflow.nextRun}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRunWorkflow(workflow.id)}
                    disabled={!workflow.enabled}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Run Now
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-3 w-3 mr-1" />
                    Configure
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteWorkflow(workflow.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Available Steps
        </h4>
        <div className="grid gap-3 md:grid-cols-2">
          {workflowSteps.map((step) => (
            <Card key={step.id} className="border-dashed">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded ${
                    step.type === 'trigger' ? 'bg-blue-100 text-blue-600' :
                    step.type === 'action' ? 'bg-green-100 text-green-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {step.type === 'trigger' ? <Zap className="h-4 w-4" /> :
                     step.type === 'action' ? <Play className="h-4 w-4" /> :
                     <Settings className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{step.name}</h5>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {step.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Create Workflow Form */}
      {showCreateForm && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Create New Workflow</CardTitle>
            <CardDescription>
              Set up automated actions for your notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workflow-name">Workflow Name</Label>
                <Input
                  id="workflow-name"
                  placeholder="Enter workflow name"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workflow-trigger">Trigger</Label>
                <Select value={newWorkflow.trigger} onValueChange={(value) => setNewWorkflow({ ...newWorkflow, trigger: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note-created">Note Created</SelectItem>
                    <SelectItem value="note-updated">Note Updated</SelectItem>
                    <SelectItem value="note-tagged">Note Tagged</SelectItem>
                    <SelectItem value="note-shared">Note Shared</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="workflow-description">Description</Label>
              <Textarea
                id="workflow-description"
                placeholder="Describe what this workflow does"
                value={newWorkflow.description}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Actions</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {['Send Email', 'Create Task', 'Save to Cloud', 'Notify Team', 'Generate Summary'].map((action) => (
                  <label key={action} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newWorkflow.actions.includes(action)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewWorkflow({ ...newWorkflow, actions: [...newWorkflow.actions, action] });
                        } else {
                          setNewWorkflow({ ...newWorkflow, actions: newWorkflow.actions.filter(a => a !== action) });
                        }
                      }}
                    />
                    <span className="text-sm">{action}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={handleCreateWorkflow} disabled={!newWorkflow.name.trim() || !newWorkflow.trigger || newWorkflow.actions.length === 0}>
                Create Workflow
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NoteWorkflows; 