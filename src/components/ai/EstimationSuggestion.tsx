import React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAiEstimatePoints, StoryPointEstimate } from '@/hooks/useAiEstimation';

interface EstimationSuggestionProps {
  projectId: string;
  title: string;
  description?: string;
  onAccept?: (points: number) => void;
}

export function EstimationSuggestion({ projectId, title, description, onAccept }: EstimationSuggestionProps) {
  const estimateMutation = useAiEstimatePoints();

  const handleEstimate = () => {
    if (title.trim().length < 3) return;
    estimateMutation.mutate({ projectId, title, description });
  };

  const data = estimateMutation.data;

  if (!data) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleEstimate}
        disabled={estimateMutation.isPending || title.trim().length < 3}
        className="gap-1 text-xs h-7"
      >
        <Sparkles className="h-3 w-3" />
        {estimateMutation.isPending ? 'Estimating...' : 'AI Estimate'}
      </Button>
    );
  }

  if (!data.estimate) {
    return <span className="text-xs text-muted-foreground">Not enough data</span>;
  }

  const confidenceColor = data.confidence === 'high' ? 'text-green-600' :
    data.confidence === 'medium' ? 'text-amber-600' : 'text-red-600';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 h-7" onClick={() => onAccept?.(data.estimate!)}>
            <Sparkles className="h-3 w-3 text-purple-500" />
            <span className="font-bold">{data.estimate}</span>
            <span className="text-[10px] text-muted-foreground">pts</span>
            <Badge variant="outline" className={`text-[10px] ${confidenceColor}`}>{data.confidence}</Badge>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="text-xs">{data.reasoning}</p>
            <p className="text-[10px] text-muted-foreground">Range: {data.range[0]}–{data.range[1]} pts</p>
            {data.similarCards.length > 0 && (
              <div className="text-[10px]">
                Similar: {data.similarCards.map(c => `${c.title} (${c.points}pts)`).join(', ')}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
