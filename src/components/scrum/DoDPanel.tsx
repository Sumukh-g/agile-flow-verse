import React, { useState } from 'react';
import { CheckCircle2, Circle, Settings, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useDoD, useSetDoD, useDoDChecks, useToggleDoDCheck, useDoDStatus, DoDItem } from '@/hooks/useDoD';

interface DoDPanelProps {
  projectId: string;
  cardId?: string;
  mode: 'config' | 'check';
  onClose?: () => void;
}

export function DoDPanel({ projectId, cardId, mode, onClose }: DoDPanelProps) {
  const { data: dodData } = useDoD(projectId);
  const { data: checks } = useDoDChecks(cardId);
  const { data: status } = useDoDStatus(cardId);
  const setDoD = useSetDoD();
  const toggleCheck = useToggleDoDCheck();

  const [newItemLabel, setNewItemLabel] = useState('');
  const [editItems, setEditItems] = useState<DoDItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const items = dodData?.items || [];

  const startEditing = () => {
    setEditItems([...items]);
    setIsEditing(true);
  };

  const addItem = () => {
    if (!newItemLabel.trim()) return;
    setEditItems([...editItems, { id: crypto.randomUUID(), label: newItemLabel.trim(), required: true }]);
    setNewItemLabel('');
  };

  const removeItem = (id: string) => {
    setEditItems(editItems.filter(i => i.id !== id));
  };

  const saveDoD = () => {
    setDoD.mutate({ projectId, items: editItems });
    setIsEditing(false);
  };

  if (mode === 'config') {
    return (
      <Card className="border-2 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-blue-600" />
            Definition of Done
          </CardTitle>
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={startEditing}>
              <Settings className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-3">
              {editItems.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <Switch checked={item.required} onCheckedChange={(checked) => {
                    setEditItems(editItems.map(i => i.id === item.id ? { ...i, required: checked } : i));
                  }} />
                  <span className="flex-1 text-sm">{item.label}</span>
                  <Badge variant={item.required ? 'default' : 'secondary'} className="text-xs">
                    {item.required ? 'Required' : 'Optional'}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.id)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add DoD item..."
                  value={newItemLabel}
                  onChange={e => setNewItemLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addItem()}
                  className="h-8 text-sm"
                />
                <Button size="sm" onClick={addItem}>Add</Button>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button size="sm" onClick={saveDoD} disabled={setDoD.isPending}>Save</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No DoD items configured yet.</p>
              ) : (
                items.map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{item.label}</span>
                    {item.required && <Badge variant="outline" className="text-[10px] px-1">Required</Badge>}
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const checkedMap = new Map((checks || []).map(c => [c.itemId, c.checked]));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4" /> Definition of Done
        </h4>
        {status && (
          <Badge variant={status.complete ? 'default' : 'destructive'} className="text-xs">
            {status.complete ? 'Complete' : `${status.missing.length} missing`}
          </Badge>
        )}
        {onClose && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      <ScrollArea className="max-h-[200px]">
        <div className="space-y-2">
          {items.map(item => {
            const isChecked = checkedMap.get(item.id) || false;
            return (
              <button
                key={item.id}
                onClick={() => cardId && toggleCheck.mutate({ cardId, itemId: item.id })}
                className="flex items-center gap-2 text-sm w-full text-left hover:bg-muted/50 rounded px-2 py-1 transition-colors"
              >
                {isChecked ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className={isChecked ? 'line-through text-muted-foreground' : ''}>{item.label}</span>
                {item.required && !isChecked && (
                  <Badge variant="destructive" className="text-[10px] px-1 ml-auto">Required</Badge>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
