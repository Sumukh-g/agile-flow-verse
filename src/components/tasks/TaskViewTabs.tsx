
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, Kanban, Calendar, GanttChart, BarChart3 } from "lucide-react";

interface TaskViewTabsProps {
  activeView: string;
  onChange: (view: string) => void;
}

const TaskViewTabs: React.FC<TaskViewTabsProps> = ({ activeView, onChange }) => {
  return (
    <Tabs value={activeView} onValueChange={onChange} className="w-full">
      <TabsList>
        <TabsTrigger value="list" className="flex items-center gap-2">
          <List className="h-4 w-4" />
          <span className="hidden sm:inline">List</span>
        </TabsTrigger>
        <TabsTrigger value="board" className="flex items-center gap-2">
          <Kanban className="h-4 w-4" />
          <span className="hidden sm:inline">Board</span>
        </TabsTrigger>
        <TabsTrigger value="calendar" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Calendar</span>
        </TabsTrigger>
        <TabsTrigger value="timeline" className="flex items-center gap-2">
          <GanttChart className="h-4 w-4" />
          <span className="hidden sm:inline">Timeline</span>
        </TabsTrigger>
        <TabsTrigger value="reports" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Reports</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default TaskViewTabs;
