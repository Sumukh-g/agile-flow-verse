
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  priority: string;
  dueDate: string;
  assignee: string;
  tags: string[];
  status: string;
}

interface TaskReportViewProps {
  tasks: Task[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const TaskReportView: React.FC<TaskReportViewProps> = ({ tasks }) => {
  const [reportType, setReportType] = useState('status');
  const [timeframe, setTimeframe] = useState('all');

  // Status data for charts
  const statusData = [
    { name: 'To Do', value: tasks.filter(task => task.status === 'To Do').length },
    { name: 'In Progress', value: tasks.filter(task => task.status === 'In Progress').length },
    { name: 'In Review', value: tasks.filter(task => task.status === 'In Review').length },
    { name: 'Done', value: tasks.filter(task => task.status === 'Done').length },
  ];

  // Priority data for charts
  const priorityData = [
    { name: 'High', value: tasks.filter(task => task.priority === 'High').length },
    { name: 'Medium', value: tasks.filter(task => task.priority === 'Medium').length },
    { name: 'Low', value: tasks.filter(task => task.priority === 'Low').length },
  ];

  // Assignee data
  const assigneeData = Object.entries(
    tasks.reduce((acc, task) => {
      acc[task.assignee] = (acc[task.assignee] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Get data based on selected report type
  const getReportData = () => {
    switch (reportType) {
      case 'status':
        return statusData;
      case 'priority':
        return priorityData;
      case 'assignee':
        return assigneeData;
      default:
        return statusData;
    }
  };

  const handleExport = () => {
    toast.success("Report exported to CSV!");
  };

  const handleRefresh = () => {
    toast.success("Report data refreshed!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status">By Status</SelectItem>
              <SelectItem value="priority">By Priority</SelectItem>
              <SelectItem value="assignee">By Assignee</SelectItem>
              <SelectItem value="timeline">Timeline Completion</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tasks.length}</div>
            <div className="text-xs text-muted-foreground">All tasks</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tasks.filter(task => task.status === 'Done').length}</div>
            <div className="text-xs text-muted-foreground">
              {Math.round((tasks.filter(task => task.status === 'Done').length / tasks.length) * 100)}% of total
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tasks.filter(task => task.status === 'In Progress').length}</div>
            <div className="text-xs text-muted-foreground">
              {Math.round((tasks.filter(task => task.status === 'In Progress').length / tasks.length) * 100)}% of total
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tasks.filter(task => task.priority === 'High').length}</div>
            <div className="text-xs text-muted-foreground">
              {Math.round((tasks.filter(task => task.priority === 'High').length / tasks.length) * 100)}% of total
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="h-[400px]">
          <CardHeader>
            <CardTitle>Distribution {reportType === 'status' ? 'by Status' : reportType === 'priority' ? 'by Priority' : 'by Assignee'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={getReportData()}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="h-[400px]">
          <CardHeader>
            <CardTitle>Breakdown {reportType === 'status' ? 'by Status' : reportType === 'priority' ? 'by Priority' : 'by Assignee'}</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getReportData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {getReportData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Completion Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { name: 'Mon', completed: 4, total: 6 },
                { name: 'Tue', completed: 5, total: 8 },
                { name: 'Wed', completed: 3, total: 7 },
                { name: 'Thu', completed: 6, total: 10 },
                { name: 'Fri', completed: 2, total: 4 },
                { name: 'Sat', completed: 1, total: 2 },
                { name: 'Sun', completed: 0, total: 1 },
              ]}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#8884d8" name="Total Tasks" />
              <Bar dataKey="completed" fill="#82ca9d" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskReportView;
