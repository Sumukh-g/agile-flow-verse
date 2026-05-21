import React from 'react';
import { Sparkles, MessageCircle, AlertCircle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAiRetroInsights, RetroInsights } from '@/hooks/useAiSprint';

interface RetroInsightsPanelProps {
  sprintId: string;
  onApply?: (insights: RetroInsights) => void;
}

export function RetroInsightsPanel({ sprintId, onApply }: RetroInsightsPanelProps) {
  const retroMutation = useAiRetroInsights();

  const handleGenerate = () => {
    retroMutation.mutate({ sprintId });
  };

  if (!retroMutation.data) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleGenerate}
        disabled={retroMutation.isPending}
        className="gap-2"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {retroMutation.isPending ? 'Generating...' : 'AI Retro Insights'}
      </Button>
    );
  }

  const insights = retroMutation.data;

  return (
    <div className="space-y-3 p-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" /> AI Retro Insights
        </h4>
        <Button variant="ghost" size="sm" onClick={() => onApply?.(insights)} className="text-xs">
          Apply All
        </Button>
      </div>

      {insights.prompts.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <MessageCircle className="h-3 w-3" /> Discussion Prompts
          </div>
          {insights.prompts.map((prompt, i) => (
            <div key={i} className="text-xs p-2 rounded bg-white dark:bg-gray-900 border">
              {prompt}
            </div>
          ))}
        </div>
      )}

      {insights.patterns.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Recurring Patterns
          </div>
          {insights.patterns.map((pattern, i) => (
            <Badge key={i} variant="outline" className="text-[10px] mr-1">{pattern}</Badge>
          ))}
        </div>
      )}

      {insights.recommendedActionItems.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Lightbulb className="h-3 w-3" /> Recommended Actions
          </div>
          {insights.recommendedActionItems.map((action, i) => (
            <div key={i} className="text-xs p-1.5 rounded bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              {action}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
