
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ArrowUpRight, 
  MessageSquare, 
  Bell, 
  Zap
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from '@/components/ui/separator';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your workspace.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-grid">
        <StatsCard 
          title="Tasks Due Today" 
          value="5"
          description="2 high priority" 
          icon={Clock} 
          trendValue="+2"
          trendLabel="from yesterday"
          color="text-amber-500"
        />
        <StatsCard 
          title="Completed Tasks" 
          value="12"
          description="This week" 
          icon={CheckCircle2} 
          trendValue="+5"
          trendLabel="from last week"
          color="text-emerald-500"
        />
        <StatsCard 
          title="Issues Pending" 
          value="7"
          description="3 blockers" 
          icon={AlertCircle} 
          trendValue="-2"
          trendLabel="from yesterday"
          color="text-red-500"
        />
        <StatsCard 
          title="Project Milestones" 
          value="3"
          description="Due this month" 
          icon={Sparkles} 
          trendValue=""
          trendLabel="on track"
          color="text-indigo-500"
        />
      </div>

      {/* Active Sprints */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Active Sprint</CardTitle>
          <CardDescription>Sprint #23 (May 6 - May 19)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">45%</span>
            </div>
            <Progress value={45} className="h-2" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col gap-1">
              <div className="text-muted-foreground">To Do</div>
              <div className="font-medium">8 tasks</div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-muted-foreground">In Progress</div>
              <div className="font-medium">5 tasks</div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-muted-foreground">Done</div>
              <div className="font-medium">12 tasks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
          <ActivityItem 
            avatar="JD"
            name="John Doe"
            action="commented on"
            target="Frontend Navigation Bug"
            time="2 minutes ago"
            icon={MessageSquare}
            iconClass="bg-blue-100 text-blue-600"
          />
          <ActivityItem 
            avatar="AS"
            name="Alice Smith"
            action="completed"
            target="Design System Update"
            time="30 minutes ago"
            icon={CheckCircle2}
            iconClass="bg-green-100 text-green-600"
          />
          <ActivityItem 
            avatar="RM"
            name="Robert Miller"
            action="mentioned you in"
            target="API Integration Planning"
            time="1 hour ago"
            icon={Bell}
            iconClass="bg-amber-100 text-amber-600"
          />
          <ActivityItem 
            avatar="JW"
            name="Jane Wilson"
            action="created automation"
            target="Deadline Reminders"
            time="3 hours ago"
            icon={Zap}
            iconClass="bg-purple-100 text-purple-600"
          />
          <ActivityItem 
            avatar="MJ"
            name="Mike Johnson"
            action="added task"
            target="Security Audit"
            time="5 hours ago"
            icon={ArrowUpRight}
            iconClass="bg-red-100 text-red-600"
          />
        </CardContent>
      </Card>
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  trendValue: string;
  trendLabel: string;
}

const StatsCard = ({
  title,
  value,
  description,
  icon: Icon,
  color,
  trendValue,
  trendLabel
}: StatsCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-bold">{value}</h3>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {trendValue && <span className="text-green-500">{trendValue} </span>}
              {trendLabel}
            </p>
          </div>
          <div className={`p-2 rounded-full ${color.replace('text-', 'bg-').replace('-500', '-100')}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ActivityItemProps {
  avatar: string;
  name: string;
  action: string;
  target: string;
  time: string;
  icon: React.FC<{ className?: string }>;
  iconClass: string;
}

const ActivityItem = ({
  avatar,
  name,
  action,
  target,
  time,
  icon: Icon,
  iconClass
}: ActivityItemProps) => {
  return (
    <div className="flex items-start gap-4">
      <Avatar className="h-8 w-8">
        <AvatarFallback>{avatar}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center">
          <p className="text-sm font-medium">{name}</p>
          <Separator orientation="vertical" className="mx-2 h-4" />
          <p className="text-sm text-muted-foreground">{time}</p>
        </div>
        <p className="text-sm">
          {action} <span className="font-medium">{target}</span>
        </p>
      </div>
      <div className={`p-1.5 rounded-full ${iconClass}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
    </div>
  );
};

export default Dashboard;
