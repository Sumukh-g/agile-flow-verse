/**
 * Cumulative Flow Diagram Widget
 * 
 * Displays a stacked area chart showing work items across different states over time.
 * 
 * Features:
 * - Stacked area chart with status breakdown
 * - Lead time and cycle time indicators
 * - Interactive tooltips
 * - WIP (Work in Progress) analysis
 * - Performance optimized with useMemo
 * 
 * @component
 */

import React, { useMemo } from 'react';
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Widget } from '@/types/dashboard';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Layers, Clock, AlertCircle } from 'lucide-react';

interface CumulativeFlowWidgetProps {
  widget: Widget;
}

/**
 * Generate mock CFD data for demonstration
 * In production, this would come from the API
 */
const generateCFDData = () => {
  const days = 14;
  const data = [];
  
  let done = 5;
  let review = 3;
  let inProgress = 8;
  let todo = 50;
  
  for (let day = 1; day <= days; day++) {
    // Simulate work flow
    const newItems = Math.floor(Math.random() * 3);
    const completedFromReview = Math.min(review, Math.floor(Math.random() * 3) + 1);
    const movedToReview = Math.min(inProgress, Math.floor(Math.random() * 3) + 1);
    const startedWork = Math.min(todo, Math.floor(Math.random() * 4) + 1);
    
    done += completedFromReview;
    review = review - completedFromReview + movedToReview;
    inProgress = inProgress - movedToReview + startedWork;
    todo = todo - startedWork + newItems;
    
    data.push({
      day: `Day ${day}`,
      Done: done,
      'In Review': review,
      'In Progress': inProgress,
      'To Do': todo,
    });
  }
  
  return data;
};

/**
 * Custom tooltip component for the chart
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
    
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border">
        <p className="font-semibold text-sm mb-2">{label}</p>
        <div className="space-y-1">
          {payload.reverse().map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.name}</span>
              </div>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 text-sm pt-1 border-t mt-1">
            <span className="font-medium">Total</span>
            <span className="font-bold">{total}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CumulativeFlowWidget: React.FC<CumulativeFlowWidgetProps> = ({ widget }) => {
  // Memoize data generation for performance
  const chartData = useMemo(() => {
    return widget.data?.cfdData || generateCFDData();
  }, [widget.data]);
  
  // Calculate flow metrics
  const metrics = useMemo(() => {
    const latest = chartData[chartData.length - 1];
    const wip = (latest?.['In Progress'] || 0) + (latest?.['In Review'] || 0);
    const throughput = latest?.Done || 0;
    const averageLeadTime = Math.round((throughput > 0 ? (wip * 2) / throughput : 0) * 10) / 10;
    
    // Check for bottlenecks
    const hasBottleneck = (latest?.['In Review'] || 0) > (latest?.['In Progress'] || 0) * 0.5;
    
    return {
      wip,
      throughput,
      leadTime: averageLeadTime,
      hasBottleneck,
    };
  }, [chartData]);

  // Status colors
  const statusColors = {
    'Done': '#22c55e',
    'In Review': '#8b5cf6',
    'In Progress': '#3b82f6',
    'To Do': '#94a3b8',
  };

  return (
    <>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-600" />
              {widget.title || 'Cumulative Flow'}
            </CardTitle>
            <CardDescription>Work distribution across states over time</CardDescription>
          </div>
          {metrics.hasBottleneck && (
            <Badge variant="destructive" className="bg-amber-100 text-amber-800">
              <AlertCircle className="h-3 w-3 mr-1" />
              Review Bottleneck
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-xs text-muted-foreground">WIP</p>
            <p className="text-lg font-bold text-blue-600">{metrics.wip}</p>
            <p className="text-xs text-muted-foreground">items</p>
          </div>
          <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-xs text-muted-foreground">Throughput</p>
            <p className="text-lg font-bold text-green-600">{metrics.throughput}</p>
            <p className="text-xs text-muted-foreground">completed</p>
          </div>
          <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-xs text-muted-foreground">Lead Time</p>
            <p className="text-lg font-bold text-purple-600">{metrics.leadTime}</p>
            <p className="text-xs text-muted-foreground">days avg</p>
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '11px' }}
                iconType="rect"
                iconSize={10}
              />
              <Area
                type="monotone"
                dataKey="To Do"
                stackId="1"
                stroke={statusColors['To Do']}
                fill={statusColors['To Do']}
                fillOpacity={0.8}
              />
              <Area
                type="monotone"
                dataKey="In Progress"
                stackId="1"
                stroke={statusColors['In Progress']}
                fill={statusColors['In Progress']}
                fillOpacity={0.8}
              />
              <Area
                type="monotone"
                dataKey="In Review"
                stackId="1"
                stroke={statusColors['In Review']}
                fill={statusColors['In Review']}
                fillOpacity={0.8}
              />
              <Area
                type="monotone"
                dataKey="Done"
                stackId="1"
                stroke={statusColors['Done']}
                fill={statusColors['Done']}
                fillOpacity={0.8}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </>
  );
};

export default CumulativeFlowWidget;

