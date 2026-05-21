import React from 'react';
import { Sparkles, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAiRecommendSprint, SprintRecommendation } from '@/hooks/useAiSprint';

interface SprintPlannerPanelProps {
  sprintId: string;
  projectId: string;
  onSelectItems?: (itemIds: string[]) => void;
}

export function SprintPlannerPanel({ sprintId, projectId, onSelectItems }: SprintPlannerPanelProps) {
  const recommendMutation = useAiRecommendSprint();

  const handleRecommend = () => {
    recommendMutation.mutate({ sprintId, projectId });
  };

  const data = recommendMutation.data;

  if (!data) {
    return (
      <Card className="border-dashed border-2 border-purple-200 dark:border-purple-800">
        <CardContent className="pt-6 text-center space-y-3">
          <Sparkles className="h-8 w-8 mx-auto text-purple-500" />
          <div>
            <h4 className="text-sm font-medium">AI Sprint Planning</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Let AI analyze your backlog, velocity, and epic deadlines to recommend the best items for this sprint.
            </p>
          </div>
          <Button onClick={handleRecommend} disabled={recommendMutation.isPending} className="gap-2">
            <Sparkles className="h-4 w-4" />
            {recommendMutation.isPending ? 'Analyzing...' : 'AI Suggest Sprint Items'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const rec = data.recommendation;

  return (
    <Card className="border-2 border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" /> AI Recommendation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/50 rounded p-2">
            <div className="text-lg font-bold">{rec.selectedItemIds.length}</div>
            <div className="text-[10px] text-muted-foreground">Items</div>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <div className="text-lg font-bold">{rec.totalPoints || rec.capacityUsed}</div>
            <div className="text-[10px] text-muted-foreground">Points</div>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <div className="text-lg font-bold">{data.velocity.recommended}</div>
            <div className="text-[10px] text-muted-foreground">Capacity</div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{rec.reasoning}</p>

        {rec.risks && rec.risks.length > 0 && (
          <div className="space-y-1">
            {rec.risks.map((risk, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs">
                <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                <span>{risk}</span>
              </div>
            ))}
          </div>
        )}

        <ScrollArea className="max-h-[200px]">
          <div className="space-y-1">
            {data.backlogItems
              .filter(item => rec.selectedItemIds.includes(item.id))
              .map(item => (
                <div key={item.id} className="flex items-center gap-2 text-xs p-1.5 rounded bg-purple-50 dark:bg-purple-950/30">
                  <CheckCircle2 className="h-3 w-3 text-purple-600 shrink-0" />
                  <span className="flex-1 truncate">{item.title}</span>
                  <Badge variant="outline" className="text-[10px]">{item.storyPoints} pts</Badge>
                </div>
              ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => onSelectItems?.(rec.selectedItemIds)}>
            <Target className="h-3.5 w-3.5 mr-1" /> Apply Selection
          </Button>
          <Button size="sm" variant="outline" onClick={handleRecommend} disabled={recommendMutation.isPending}>
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
