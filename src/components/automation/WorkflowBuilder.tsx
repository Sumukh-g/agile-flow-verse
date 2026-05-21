/**
 * Visual Workflow Builder Component
 * 
 * A drag-and-drop interface for creating automation workflows.
 * 
 * Features:
 * - Drag-and-drop trigger, condition, and action nodes
 * - Visual connection between nodes
 * - Node configuration panels
 * - Workflow validation
 * - Save and test workflows
 * - Undo/redo support
 * - Workflow templates
 * 
 * @component
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { automationApi } from '@/lib/api/automation';
import type { TriggerKey, ActionKey, ActionLeaf } from '@/lib/api/automation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Play,
  Pause,
  Plus,
  Trash2,
  Save,
  Copy,
  Undo,
  Redo,
  ChevronRight,
  ChevronDown,
  Settings,
  Zap,
  Clock,
  Calendar,
  User,
  Tag,
  MessageSquare,
  Mail,
  Bell,
  GitBranch,
  ArrowRight,
  Check,
  X,
  AlertTriangle,
  FileText,
  ListTodo,
  Target,
  Workflow,
  Sparkles,
  Brain,
  Code,
  Link as LinkIcon,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Node types for the workflow builder
 */
type NodeType = 'trigger' | 'condition' | 'action';

/**
 * Trigger types
 */
type TriggerType = 
  | 'task_created' 
  | 'task_updated' 
  | 'task_status_changed' 
  | 'task_assigned'
  | 'due_date_approaching'
  | 'comment_added'
  | 'scheduled'
  | 'webhook'
  | 'manual';

/**
 * Condition types
 */
type ConditionType = 
  | 'status_equals' 
  | 'priority_equals'
  | 'assignee_is'
  | 'tag_contains'
  | 'field_equals'
  | 'field_contains'
  | 'time_is';

/**
 * Action types
 */
type ActionType = 
  | 'change_status'
  | 'assign_user'
  | 'add_tag'
  | 'remove_tag'
  | 'send_notification'
  | 'send_email'
  | 'create_subtask'
  | 'add_comment'
  | 'update_field'
  | 'call_webhook'
  | 'move_to_project';

/**
 * Workflow node interface
 */
interface WorkflowNode {
  id: string;
  type: NodeType;
  subType: TriggerType | ConditionType | ActionType;
  label: string;
  config: Record<string, any>;
  x: number;
  y: number;
  connections: string[]; // IDs of connected nodes
}

/**
 * Workflow interface
 */
interface Workflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  nodes: WorkflowNode[];
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// NODE CONFIGURATIONS
// ============================================================================

/**
 * Available triggers with their configurations
 */
const TRIGGERS = [
  { type: 'task_created', label: 'Task Created', icon: FileText, description: 'When a new task is created' },
  { type: 'task_updated', label: 'Task Updated', icon: FileText, description: 'When any task field is updated' },
  { type: 'task_status_changed', label: 'Status Changed', icon: ListTodo, description: 'When task status changes' },
  { type: 'task_assigned', label: 'Task Assigned', icon: User, description: 'When a task is assigned' },
  { type: 'due_date_approaching', label: 'Due Date Approaching', icon: Calendar, description: 'Before task due date' },
  { type: 'comment_added', label: 'Comment Added', icon: MessageSquare, description: 'When a comment is added' },
  { type: 'scheduled', label: 'Scheduled', icon: Clock, description: 'Run at scheduled times' },
  { type: 'webhook', label: 'Webhook Received', icon: LinkIcon, description: 'When webhook is called' },
  { type: 'manual', label: 'Manual Trigger', icon: Play, description: 'Run manually via button' },
] as const;

/**
 * Available conditions with their configurations
 */
const CONDITIONS = [
  { type: 'status_equals', label: 'Status Is', icon: ListTodo, description: 'Check if status equals value' },
  { type: 'priority_equals', label: 'Priority Is', icon: Target, description: 'Check if priority equals value' },
  { type: 'assignee_is', label: 'Assigned To', icon: User, description: 'Check if assignee matches' },
  { type: 'tag_contains', label: 'Has Tag', icon: Tag, description: 'Check if task has specific tag' },
  { type: 'field_equals', label: 'Field Equals', icon: Settings, description: 'Check if custom field equals value' },
  { type: 'field_contains', label: 'Field Contains', icon: Settings, description: 'Check if field contains value' },
  { type: 'time_is', label: 'Time Condition', icon: Clock, description: 'Check time-based condition' },
] as const;

