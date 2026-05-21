import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  AlertCircle, ArrowRight, Bell, CheckCircle2, ChevronDown, ChevronRight,
  Clock, Code2, Edit2, GitBranch, Globe, History, Info, Layers,
  Mail, MoreHorizontal, Pause, Play, Plus, RefreshCw, Search,
  Trash2, Webhook, Workflow, Zap, FlaskConical, RotateCcw,
  ActivitySquare, ListChecks, XCircle
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetDescription, SheetFooter,
  SheetHeader, SheetTitle
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

import {
  useAutomationRules,
  useAutomationExecutions,
  useAutomationExecution,
  useCreateRule,
  useUpdateRule,
  useDeleteRule,
  useToggleRule,
  useDryRunRule,
  useReplayExecution,
  AutomationRule,
  AutomationExecution,
  CreateRuleDto,
  TriggerKey,
  ActionKey,
  ActionLeaf,
  TRIGGER_META,
  ACTION_META,
  getTriggerLabel,
  getActionLabel,
} from '@/hooks/useAutomations';

// ─── Constants ────────────────────────────────────────────────────────────────

const TRIGGER_KEYS = Object.keys(TRIGGER_META) as TriggerKey[];
const ACTION_KEYS = Object.keys(ACTION_META) as ActionKey[];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(ms?: number | null): string {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function statusConfig(status: string) {
  const map: Record<string, { label: string; className: string; Icon: React.FC<{ className?: string }> }> = {
    SUCCESS: { label: 'Success',  className: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
    FAILED:  { label: 'Failed',   className: 'bg-red-50 text-red-700 border-red-200',             Icon: XCircle },
    RUNNING: { label: 'Running',  className: 'bg-blue-50 text-blue-700 border-blue-200',          Icon: RefreshCw },
    PENDING: { label: 'Pending',  className: 'bg-gray-50 text-gray-600 border-gray-200',          Icon: Clock },
    SKIPPED: { label: 'Skipped',  className: 'bg-amber-50 text-amber-700 border-amber-200',       Icon: GitBranch },
    DRY_RUN: { label: 'Dry Run',  className: 'bg-violet-50 text-violet-700 border-violet-200',    Icon: FlaskConical },
  };
  return map[status] ?? map.PENDING;
}

// ─── Execution Detail Modal ──────────────────────────────────────────────────

const ExecutionDetailModal: React.FC<{
  executionId: string;
  open: boolean;
  onClose: () => void;
}> = ({ executionId, open, onClose }) => {
  const { data, isLoading } = useAutomationExecution(executionId);
  const replay = useReplayExecution();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ActivitySquare className="h-5 w-5 text-muted-foreground" />
            Execution Detail
          </DialogTitle>
          <DialogDescription>
            Step-by-step audit trail for this automation run
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-4">
              {/* Header info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Rule', data.rule?.name ?? data.ruleId],
                  ['Trigger', data.rule?.triggerKey ?? '—'],
                  ['Duration', formatDuration(data.durationMs)],
                  ['Started', timeAgo(data.startedAt)],
                  ['Chain Depth', String(data.chainDepth)],
                  ['Dry Run', data.isDryRun ? 'Yes' : 'No'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">{k}</span>
                    <span className="font-medium truncate">{v}</span>
                  </div>
                ))}
              </div>

              {data.errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <span className="font-medium">Error: </span>{data.errorMessage}
                </div>
              )}

              <Separator />

              {/* Step logs */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Step Logs ({data.stepLogs?.length ?? 0})</h4>
                {(data.stepLogs ?? []).map((log) => {
                  const cfg = statusConfig(log.status);
                  return (
                    <div key={log.id} className="border rounded-lg overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 bg-muted/40">
                        <cfg.Icon className="h-3.5 w-3.5" />
                        <span className="text-xs font-mono font-medium flex-1">{log.stepKey}</span>
                        <Badge variant="outline" className={`text-xs ${cfg.className}`}>
                          {cfg.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatDuration(log.durationMs)}</span>
                      </div>
                      {log.errorMessage && (
                        <div className="px-3 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
                          {log.errorMessage}
                        </div>
                      )}
                    </div>
                  );
                })}
                {(!data.stepLogs || data.stepLogs.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No step logs recorded</p>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : null}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => replay.mutate({ id: executionId, dryRun: true })}
            disabled={replay.isPending}
          >
            <FlaskConical className="h-4 w-4 mr-2" />
            Replay (Dry Run)
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => replay.mutate({ id: executionId, dryRun: false })}
            disabled={replay.isPending}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Replay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Rule Form (Create / Edit) in a Sheet ────────────────────────────────────

interface RuleFormProps {
  open: boolean;
  onClose: () => void;
  rule?: AutomationRule | null;
}

const DEFAULT_ACTION: ActionLeaf = {
  type: 'action',
  key: 'notification.create',
  params: { recipients: 'assignees', title: 'Automation triggered', message: '{{entityId}} was updated.' },
};

const RuleFormSheet: React.FC<RuleFormProps> = ({ open, onClose, rule }) => {
  const createRule = useCreateRule();
  const updateRule = useUpdateRule();
  const dryRun = useDryRunRule();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerKey, setTriggerKey] = useState<TriggerKey>('task.status.changed');
  const [triggerParams, setTriggerParams] = useState('{}');
  const [actions, setActions] = useState<ActionLeaf[]>([{ ...DEFAULT_ACTION }]);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Sync state when editing
  React.useEffect(() => {
    if (open && rule) {
      setName(rule.name);
      setDescription(rule.description ?? '');
      setTriggerKey(rule.triggerKey as TriggerKey);
      setTriggerParams(rule.triggerParams ? JSON.stringify(rule.triggerParams, null, 2) : '{}');
      const existing = (rule.steps ?? []).filter((s): s is ActionLeaf => s.type === 'action');
      setActions(existing.length ? existing : [{ ...DEFAULT_ACTION }]);
    } else if (open && !rule) {
      setName('');
      setDescription('');
      setTriggerKey('task.status.changed');
      setTriggerParams('{}');
      setActions([{ ...DEFAULT_ACTION }]);
      setStep(1);
    }
  }, [open, rule]);

  const addAction = () =>
    setActions((prev) => [...prev, { type: 'action', key: 'notification.create', params: {} }]);

  const removeAction = (i: number) =>
    setActions((prev) => prev.filter((_, idx) => idx !== i));

  const updateActionKey = (i: number, key: ActionKey) =>
    setActions((prev) => prev.map((a, idx) => idx === i ? { ...a, key } : a));

  const updateActionParams = (i: number, raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      setActions((prev) => prev.map((a, idx) => idx === i ? { ...a, params: parsed } : a));
    } catch {/* keep previous on parse error */}
  };

  const buildPayload = (): CreateRuleDto | null => {
    if (!name.trim()) { toast.error('Rule name is required'); return null; }
    let parsedTriggerParams: Record<string, unknown> = {};
    try { parsedTriggerParams = JSON.parse(triggerParams); } catch { toast.error('Trigger params must be valid JSON'); return null; }
    return {
      name: name.trim(),
      description: description.trim() || undefined,
      triggerKey,
      triggerParams: parsedTriggerParams,
      steps: actions,
      isActive: true,
    };
  };

  const handleSave = async () => {
    const payload = buildPayload();
    if (!payload) return;
    try {
      if (rule) {
        await updateRule.mutateAsync({ id: rule.id, ...payload });
        toast.success('Rule updated successfully');
      } else {
        await createRule.mutateAsync(payload);
        toast.success('Automation rule created!');
      }
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to save rule');
    }
  };

  const handleDryRun = async () => {
    if (!rule) { toast.info('Save the rule first, then dry-run it'); return; }
    try {
      const r = await dryRun.mutateAsync({ id: rule.id });
      toast.success(`Dry run dispatched — ${r.executionIds.length} execution(s) queued`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Dry run failed');
    }
  };

  const isSaving = createRule.isPending || updateRule.isPending;

  const STEPS = ['Trigger', 'Actions', 'Details'] as const;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col gap-0 p-0">
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            {rule ? 'Edit Automation Rule' : 'New Automation Rule'}
          </SheetTitle>
          <SheetDescription>
            Define when this automation triggers and what actions it performs
          </SheetDescription>

          {/* Step indicator */}
          <div className="flex items-center gap-1 pt-2">
            {STEPS.map((label, i) => {
              const s = (i + 1) as 1 | 2 | 3;
              const active = step === s;
              const done = step > s;
              return (
                <React.Fragment key={label}>
                  <button
                    onClick={() => setStep(s)}
                    className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full transition-colors ${
                      active ? 'bg-primary text-primary-foreground' :
                      done   ? 'bg-emerald-100 text-emerald-700' :
                               'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <span className="font-bold">{done ? '✓' : s}</span>
                    {label}
                  </button>
                  {i < STEPS.length - 1 && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </SheetHeader>

        {/* Body */}
        <ScrollArea className="flex-1 px-6 py-5">

          {/* ── Step 1: Trigger ─────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Choose a trigger event</h3>
              <div className="grid grid-cols-1 gap-2">
                {TRIGGER_KEYS.map((key) => {
                  const meta = TRIGGER_META[key];
                  const active = triggerKey === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setTriggerKey(key)}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        active
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:border-primary/40 hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                          {meta.label}
                        </span>
                        {active && <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{meta.description}</p>
                    </button>
                  );
                })}
              </div>

              {triggerKey === 'task.status.changed' && (
                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-semibold">Filter: Only fire when status changes to</Label>
                  <Select
                    value={(JSON.parse(triggerParams || '{}').toStatus) ?? '__any__'}
                    onValueChange={(v) =>
                      setTriggerParams(v === '__any__' ? '{}' : JSON.stringify({ toStatus: v }))
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__any__">Any status</SelectItem>
                      {['todo', 'in_progress', 'review', 'done', 'cancelled'].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button className="w-full mt-4" onClick={() => setStep(2)}>
                Next: Actions <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* ── Step 2: Actions ─────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Configure actions ({actions.length})
              </h3>

              {actions.map((action, i) => (
                <div key={i} className="border rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b">
                    <span className="text-base">
                      {ACTION_META[action.key]?.icon ?? '⚡'}
                    </span>
                    <span className="text-sm font-medium flex-1">Action {i + 1}</span>
                    {actions.length > 1 && (
                      <button
                        onClick={() => removeAction(i)}
                        className="text-destructive hover:text-destructive/70 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="p-3 space-y-3">
                    <div>
                      <Label className="text-xs mb-1.5 block">Action type</Label>
                      <Select value={action.key} onValueChange={(v) => updateActionKey(i, v as ActionKey)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTION_KEYS.map((k) => (
                            <SelectItem key={k} value={k}>
                              <span className="flex items-center gap-2">
                                <span>{ACTION_META[k].icon}</span>
                                {ACTION_META[k].label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <p className="text-xs text-muted-foreground">{ACTION_META[action.key]?.description}</p>

                    <div>
                      <Label className="text-xs mb-1.5 block">
                        Parameters (JSON)
                        <span className="text-muted-foreground ml-1 font-normal">
                          — use {'{{entityId}}'}, {'{{title}}'} etc.
                        </span>
                      </Label>
                      <Textarea
                        className="font-mono text-xs min-h-[90px]"
                        defaultValue={JSON.stringify(action.params, null, 2)}
                        onBlur={(e) => updateActionParams(i, e.target.value)}
                        placeholder='{"recipients": "assignees", "title": "{{title}} done"}'
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" size="sm" className="w-full" onClick={addAction}>
                <Plus className="h-4 w-4 mr-2" /> Add another action
              </Button>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  ← Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1">
                  Next: Details <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Details ─────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Name & description</h3>

              <div className="space-y-2">
                <Label htmlFor="rule-name">Rule name *</Label>
                <Input
                  id="rule-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Notify team when task is done"
                  className="h-9"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rule-desc">Description</Label>
                <Textarea
                  id="rule-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this automation do?"
                  rows={3}
                />
              </div>

              {/* Summary */}
              <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Summary</p>
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TRIGGER_META[triggerKey]?.color}`}>
                    {getTriggerLabel(triggerKey)}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {actions.map((a, i) => (
                    <React.Fragment key={i}>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                        {ACTION_META[a.key]?.icon} {getActionLabel(a.key)}
                      </span>
                      {i < actions.length - 1 && <span className="text-muted-foreground">+</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  ← Back
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !name.trim()}
                  className="flex-1"
                >
                  {isSaving ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
                  ) : (
                    <>{rule ? 'Update Rule' : 'Create Rule'}</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer dry-run shortcut */}
        {rule && (
          <SheetFooter className="px-6 py-4 border-t shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDryRun}
              disabled={dryRun.isPending}
              className="w-full text-violet-600 hover:text-violet-700 hover:bg-violet-50"
            >
              <FlaskConical className="h-4 w-4 mr-2" />
              Dry-run this rule (no side effects)
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};

// ─── Rule Card ────────────────────────────────────────────────────────────────

const RuleCard: React.FC<{
  rule: AutomationRule;
  onEdit: () => void;
}> = ({ rule, onEdit }) => {
  const toggleRule = useToggleRule();
  const deleteRule = useDeleteRule();
  const dryRun = useDryRunRule();

  const handleToggle = () =>
    toggleRule.mutate(
      { id: rule.id, isActive: !rule.isActive },
      {
        onSuccess: () =>
          toast.success(rule.isActive ? 'Rule paused' : 'Rule activated'),
        onError: () => toast.error('Failed to toggle rule'),
      }
    );

  const handleDelete = () =>
    deleteRule.mutate(rule.id, {
      onSuccess: () => toast.success('Rule deleted'),
      onError: () => toast.error('Failed to delete rule'),
    });

  const handleDryRun = () =>
    dryRun.mutate(
      { id: rule.id },
      {
        onSuccess: (r) =>
          toast.success(`Dry-run dispatched — ${r.executionIds.length} execution(s) queued`),
        onError: () => toast.error('Dry run failed'),
      }
    );

  const triggerMeta = TRIGGER_META[rule.triggerKey as TriggerKey];
  const steps = (rule.steps ?? []) as Array<{ type: string; key?: string }>;
  const actionSteps = steps.filter((s) => s.type === 'action' && s.key);

  return (
    <Card className={`group transition-all hover:shadow-md ${!rule.isActive ? 'opacity-70' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`mt-0.5 p-2.5 rounded-lg shrink-0 ${rule.isActive ? 'bg-amber-100' : 'bg-muted'}`}>
            <Zap className={`h-4 w-4 ${rule.isActive ? 'text-amber-600' : 'text-muted-foreground'}`} />
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold truncate">{rule.name}</span>
              <Badge
                variant="outline"
                className={rule.isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs'
                  : 'bg-gray-50 text-gray-500 border-gray-200 text-xs'
                }
              >
                {rule.isActive ? '● Active' : '○ Paused'}
              </Badge>
              {rule._count?.executions != null && (
                <span className="text-xs text-muted-foreground">
                  {rule._count.executions} run{rule._count.executions !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {rule.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                {rule.description}
              </p>
            )}

            {/* Flow pills */}
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              {triggerMeta && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${triggerMeta.color}`}>
                  {triggerMeta.label}
                </span>
              )}
              {actionSteps.length > 0 && (
                <>
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  {actionSteps.slice(0, 3).map((s, i) => (
                    <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold border border-blue-100">
                      {ACTION_META[s.key as ActionKey]?.icon} {getActionLabel(s.key as ActionKey)}
                    </span>
                  ))}
                  {actionSteps.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{actionSteps.length - 3} more</span>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>v{rule.version}</span>
              <span>·</span>
              <span>{timeAgo(rule.createdAt)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleToggle}
              disabled={toggleRule.isPending}
              title={rule.isActive ? 'Pause' : 'Activate'}
            >
              {rule.isActive
                ? <Pause className="h-4 w-4 text-amber-600" />
                : <Play  className="h-4 w-4 text-emerald-600" />
              }
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDryRun}>
                  <FlaskConical className="h-4 w-4 mr-2" /> Dry Run
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Execution History Tab ────────────────────────────────────────────────────

const ExecutionHistoryTab: React.FC = () => {
  const { data: executions = [], isLoading, refetch } = useAutomationExecutions(undefined, 100);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<string, { ruleId: string; name: string; executions: AutomationExecution[] }> = {};
    for (const e of executions) {
      const key = e.ruleId;
      if (!map[key]) {
        map[key] = { ruleId: key, name: e.rule?.name ?? key, executions: [] };
      }
      map[key].executions.push(e);
    }
    return Object.values(map);
  }, [executions]);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{executions.length} total executions</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : executions.length === 0 ? (
        <div className="text-center py-16">
          <History className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No executions yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Executions appear here after a rule is triggered or dry-run
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {executions.map((e) => {
            const cfg = statusConfig(e.status);
            return (
              <button
                key={e.id}
                onClick={() => setSelectedId(e.id)}
                className="w-full text-left border rounded-lg px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <cfg.Icon className={`h-4 w-4 shrink-0 ${e.status === 'RUNNING' ? 'animate-spin' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">
                        {e.rule?.name ?? e.ruleId}
                      </span>
                      <Badge variant="outline" className={`text-xs ${cfg.className}`}>
                        {cfg.label}
                      </Badge>
                      {e.isDryRun && (
                        <Badge variant="outline" className="text-xs bg-violet-50 text-violet-600 border-violet-200">
                          Dry Run
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span>{timeAgo(e.createdAt)}</span>
                      <span>·</span>
                      <span>{formatDuration(e.durationMs)}</span>
                      {e.errorMessage && (
                        <>
                          <span>·</span>
                          <span className="text-red-500 truncate max-w-[200px]">{e.errorMessage}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedId && (
        <ExecutionDetailModal
          executionId={selectedId}
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AutomationsPage() {
  const { data: rules = [], isLoading, isError, refetch } = useAutomationRules();
  const [search, setSearch] = useState('');
  const [filterTrigger, setFilterTrigger] = useState<string>('all');
  const [editingRule, setEditingRule] = useState<AutomationRule | null | undefined>(undefined);
  // undefined = closed, null = create new, AutomationRule = edit existing

  const filteredRules = useMemo(() => {
    let list = rules;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.triggerKey.includes(q)
      );
    }
    if (filterTrigger !== 'all') {
      list = list.filter((r) => r.triggerKey === filterTrigger);
    }
    return list;
  }, [rules, search, filterTrigger]);

  const stats = useMemo(() => ({
    total: rules.length,
    active: rules.filter((r) => r.isActive).length,
    totalRuns: rules.reduce((sum, r) => sum + (r._count?.executions ?? 0), 0),
  }), [rules]);

  return (
    <div className="flex flex-col h-full">
      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="border-b bg-background px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="h-6 w-6 text-amber-500" />
              Automations
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Automate repetitive work with event-driven rules
            </p>
          </div>
          <Button onClick={() => setEditingRule(null)} className="gap-2">
            <Plus className="h-4 w-4" /> New Rule
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: 'Total Rules',  value: stats.total,    icon: ListChecks,    color: 'text-primary' },
            { label: 'Active',       value: stats.active,   icon: ActivitySquare,color: 'text-emerald-600' },
            { label: 'Total Runs',   value: stats.totalRuns,icon: History,       color: 'text-blue-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="border shadow-none bg-muted/30">
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                <div>
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="rules" className="h-full flex flex-col">
          <div className="px-6 border-b">
            <TabsList className="h-10 bg-transparent gap-0 p-0">
              <TabsTrigger
                value="rules"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-10"
              >
                <ListChecks className="h-4 w-4 mr-1.5" /> Rules
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-10"
              >
                <History className="h-4 w-4 mr-1.5" /> Execution History
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Rules tab ───────────────────────────────────────────────── */}
          <TabsContent value="rules" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full">
              <div className="px-6 py-5 space-y-5">
                {/* Search + filter */}
                <div className="flex gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9 h-9"
                      placeholder="Search rules…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select value={filterTrigger} onValueChange={setFilterTrigger}>
                    <SelectTrigger className="h-9 w-48">
                      <SelectValue placeholder="All triggers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All triggers</SelectItem>
                      {TRIGGER_KEYS.map((k) => (
                        <SelectItem key={k} value={k}>{TRIGGER_META[k].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rule list */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-3 text-sm text-muted-foreground">Loading rules…</span>
                  </div>
                ) : isError ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <p className="text-sm font-medium">Failed to load automation rules</p>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                      <RefreshCw className="h-4 w-4 mr-2" /> Retry
                    </Button>
                  </div>
                ) : filteredRules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="p-4 bg-amber-50 rounded-full">
                      <Zap className="h-8 w-8 text-amber-500" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-lg">
                        {search || filterTrigger !== 'all'
                          ? 'No rules match your search'
                          : 'No automation rules yet'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        {search || filterTrigger !== 'all'
                          ? 'Try adjusting your filters'
                          : 'Create your first rule to automate tasks, notifications, and more'}
                      </p>
                    </div>
                    {!search && filterTrigger === 'all' && (
                      <Button onClick={() => setEditingRule(null)} className="gap-2">
                        <Plus className="h-4 w-4" /> Create your first rule
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRules.map((rule) => (
                      <RuleCard
                        key={rule.id}
                        rule={rule}
                        onEdit={() => setEditingRule(rule)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── History tab ─────────────────────────────────────────────── */}
          <TabsContent value="history" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full">
              <div className="px-6 py-5">
                <ExecutionHistoryTab />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Create/Edit sheet ─────────────────────────────────────────── */}
      <RuleFormSheet
        open={editingRule !== undefined}
        onClose={() => setEditingRule(undefined)}
        rule={editingRule}
      />
    </div>
  );
}
