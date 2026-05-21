import React from 'react';
import { Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useCapacityVsLoad, CapacityVsLoad } from '@/hooks/useCapacity';

interface CapacityPlannerProps {
  sprintId: string | undefined;
  compact?: boolean;
}

export function CapacityPlanner({ sprintId, compact }: CapacityPlannerProps) {
  const { data, isLoading } = useCapacityVsLoad(sprintId);

  if (isLoading || !data) {
    return compact ? null : (
      <Card>
        <CardContent className="pt-4 text-center text-sm text-muted-foreground">
          Loading capacity...
        </CardContent>
      </Card>
    );
  }

  const utilColor = data.utilizationPercent > 100 ? 'text-red-600' :
    data.utilizationPercent > 85 ? 'text-amber-600' : 'text-green-600';

  const progressColor = data.utilizationPercent > 100 ? 'bg-red-500' :
    data.utilizationPercent > 85 ? 'bg-amber-500' : 'bg-green-500';

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Users className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">
              {data.committedLoad}h / {Math.round(data.totalHours)}h capacity
            </span>
            <span className={`text-xs font-medium ${utilColor}`}>
              {data.utilizationPercent}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div className={`${progressColor} h-1.5 rounded-full transition-all`}
              style={{ width: `${Math.min(data.utilizationPercent, 100)}%` }} />
          </div>
        </div>
        {data.utilizationPercent > 100 && (
          <AlertTriangle className="h-4 w-4 text-red-500" />
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Sprint Capacity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xl font-bold">{data.committedPoints}</div>
            <div className="text-xs text-muted-foreground">Committed pts</div>
          </div>
          <div>
            <div className="text-xl font-bold">{Math.round(data.totalHours)}</div>
            <div className="text-xs text-muted-foreground">Available hours</div>
          </div>
          <div>
            <div className={`text-xl font-bold ${utilColor}`}>{data.utilizationPercent}%</div>
            <div className="text-xs text-muted-foreground">Utilization</div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Capacity Utilization</span>
            {data.utilizationPercent > 100 && (
              <Badge variant="destructive" className="text-[10px]">Over-committed</Badge>
            )}
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className={`${progressColor} h-2 rounded-full transition-all`}
              style={{ width: `${Math.min(data.utilizationPercent, 100)}%` }} />
          </div>
        </div>

        {data.capacities.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">Team Members</div>
            {data.capacities.map(c => {
              const workDays = Math.max(0, data.sprintDays - c.leaveDays);
              const hours = workDays * c.dailyHours;
              return (
                <div key={c.id} className="flex items-center justify-between text-xs">
                  <span>{c.user?.name || c.userId}</span>
                  <span className="text-muted-foreground">
                    {hours}h ({c.dailyHours}h/d, {c.leaveDays > 0 ? `${c.leaveDays}d off` : 'no leave'})
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          ~{data.avgHoursPerPoint} hours per story point (based on past sprints)
        </div>
      </CardContent>
    </Card>
  );
}
