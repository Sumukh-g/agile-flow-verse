/**
 * ProjectBoardView Component
 * 
 * Provides a unified view for project boards including:
 * - Kanban board for task management
 * - Gantt chart for timeline visualization
 * - Dashboard for overview metrics
 * 
 * All board views share the same underlying project data
 * ensuring consistency across different visualizations.
 * 
 * @author AgileFlowVerse Team
 */

import GanttBoard from '@/components/boards/GanttBoard';
import KanbanBoard from '@/components/boards/KanbanBoard';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Calendar,
    CheckCircle2,
    Clock,
    Columns,
    LayoutDashboard,
    ListChecks,
    Target,
    TrendingUp,
    Trello
} from 'lucide-react';
import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useKanbanColumns, useKanbanCards } from '@/hooks/useKanban';

/**
 * Props for ProjectBoardView component
 */
interface ProjectBoardViewProps {
  /** The ID of the project to display boards for */
  projectId?: string;
}

/**
 * Available board view types
 * Each type provides a different visualization of project data
 */
const BOARD_TYPES = [
  { 
    id: 'kanban', 
    name: 'Kanban Board', 
    icon: Trello, 
    description: 'Visual task management with drag-and-drop',
    gradient: 'from-indigo-500 to-purple-600'
  },
  { 
    id: 'gantt', 
    name: 'Gantt Chart', 
    icon: Calendar, 
    description: 'Timeline visualization and scheduling',
    gradient: 'from-emerald-500 to-teal-600'
  },
  { 
    id: 'dashboard', 
    name: 'Dashboard', 
    icon: LayoutDashboard, 
    description: 'Overview metrics and insights',
    gradient: 'from-amber-500 to-orange-600'
  }
];

/**
 * ProjectBoardView Component
 * 
 * Unified board view that integrates Kanban and Gantt visualizations
 * with real project data from the backend.
 * 
 * @param projectId - The ID of the project to display boards for
 */
const ProjectBoardView = ({ projectId = 'p1' }: ProjectBoardViewProps) => {
  // Currently selected board type view (kanban, gantt, or dashboard)
  const [selectedBoardType, setSelectedBoardType] = useState('kanban');
  
  // Fetch real project data for dashboard metrics
  const { data: tasks = [] } = useTasks(projectId);
  const { data: columns = [] } = useKanbanColumns(projectId);
  const { data: cards = [] } = useKanbanCards(projectId);

  // Calculate dashboard metrics from real data
  const metrics = {
    totalTasks: tasks.length + cards.length,
    completedTasks: tasks.filter((t: any) => t.status === 'done').length + 
                    cards.filter((c: any) => c.status === 'done').length,
    inProgressTasks: tasks.filter((t: any) => t.status === 'in-progress').length + 
                     cards.filter((c: any) => c.status === 'in-progress' || c.status === 'working-on-it').length,
    totalColumns: columns.length,
    completionRate: tasks.length > 0 
      ? Math.round((tasks.filter((t: any) => t.status === 'done').length / tasks.length) * 100) 
      : 0
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Project Boards
          </h2>
          <p className="text-muted-foreground mt-1">
            Visualize and manage your project with different views
          </p>
        </div>
      </div>

      {/* Board Type Selection - Clean Tab Design */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-2">
        <Tabs value={selectedBoardType} onValueChange={setSelectedBoardType} className="w-full">
          <TabsList className="grid grid-cols-3 gap-2 bg-transparent h-auto p-0">
            {BOARD_TYPES.map(type => {
              const IconComponent = type.icon;
              const isActive = selectedBoardType === type.id;
              
              return (
                <TabsTrigger
                  key={type.id}
                  value={type.id}
                  className={`
                    flex items-center justify-center gap-2 px-4 py-3 rounded-lg 
                    transition-all duration-200 data-[state=active]:shadow-lg
                    ${isActive 
                      ? `bg-gradient-to-r ${type.gradient} text-white` 
                      : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }
                  `}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="font-medium">{type.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Dashboard View - Project Metrics */}
      {selectedBoardType === 'dashboard' && (
        <div className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2 text-white/90">
                  <ListChecks className="h-5 w-5" />
                  Total Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{metrics.totalTasks}</div>
                <p className="text-white/70 text-sm mt-1">
                  Across all columns
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2 text-white/90">
                  <CheckCircle2 className="h-5 w-5" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{metrics.completedTasks}</div>
                <p className="text-white/70 text-sm mt-1">
                  {metrics.completionRate}% completion rate
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2 text-white/90">
                  <Clock className="h-5 w-5" />
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{metrics.inProgressTasks}</div>
                <p className="text-white/70 text-sm mt-1">
                  Currently being worked on
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-rose-500 to-pink-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2 text-white/90">
                  <Columns className="h-5 w-5" />
                  Columns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{metrics.totalColumns}</div>
                <p className="text-white/70 text-sm mt-1">
                  Workflow stages
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-500" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Jump to different views of your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 justify-start gap-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300"
                  onClick={() => setSelectedBoardType('kanban')}
                >
                  <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                    <Trello className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Kanban Board</div>
                    <div className="text-sm text-muted-foreground">
                      Drag and drop task management
                    </div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 justify-start gap-4 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300"
                  onClick={() => setSelectedBoardType('gantt')}
                >
                  <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Gantt Chart</div>
                    <div className="text-sm text-muted-foreground">
                      Timeline and scheduling
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Project Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Project Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Overall Progress</span>
                  <span className="text-sm font-medium">{metrics.completionRate}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${metrics.completionRate}%` }}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                      {metrics.totalTasks - metrics.completedTasks - metrics.inProgressTasks}
                    </div>
                    <div className="text-xs text-muted-foreground">To Do</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">{metrics.inProgressTasks}</div>
                    <div className="text-xs text-muted-foreground">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">{metrics.completedTasks}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Gantt Chart View */}
      {selectedBoardType === 'gantt' && <GanttBoard projectId={projectId} />}
      
      {/* Kanban Board View */}
      {selectedBoardType === 'kanban' && <KanbanBoard projectId={projectId} />}
    </div>
  );
};

export default ProjectBoardView; 