/**
 * Available actions with their configurations
 */
const ACTIONS = [
  { type: 'change_status', label: 'Change Status', icon: ListTodo, description: 'Update task status' },
  { type: 'assign_user', label: 'Assign User', icon: User, description: 'Assign task to user' },
  { type: 'add_tag', label: 'Add Tag', icon: Tag, description: 'Add tag to task' },
  { type: 'remove_tag', label: 'Remove Tag', icon: Tag, description: 'Remove tag from task' },
  { type: 'send_notification', label: 'Send Notification', icon: Bell, description: 'Send in-app notification' },
  { type: 'send_email', label: 'Send Email', icon: Mail, description: 'Send email notification' },
  { type: 'create_subtask', label: 'Create Subtask', icon: ListTodo, description: 'Create a subtask' },
  { type: 'add_comment', label: 'Add Comment', icon: MessageSquare, description: 'Add comment to task' },
  { type: 'update_field', label: 'Update Field', icon: Settings, description: 'Update custom field' },
  { type: 'call_webhook', label: 'Call Webhook', icon: LinkIcon, description: 'Call external webhook' },
  { type: 'move_to_project', label: 'Move to Project', icon: GitBranch, description: 'Move task to another project' },
] as const;

// ============================================================================
// COMPONENT
// ============================================================================

interface WorkflowBuilderProps {
  workflow?: Workflow;
  onSave?: (workflow: Workflow) => void;
  onTest?: (workflow: Workflow) => void;
}

