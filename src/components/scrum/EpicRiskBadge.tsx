import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EpicRiskBadgeProps {
  riskLevel?: string | null;
  riskReason?: string | null;
  size?: 'sm' | 'md';
}

export function EpicRiskBadge({ riskLevel, riskReason, size = 'sm' }: EpicRiskBadgeProps) {
  if (!riskLevel || riskLevel === 'on_track') {
    if (size === 'sm') return null;
    return (
      <Badge variant="outline" className="text-green-600 border-green-300 text-[10px]">
        <CheckCircle2 className="h-3 w-3 mr-1" /> On Track
      </Badge>
    );
  }

  const isCritical = riskLevel === 'critical';

  const badge = (
    <Badge
      variant="destructive"
      className={`text-[10px] ${isCritical ? 'animate-pulse bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}
    >
      {isCritical ? (
        <XCircle className="h-3 w-3 mr-1" />
      ) : (
        <AlertTriangle className="h-3 w-3 mr-1" />
      )}
      {isCritical ? 'Critical' : 'At Risk'}
    </Badge>
  );

  if (!riskReason) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-xs">{riskReason}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
