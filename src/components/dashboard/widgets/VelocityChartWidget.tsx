/**
 * Velocity Chart Widget
 * 
 * Displays team velocity across sprints with trend analysis.
 * 
 * Features:
 * - Bar chart showing completed story points per sprint
 * - Average velocity line overlay
 * - Trend indicator (improving/declining)
 * - Sprint comparison
 * - Performance optimized with useMemo
 * 
 * @component
 */

import React, { useMemo } from 'react';
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Widget } from '@/types/dashboard';
import { useVelocityReport } from '@/hooks/useReports';
import { format, subDays } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { TrendingUp, Zap, ArrowUp, ArrowDown, Minus, RefreshCw, AlertTriangle } from 'lucide-react';

interface VelocityChartWidgetProps {
  widget: Widget;
}

/**
 * Custom tooltip component for the chart
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const completionRate = ((data.completed / data.committed) * 100).toFixed(0);
    
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border">
        <p className="font-semibold text-sm mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Completed:</span>
            <span className="font-medium">{data.completed} pts</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-slate-300" />
            <span className="text-muted-foreground">Committed:</span>
            <span className="font-medium">{data.committed} pts</span>
          </div>
          <div className="flex items-center gap-2 text-sm pt-1 border-t mt-1">
            <span className="text-muted-foreground">Completion:</span>
            <span className={`font-medium ${Number(completionRate) >= 90 ? 'text-green-600' : Number(completionRate) >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
              {completionRate}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const VelocityChartWidget: React.FC<VelocityChartWidgetProps> = ({ widget }) => {
  // Get project ID and date range from widget data or use defaults
  const projectId = widget.data?.projectId;
  const startDate = widget.data?.startDate || format(subDays(new Date(), 90), 'yyyy-MM-dd');
  const endDate = widget.data?.endDate || format(new Date(), 'yyyy-MM-dd');
  
  // Fetch real data from API if projectId is provided
  const { 
    data: apiData, 
    isLoading, 
    error 
  } = useVelocityReport(projectId, startDate, endDate);
  
  // Transform and memoize chart data
  const chartData = useMemo(() => {
    // If widget has explicit data, use it
    if (widget.data?.velocityData && Array.isArray(widget.data.velocityData)) {
      return widget.data.velocityData;
    }
    
    // If API data is available, transform it
    if (apiData?.data && Array.isArray(apiData.data)) {
      return apiData.data.map((item: any, index: number) => ({
        sprint: item.sprint || `Sprint ${index + 1}`,
        completed: item.completed || item.velocity || 0,
        committed: item.committed || item.planned || 0,
        velocity: item.velocity || item.completed || 0,
      }));
    }
    
    // No real data available — show an empty state rather than fabricated data.
    return [];
  }, [widget.data, apiData]);

  const hasData = chartData.length > 0;
  
  // Calculate velocity metrics (guarded against empty data)
  const metrics = useMemo(() => {
    const velocities = chartData.map((d: any) => d.completed);
    if (velocities.length === 0) {
      return { average: 0, current: 0, best: 0, trend: 'stable' as const, trendPercent: '0.0' };
    }
    const average = velocities.reduce((a: number, b: number) => a + b, 0) / velocities.length;
    const lastThree = velocities.slice(-3);
    const lastThreeAvg = lastThree.reduce((a: number, b: number) => a + b, 0) / lastThree.length;
    const previousThree = velocities.slice(-6, -3);
    const previousThreeAvg = previousThree.length > 0 
      ? previousThree.reduce((a: number, b: number) => a + b, 0) / previousThree.length 
      : average;
    
    const trend = lastThreeAvg > previousThreeAvg ? 'up' : lastThreeAvg < previousThreeAvg ? 'down' : 'stable';
    const trendPercent = previousThreeAvg > 0
      ? Math.abs(((lastThreeAvg - previousThreeAvg) / previousThreeAvg) * 100)
      : 0;
    
    return {
      average: Math.round(average),
      current: velocities[velocities.length - 1],
      best: Math.max(...velocities),
      trend,
      trendPercent: trendPercent.toFixed(1),
    };
  }, [chartData]);

  // Get trend icon and color
  const getTrendInfo = () => {
    switch (metrics.trend) {
      case 'up':
        return { icon: ArrowUp, color: 'text-green-600', bg: 'bg-green-100', label: 'Improving' };
      case 'down':
        return { icon: ArrowDown, color: 'text-red-600', bg: 'bg-red-100', label: 'Declining' };
      default:
        return { icon: Minus, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Stable' };
    }
  };
  
  const trendInfo = getTrendInfo();
  const TrendIcon = trendInfo.icon;

  return (
    <>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              {widget.title || 'Team Velocity'}
            </CardTitle>
            <CardDescription>Story points completed per sprint</CardDescription>
          </div>
          <Badge className={`${trendInfo.bg} ${trendInfo.color}`}>
            <TrendIcon className="h-3 w-3 mr-1" />
            {trendInfo.label} ({metrics.trendPercent}%)
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading velocity data...</p>
            </div>
          </div>
        )}
        
        {/* Error State */}
        {error && !isLoading && (
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
              <p className="text-sm text-muted-foreground">Failed to load velocity data</p>
            </div>
          </div>
        )}

        {/* Empty State - no data and no error */}
        {!isLoading && !error && !hasData && (
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-center">
              <Zap className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No velocity data yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Complete sprints to build a velocity history.
              </p>
            </div>
          </div>
        )}
        
        {/* Chart Content - Only show if not loading and we have data */}
        {!isLoading && !error && hasData && (
          <>
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-xs text-muted-foreground">Average</p>
            <p className="text-lg font-bold text-blue-600">{metrics.average}</p>
            <p className="text-xs text-muted-foreground">pts/sprint</p>
          </div>
          <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-lg font-bold text-green-600">{metrics.current}</p>
            <p className="text-xs text-muted-foreground">points</p>
          </div>
          <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-xs text-muted-foreground">Best</p>
            <p className="text-lg font-bold text-purple-600">{metrics.best}</p>
            <p className="text-xs text-muted-foreground">points</p>
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="sprint" 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={false}
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Average Reference Line */}
              <ReferenceLine
                y={metrics.average}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                label={{ 
                  value: `Avg: ${metrics.average}`, 
                  fontSize: 10, 
                  fill: '#f59e0b',
                  position: 'right'
                }}
              />
              <Bar 
                dataKey="completed" 
                name="Completed" 
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.completed >= metrics.average ? '#22c55e' : '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
          </>
        )}
      </CardContent>
    </>
  );
};

export default VelocityChartWidget;