export function WorkflowBuilder({ workflow: initialWorkflow, onSave, onTest }: WorkflowBuilderProps) {
  // ============================================================================
  // STATE
  // ============================================================================
  
  // Workflow state
  const [workflowName, setWorkflowName] = useState(initialWorkflow?.name || 'New Workflow');
  const [workflowDescription, setWorkflowDescription] = useState(initialWorkflow?.description || '');
  const [workflowEnabled, setWorkflowEnabled] = useState(initialWorkflow?.enabled ?? true);
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialWorkflow?.nodes || []);
  
  // UI state
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [addingNodeType, setAddingNodeType] = useState<NodeType | null>(null);
  const [draggedNode, setDraggedNode] = useState<WorkflowNode | null>(null);
  
  // History for undo/redo
  const [history, setHistory] = useState<WorkflowNode[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Generate unique ID for nodes
   */
  const generateId = useCallback(() => {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Save state to history for undo/redo
   */
  const saveToHistory = useCallback((newNodes: WorkflowNode[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newNodes);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  /**
   * Undo last action
   */
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setNodes(history[historyIndex - 1]);
    }
  }, [historyIndex, history]);

  /**
   * Redo last undone action
   */
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setNodes(history[historyIndex + 1]);
    }
  }, [historyIndex, history]);

  /**
   * Add a new node to the workflow
   */
  const handleAddNode = useCallback((type: NodeType, subType: string) => {
    // Get the node definition
    let nodeDef;
    if (type === 'trigger') {
      nodeDef = TRIGGERS.find(t => t.type === subType);
    } else if (type === 'condition') {
      nodeDef = CONDITIONS.find(c => c.type === subType);
    } else {
      nodeDef = ACTIONS.find(a => a.type === subType);
    }

    if (!nodeDef) return;

    // Calculate position (stack vertically with some offset)
    const existingOfType = nodes.filter(n => n.type === type);
    const yOffset = existingOfType.length * 120;
    const xPosition = type === 'trigger' ? 50 : type === 'condition' ? 300 : 550;

    const newNode: WorkflowNode = {
      id: generateId(),
      type,
      subType: subType as any,
      label: nodeDef.label,
      config: {},
      x: xPosition,
      y: 50 + yOffset,
      connections: [],
    };

    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    saveToHistory(newNodes);
    setSelectedNode(newNode);
    setIsAddingNode(false);
    setAddingNodeType(null);
    toast.success(`Added ${nodeDef.label}`);
  }, [nodes, generateId, saveToHistory]);

  /**
   * Delete a node from the workflow
   */
  const handleDeleteNode = useCallback((nodeId: string) => {
    const newNodes = nodes.filter(n => n.id !== nodeId);
    // Also remove connections to this node
    newNodes.forEach(n => {
      n.connections = n.connections.filter(c => c !== nodeId);
    });
    setNodes(newNodes);
    saveToHistory(newNodes);
    setSelectedNode(null);
    toast.success('Node deleted');
  }, [nodes, saveToHistory]);

  /**
   * Connect two nodes
   */
  const handleConnect = useCallback((fromId: string, toId: string) => {
    const newNodes = nodes.map(n => {
      if (n.id === fromId) {
        if (!n.connections.includes(toId)) {
          return { ...n, connections: [...n.connections, toId] };
        }
      }
      return n;
    });
    setNodes(newNodes);
    saveToHistory(newNodes);
    toast.success('Nodes connected');
  }, [nodes, saveToHistory]);

  /**
   * Update node configuration
   */
  const handleUpdateNodeConfig = useCallback((nodeId: string, config: Record<string, any>) => {
    const newNodes = nodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, config: { ...n.config, ...config } };
      }
      return n;
    });
    setNodes(newNodes);
    saveToHistory(newNodes);
  }, [nodes, saveToHistory]);

  /**
   * Map builder's internal TriggerType → backend TriggerKey
   */
  const mapTriggerKey = (subType: string): TriggerKey => {
    const map: Record<string, TriggerKey> = {
      task_created:          'task.created',
      task_updated:          'task.status.changed',
      task_status_changed:   'task.status.changed',
      task_assigned:         'task.assigned',
      due_date_approaching:  'task.due_date.passed' as TriggerKey,
      comment_added:         'task.created',
      scheduled:             'task.created',
      webhook:               'task.created',
      manual:                'task.created',
    };
    return map[subType] ?? 'task.created';
  };

  /**
   * Map builder's action node → backend ActionLeaf
   */
  const mapActionNode = (node: WorkflowNode): ActionLeaf => {
    const keyMap: Record<string, ActionKey> = {
      change_status:     'task.update',
      assign_user:       'task.assign',
      send_notification: 'notification.create',
      send_email:        'email.send',
      add_comment:       'comment.create',
      call_webhook:      'webhook.send',
      create_subtask:    'task.create',
      add_tag:           'task.update',
      remove_tag:        'task.update',
      update_field:      'task.update',
      move_to_project:   'task.update',
    };
    const key: ActionKey = keyMap[node.subType as string] ?? 'notification.create';

    const params: Record<string, unknown> = {};
    if (node.config.newStatus)   params.status      = node.config.newStatus;
    if (node.config.userId)      params.userId      = node.config.userId;
    if (node.config.title)       params.title       = node.config.title;
    if (node.config.message)     params.message     = node.config.message;
    if (node.config.comment)     params.content     = node.config.comment;
    if (node.config.url)         params.url         = node.config.url;
    if (node.config.recipients)  params.recipients  = node.config.recipients;
    if (Object.keys(params).length === 0) params.recipients = 'assignees';

    return { type: 'action', key, params };
  };

  /** Saving state tracked with a ref to avoid stale-closure issues */
  const isSavingRef = useRef(false);

  /**
   * Save the workflow — converts builder format to the new API format and persists it
   */
  const handleSave = useCallback(async () => {
    if (!workflowName.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }
    const hasTrigger = nodes.some(n => n.type === 'trigger');
    if (!hasTrigger) { toast.error('Add at least one trigger'); return; }
    const hasAction = nodes.some(n => n.type === 'action');
    if (!hasAction)  { toast.error('Add at least one action');  return; }
    if (isSavingRef.current) return;

    const triggerNode = nodes.find(n => n.type === 'trigger')!;
    const triggerKey  = mapTriggerKey(triggerNode.subType as string);
    const triggerParams: Record<string, unknown> = {};
    if (triggerNode.config.toStatus) triggerParams.toStatus = triggerNode.config.toStatus;

    const steps: ActionLeaf[] = nodes
      .filter(n => n.type === 'action')
      .map(mapActionNode);

    const payload = {
      name:         workflowName.trim(),
      description:  workflowDescription.trim() || undefined,
      isActive:     workflowEnabled,
      triggerKey,
      triggerParams,
      steps,
    };

    isSavingRef.current = true;
    try {
      let saved;
      if (initialWorkflow?.id) {
        saved = await automationApi.updateRule(initialWorkflow.id, payload);
        toast.success('Workflow updated ✓');
      } else {
        saved = await automationApi.createRule(payload);
        toast.success('Workflow saved ✓');
      }
      // Build a local Workflow object so the onSave callback still fires
      const workflow: Workflow = {
        id:          saved.id,
        name:        saved.name,
        description: saved.description ?? '',
        enabled:     saved.isActive,
        nodes,
        createdAt:   saved.createdAt,
        updatedAt:   new Date().toISOString(),
      };
      onSave?.(workflow);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save workflow');
    } finally {
      isSavingRef.current = false;
    }
  }, [workflowName, workflowDescription, workflowEnabled, nodes, initialWorkflow, onSave]);

  /**
   * Test the workflow
   */
  const handleTest = useCallback(() => {
    const workflow: Workflow = {
      id: initialWorkflow?.id || generateId(),
      name: workflowName,
      description: workflowDescription,
      enabled: workflowEnabled,
      nodes,
      createdAt: initialWorkflow?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onTest?.(workflow);
    toast.info('Testing workflow...');
  }, [workflowName, workflowDescription, workflowEnabled, nodes, initialWorkflow, generateId, onTest]);

  /**
   * Get icon for node type
   */
  const getNodeIcon = (node: WorkflowNode) => {
    if (node.type === 'trigger') {
      const trigger = TRIGGERS.find(t => t.type === node.subType);
      return trigger?.icon || Zap;
    } else if (node.type === 'condition') {
      const condition = CONDITIONS.find(c => c.type === node.subType);
      return condition?.icon || GitBranch;
    } else {
      const action = ACTIONS.find(a => a.type === node.subType);
      return action?.icon || Zap;
    }
  };

  /**
   * Get node color based on type
   */
  const getNodeColor = (type: NodeType) => {
    switch (type) {
      case 'trigger': return 'bg-blue-500';
      case 'condition': return 'bg-amber-500';
      case 'action': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  /**
   * Get node border color
   */
  const getNodeBorderColor = (type: NodeType) => {
    switch (type) {
      case 'trigger': return 'border-blue-300';
      case 'condition': return 'border-amber-300';
      case 'action': return 'border-green-300';
      default: return 'border-gray-300';
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="Workflow Name"
            className="w-64 font-semibold"
          />
          <div className="flex items-center gap-2">
            <Switch
              checked={workflowEnabled}
              onCheckedChange={setWorkflowEnabled}
            />
            <span className="text-sm text-muted-foreground">
              {workflowEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="outline" size="sm" onClick={handleTest}>
            <Play className="h-4 w-4 mr-2" />
            Test
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Node Palette */}
        <div className="w-64 border-r bg-slate-50 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2 text-blue-600">Triggers</h4>
              <div className="space-y-1">
                {TRIGGERS.map((trigger) => {
                  const Icon = trigger.icon;
                  return (
                    <div
                      key={trigger.type}
                      className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleAddNode('trigger', trigger.type)}
                    >
                      <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                        <Icon className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm">{trigger.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="text-sm font-semibold mb-2 text-amber-600">Conditions</h4>
              <div className="space-y-1">
                {CONDITIONS.map((condition) => {
                  const Icon = condition.icon;
                  return (
                    <div
                      key={condition.type}
                      className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors"
                      onClick={() => handleAddNode('condition', condition.type)}
                    >
                      <div className="w-6 h-6 bg-amber-500 rounded flex items-center justify-center">
                        <Icon className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm">{condition.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="text-sm font-semibold mb-2 text-green-600">Actions</h4>
              <div className="space-y-1">
                {ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <div
                      key={action.type}
                      className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                      onClick={() => handleAddNode('action', action.type)}
                    >
                      <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                        <Icon className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm">{action.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative bg-slate-100 overflow-auto">
          {/* Grid Background */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, #ccc 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          
          {/* Nodes */}
          <div className="relative min-h-full min-w-full p-4">
            {nodes.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Workflow className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    Start Building Your Workflow
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click on a trigger from the left panel to begin
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => handleAddNode('trigger', 'task_created')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Trigger
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Connection Lines */}
                <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                  {nodes.flatMap((node) =>
                    node.connections.map((targetId) => {
                      const target = nodes.find((n) => n.id === targetId);
                      if (!target) return null;
                      return (
                        <line
                          key={`${node.id}-${targetId}`}
                          x1={node.x + 150}
                          y1={node.y + 40}
                          x2={target.x}
                          y2={target.y + 40}
                          stroke="#94a3b8"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                        />
                      );
                    })
                  )}
                </svg>
                
                {/* Node Cards */}
                {nodes.map((node) => {
                  const Icon = getNodeIcon(node);
                  const isSelected = selectedNode?.id === node.id;
                  
                  return (
                    <div
                      key={node.id}
                      className={`
                        absolute w-[200px] p-3 rounded-lg border-2 bg-white shadow-sm
                        cursor-pointer transition-all hover:shadow-md
                        ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                        ${getNodeBorderColor(node.type)}
                      `}
                      style={{
                        left: node.x,
                        top: node.y,
                        zIndex: isSelected ? 10 : 1,
                      }}
                      onClick={() => setSelectedNode(node)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getNodeColor(node.type)}`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{node.label}</p>
                          <p className="text-xs text-muted-foreground capitalize">{node.type}</p>
                        </div>
                      </div>
                      
                      {/* Connection Points */}
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-slate-300 cursor-crosshair" />
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-slate-300" />
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <div className="w-80 border-l bg-white overflow-y-auto">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Node Properties</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedNode(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Type</Label>
                  <Badge className={`mt-1 ${getNodeColor(selectedNode.type)} text-white`}>
                    {selectedNode.type}
                  </Badge>
                </div>
                
                <div>
                  <Label>Label</Label>
                  <p className="text-sm font-medium mt-1">{selectedNode.label}</p>
                </div>
                
                <Separator />
                
                {/* Node-specific configuration */}
                {selectedNode.type === 'trigger' && selectedNode.subType === 'task_status_changed' && (
                  <div>
                    <Label>When status changes to</Label>
                    <Select
                      value={selectedNode.config.toStatus || ''}
                      onValueChange={(value) => handleUpdateNodeConfig(selectedNode.id, { toStatus: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="review">In Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {selectedNode.type === 'trigger' && selectedNode.subType === 'scheduled' && (
                  <div className="space-y-3">
                    <div>
                      <Label>Schedule Type</Label>
                      <Select
                        value={selectedNode.config.scheduleType || 'daily'}
                        onValueChange={(value) => handleUpdateNodeConfig(selectedNode.id, { scheduleType: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={selectedNode.config.time || '09:00'}
                        onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { time: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
                
                {selectedNode.type === 'condition' && selectedNode.subType === 'status_equals' && (
                  <div>
                    <Label>Status equals</Label>
                    <Select
                      value={selectedNode.config.status || ''}
                      onValueChange={(value) => handleUpdateNodeConfig(selectedNode.id, { status: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="review">In Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {selectedNode.type === 'condition' && selectedNode.subType === 'priority_equals' && (
                  <div>
                    <Label>Priority equals</Label>
                    <Select
                      value={selectedNode.config.priority || ''}
                      onValueChange={(value) => handleUpdateNodeConfig(selectedNode.id, { priority: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {selectedNode.type === 'action' && selectedNode.subType === 'change_status' && (
                  <div>
                    <Label>Change status to</Label>
                    <Select
                      value={selectedNode.config.newStatus || ''}
                      onValueChange={(value) => handleUpdateNodeConfig(selectedNode.id, { newStatus: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="review">In Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {selectedNode.type === 'action' && selectedNode.subType === 'send_notification' && (
                  <div className="space-y-3">
                    <div>
                      <Label>Notification Title</Label>
                      <Input
                        value={selectedNode.config.title || ''}
                        onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { title: e.target.value })}
                        placeholder="Notification title"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Message</Label>
                      <Textarea
                        value={selectedNode.config.message || ''}
                        onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { message: e.target.value })}
                        placeholder="Notification message"
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
                
                {selectedNode.type === 'action' && selectedNode.subType === 'add_comment' && (
                  <div>
                    <Label>Comment Text</Label>
                    <Textarea
                      value={selectedNode.config.comment || ''}
                      onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { comment: e.target.value })}
                      placeholder="Comment to add"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                )}
                
                <Separator />
                
                {/* Connect to other nodes */}
                <div>
                  <Label>Connect to</Label>
                  <div className="mt-2 space-y-1">
                    {nodes
                      .filter(n => n.id !== selectedNode.id && !selectedNode.connections.includes(n.id))
                      .map(n => (
                        <div
                          key={n.id}
                          className="flex items-center justify-between p-2 rounded border hover:bg-slate-50 cursor-pointer"
                          onClick={() => handleConnect(selectedNode.id, n.id)}
                        >
                          <span className="text-sm">{n.label}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                <Separator />
                
                {/* Delete Node */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Node
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Description Input */}
      <div className="p-4 border-t bg-white">
        <Label>Workflow Description</Label>
        <Textarea
          value={workflowDescription}
          onChange={(e) => setWorkflowDescription(e.target.value)}
          placeholder="Describe what this workflow does..."
          className="mt-1"
          rows={2}
        />
      </div>
    </div>
  );
}

export default WorkflowBuilder;

