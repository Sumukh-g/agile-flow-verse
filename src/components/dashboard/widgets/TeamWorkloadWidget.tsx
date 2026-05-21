/**
 * Team Workload Widget
 * 
 * Displays team member workload distribution with capacity indicators.
 * 
 * Features:
 * - Horizontal bar chart showing workload per team member
 * - Capacity threshold indicators (under/optimal/over)
 * - Avatar integration for team members
 * - Drill-down capability to see task breakdown
 * - Performance optimized with useMemo
 * 
 * @component
 */

import React, { useMemo, useState } from 'react';
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Widget } from '@/types/dashboard';
import { useCapacityReport } from '@/hooks/useReports';
import { format, subDays } from 'date-fns';
import { Users, AlertTriangle, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';

interface TeamWorkloadWidgetProps {
  widget: Widget;
}

interface TeamMember {
  id?: string;
  userId?: string;
  name: string;
  avatar?: string;
  assignedTasks?: number;
  assignedHours?: number;
  completedTasks?: number;
  capacity: number; // Maximum recommended tasks/hours
  utilization: number;
  loggedHours?: number;
  storyPoints?: number;
}

/**
 * Generate mock team workload data for demonstration
 * In production, this would come from the API
 */
const generateTeamWorkloadData = (): TeamMember[] => {
  return [
    { id: '1', name: 'Alice Smith', assignedTasks: 8, completedTasks: 5, capacity: 10, storyPoints: 21 },
    { id: '2', name: 'Bob Johnson', assignedTasks: 12, completedTasks: 7, capacity: 10, storyPoints: 34 },
    { id: '3', name: 'Carol Williams', assignedTasks: 6, completedTasks: 4, capacity: 10, storyPoints: 18 },
    { id: '4', name: 'David Brown', assignedTasks: 9, completedTasks: 8, capacity: 10, storyPoints: 25 },
    { id: '5', name: 'Eva Martinez', assignedTasks: 5, completedTasks: 3, capacity: 10, storyPoints: 13 },
    { id: '6', name: 'Frank Lee', assignedTasks: 11, completedTasks: 6, capacity: 10, storyPoints: 28 },
  ];
};

/**
 * Get workload status based on capacity utilization
 */
const getWorkloadStatus = (assigned: number, capacity: number) => {
  const utilization = (assigned / capacity) * 100;
  
  if (utilization < 60) {
    return { status: 'underutilized', color: 'text-amber-600', bg: 'bg-amber-100', label: 'Under' };
  } else if (utilization <= 100) {
    return { status: 'optimal', color: 'text-green-600', bg: 'bg-green-100', label: 'Optimal' };
  } else {
    return { status: 'overloaded', color: 'text-red-600', bg: 'bg-red-100', label: 'Over' };
  }
};

/**
 * Get progress bar color based on utilization
 */
const getProgressColor = (assigned: number, capacity: number) => {
  const utilization = (assigned / capacity) * 100;
  
  if (utilization < 60) return 'bg-amber-500';
  if (utilization <= 100) return 'bg-green-500';
  return 'bg-red-500';
};

const TeamWorkloadWidget: React.FC<TeamWorkloadWidgetProps> = ({ widget }) => {
  const [showAll, setShowAll] = useState(false);
  
  // Get project ID and date range from widget data or use defaults
  const projectId = widget.data?.projectId;
  const startDate = widget.data?.startDate || format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const endDate = widget.data?.endDate || format(new Date(), 'yyyy-MM-dd');
  
  // Fetch real data from API if projectId is provided
  const { 
    data: apiData, 
    isLoading, 
    error 
  } = useCapacityReport(projectId, startDate, endDate);
  
  // Transform and memoize team data
  const teamData = useMemo(() => {
    // If widget has explicit data, use it
    if (widget.data?.teamWorkload && Array.isArray(widget.data.teamWorkload)) {
      return widget.data.teamWorkload;
    }
    
    // If API data is available, transform it
    if (apiData?.data && Array.isArray(apiData.data)) {
      return apiData.data.map((item: any) => ({
        userId: item.userId,
        name: item.userName || item.name || 'Unknown',
        assignedHours: item.assignedHours || 0,
        capacity: item.capacity || 40, // Default to 40 hours/week
        utilization: item.utilization || 0,
        loggedHours: item.loggedHours || 0,
        // Convert hours to approximate tasks (assuming 4 hours per task)
        assignedTasks: Math.round((item.assignedHours || 0) / 4),
      }));
    }
    
    // Fallback to mock data for demonstration
    return generateTeamWorkloadData();
  }, [widget.data, apiData]);
  
  // Calculate team metrics
  const metrics = useMemo(() => {
    const overloaded = teamData.filter((m: TeamMember) => (m.utilization || 0) > 100).length;
    const underutilized = teamData.filter((m: TeamMember) => (m.utilization || 0) < 60).length;
    const totalUtilization = teamData.reduce((sum: number, m: TeamMember) => sum + (m.utilization || 0), 0);
    const avgUtilization = teamData.length > 0 ? Math.round(totalUtilization / teamData.length) : 0;
    
    return {
      overloaded,
      underutilized,
      avgUtilization,
      totalMembers: teamData.length,
    };
  }, [teamData]);
  
  // Sort by workload (overloaded first)
  const sortedTeam = useMemo(() => {
    return [...teamData].sort((a: TeamMember, b: TeamMember) => {
      const aUtil = a.utilization || 0;
      const bUtil = b.utilization || 0;
      return bUtil - aUtil; // Descending
    });
  }, [teamData]);
  
  // Show limited members unless expanded
  const displayedMembers = showAll ? sortedTeam : sortedTeam.slice(0, 4);

  return (
    <>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              {widget.title || 'Team Workload'}
            </CardTitle>
            <CardDescription>Workload distribution across team members</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {metrics.overloaded > 0 && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {metrics.overloaded} overloaded
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading team workload data...</p>
            </div>
          </div>
        )}
        
        {/* Error State */}
        {error && !isLoading && (
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
              <p className="text-sm text-muted-foreground">Failed to load workload data</p>
              <p className="text-xs text-muted-foreground mt-1">Using demo data</p>
            </div>
          </div>
        )}
        
        {/* Content - Only show if not loading */}
        {!isLoading && (
          <>
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-xs text-muted-foreground">Avg Utilization</p>
            <p className={`text-lg font-bold ${
              metrics.avgUtilization > 100 ? 'text-red-600' : 
              metrics.avgUtilization >= 60 ? 'text-green-600' : 'text-amber-600'
            }`}>
              {metrics.avgUtilization}%
            </p>
          </div>
          <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-xs text-muted-foreground">Overloaded</p>
            <p className="text-lg font-bold text-red-600">{metrics.overloaded}</p>
          </div>
          <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-xs text-muted-foreground">Available</p>
            <p className="text-lg font-bold text-amber-600">{metrics.underutilized}</p>
          </div>
        </div>
        
        {/* Team Members List */}
        <div className="space-y-3">
          {displayedMembers.map((member: TeamMember) => {
            const utilization = member.utilization || 0;
            const capacity = member.capacity || 40;
            const assigned = member.assignedHours || member.assignedTasks || 0;
            const workloadStatus = getWorkloadStatus(assigned, capacity);
            const progressColor = getProgressColor(assigned, capacity);
            
            return (
              <div key={member.id} className="flex items-center gap-3">
                {/* Avatar */}
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                {/* Name and Progress */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">{member.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {Math.round(utilization)}%
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${workloadStatus.bg} ${workloadStatus.color} border-0`}
                      >
                        {workloadStatus.label}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-2 rounded-full overflow-hidden bg-secondary">
                    <div
                      className={`h-full transition-all duration-300 ${progressColor}`}
                      style={{ width: `${Math.min(100, utilization)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Show More/Less Button */}
        {teamData.length > 4 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show Less' : `Show ${teamData.length - 4} More`}
            <ArrowRight className={`h-4 w-4 ml-1 transition-transform ${showAll ? 'rotate-90' : ''}`} />
          </Button>
        )}
          </>
        )}
      </CardContent>
    </>
  );
};

export default TeamWorkloadWidget;

