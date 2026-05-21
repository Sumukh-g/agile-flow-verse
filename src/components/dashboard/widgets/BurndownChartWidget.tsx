/**
 * Burndown Chart Widget
 * 
 * Displays a sprint burndown chart showing planned vs actual progress.
 * 
 * Features:
 * - Interactive line chart with planned/actual lines
 * - Ideal burndown reference line
 * - Hover tooltips with detailed information
 * - Responsive design
 * - Performance optimized with useMemo
 * 
 * @component
 */

import React, { useMemo } from 'react';
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Widget } from '@/types/dashboard';
import { useBurndownReport } from '@/hooks/useReports';
import { format, subDays } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingDown, Calendar, Target, RefreshCw, AlertTriangle } from 'lucide-react';

interface BurndownChartWidgetProps {
  widget: Widget;
}

/**
 * Generate mock burndown data for demonstration
 * In production, this would come from the API
 */
const generateBurndownData = () => {
  const sprintDays = 14;
  const totalPoints = 100;
  const data = [];
  
  let remainingIdeal = totalPoints;
  let remainingActual = totalPoints;
  const dailyBurnIdeal = totalPoints / sprintDays;
  
  for (let day = 0; day <= sprintDays; day++) {
    // Add some variance to actual progress
    const variance = Math.random() * 10 - 3;
    remainingActual = Math.max(0, remainingActual - dailyBurnIdeal + variance);
    remainingIdeal = Math.max(0, totalPoints - (day * dailyBurnIdeal));
    
    data.push({
      day: `Day ${day}`,
      ideal: Math.round(remainingIdeal),
      actual: Math.round(remainingActual),
      planned: day <= 10 ? Math.round(remainingActual) : null, // Show actual only up to current day
    });
  }
  
  return data;
};

/**
 * Custom tooltip component for the chart
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{entry.value} points</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const BurndownChartWidget: React.FC<BurndownChartWidgetProps> = ({ widget }) => {
  // Get project ID and date range from widget data or use defaults
  const projectId = widget.data?.projectId;
  const startDate = widget.data?.startDate || format(subDays(new Date(), 14), 'yyyy-MM-dd');
  const endDate = widget.data?.endDate || format(new Date(), 'yyyy-MM-dd');
  
  // Fetch real data from API if projectId is provided, otherwise use widget.data or fallback to mock
  const { 
    data: apiData, 
    isLoading, 
    error 
  } = useBurndownReport(projectId, startDate, endDate, 'day');
  
  // Transform and memoize chart data
  const chartData = useMemo(() => {
    // If widget has explicit data, use it
    if (widget.data?.burndownData && Array.isArray(widget.data.burndownData)) {
      return widget.data.burndownData;
    }
    
    // If API data is available, transform it
    if (apiData?.data && Array.isArray(apiData.data)) {
      return apiData.data.map((item: any) => ({
        day: format(new Date(item.date), 'MMM dd'),
        ideal: item.ideal || 0,
        actual: item.actual || item.remaining || 0,
        remaining: item.remaining || 0,
      }));
    }
    
    // Fallback to mock data for demonstration
    return generateBurndownData();
  }, [widget.data, apiData]);
  
  // Calculate sprint progress metrics
  const metrics = useMemo(() => {
    const current = chartData[chartData.length - 5] || chartData[chartData.length - 1];
    const ideal = chartData[chartData.length - 5]?.ideal || 0;
    const actual = current?.actual || 0;
    const variance = actual - ideal;
    const isOnTrack = variance <= 5;
    
    return {
      remainingPoints: actual,
      variance: Math.abs(variance),
      isOnTrack,
      daysRemaining: 4,
    };
  }, [chartData]);

  return (
    <>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-blue-600" />
              {widget.title || 'Sprint Burndown'}
            </CardTitle>
            <CardDescription>Track sprint progress against ideal burndown</CardDescription>
          </div>
          <Badge 
            variant={metrics.isOnTrack ? "default" : "destructive"}
            className={metrics.isOnTrack ? "bg-green-100 text-green-800" : ""}
          >
            {metrics.isOnTrack ? 'On Track' : 'Behind Schedule'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading burndown data...</p>
            </div>
          </div>
        )}
        
        {/* Error State */}
        {error && !isLoading && (
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
              <p className="text-sm text-muted-foreground">Failed to load burndown data</p>
              <p className="text-xs text-muted-foreground mt-1">Using demo data</p>
            </div>
          </div>
        )}
        
        {/* Chart Content - Only show if not loading */}
        {!isLoading && (
          <>
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="text-lg font-bold text-blue-600">{metrics.remainingPoints}</p>
            <p className="text-xs text-muted-foreground">points</p>
          </div>
          <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-xs text-muted-foreground">Variance</p>
            <p className={`text-lg font-bold ${metrics.isOnTrack ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.variance > 0 ? '+' : ''}{metrics.variance}
            </p>
            <p className="text-xs text-muted-foreground">points</p>
          </div>
          <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-xs text-muted-foreground">Days Left</p>
            <p className="text-lg font-bold text-purple-600">{metrics.daysRemaining}</p>
            <p className="text-xs text-muted-foreground">days</p>
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="day" 
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
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                iconType="circle"
                iconSize={8}
              />
              {/* Ideal Burndown Line */}
              <Line
                type="linear"
                dataKey="ideal"
                name="Ideal"
                stroke="#94a3b8"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
              />
              {/* Actual Progress Line */}
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 3 }}
                activeDot={{ r: 5, fill: '#2563eb' }}
              />
              {/* Today marker */}
              <ReferenceLine
                x="Day 10"
                stroke="#f59e0b"
                strokeDasharray="3 3"
                label={{ value: 'Today', fontSize: 10, fill: '#f59e0b' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
          </>
        )}
      </CardContent>
    </>
  );
};

export default BurndownChartWidget;

