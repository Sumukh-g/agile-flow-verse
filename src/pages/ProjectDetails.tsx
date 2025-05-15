import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  FileEdit, 
  FileText, 
  Calendar, 
  Clock, 
  Shield, 
  FileSpreadsheet, 
  FileBox, 
  FileInput, 
  Layers,
  StickyNote // Added for Notes tab
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea"; // Added for Notes tab
import { toast } from "sonner";

// Mock data for projects
const MOCK_PROJECTS = [
  { id: "1", name: "Website Redesign", description: "Revamp the company website.", icon: "WR", metrics: { completed: 5, updated: 2, created: 8, due: 3 } },
  { id: "2", name: "Mobile App Development", description: "Create a new mobile app for iOS and Android.", icon: "MA", metrics: { completed: 10, updated: 5, created: 12, due: 4 } },
  { id: "project-manager", name: "Project Management Tool", description: "The tool we are building right now!", icon: "PM", metrics: { completed: 0, updated: 0, created: 0, due: 0 } },
  { id: "marketing-campaign", name: "Q3 Marketing Campaign", description: "Launch new marketing initiatives.", icon: "MC", metrics: { completed: 2, updated: 1, created: 5, due: 1 } },
];

const ProjectDetails = () => {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState<string>("summary");
  
  // Find the project by ID, or use a default if not found or no ID
  const currentProject = 
    MOCK_PROJECTS.find(p => p.id === projectId) || 
    MOCK_PROJECTS.find(p => p.name === "Project Manager") || // Fallback for the original hardcoded name
    { 
      id: projectId || "default", 
      name: `Project ${projectId || "Overview"}`, 
      icon: projectId ? projectId.substring(0,2).toUpperCase() : "P",
      metrics: { completed: 0, updated: 0, created: 0, due: 0 } 
    };

  const [projectNote, setProjectNote] = useState(''); // State for project-specific note

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    toast.info(`Viewing ${value} tab for ${currentProject.name}`);
  };

  const handleCreateWorkItem = () => {
    toast.info(`Creating new work item for ${currentProject.name}`);
    // Potentially navigate or open a dialog
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="bg-indigo-600 text-white p-1.5 rounded flex items-center justify-center h-8 w-8 text-sm">
              {currentProject.icon}
            </span>
            {currentProject.name}
          </h1>
        </div>
        {/* ... keep existing code (Share and Automation buttons) */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </Button>
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Automation
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b">
        <Tabs defaultValue="summary" value={activeTab} onValueChange={handleTabChange} className="w-full overflow-x-auto">
          <TabsList className="h-10 inline-flex w-max">
            <TabsTrigger value="summary" className="px-4 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="board" className="px-4 flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Board
            </TabsTrigger>
            <TabsTrigger value="list" className="px-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="px-4 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="timeline" className="px-4 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            {/* New Notes Tab */}
            <TabsTrigger value="notes" className="px-4 flex items-center gap-2">
              <StickyNote className="h-4 w-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="approvals" className="px-4 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Approvals
            </TabsTrigger>
            <TabsTrigger value="forms" className="px-4 flex items-center gap-2">
              <FileInput className="h-4 w-4" />
              Forms
            </TabsTrigger>
            <TabsTrigger value="pages" className="px-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pages
            </TabsTrigger>
            <TabsTrigger value="attachments" className="px-4 flex items-center gap-2">
              <FileBox className="h-4 w-4" />
              Attachments
            </TabsTrigger>
            <TabsTrigger value="all-work" className="px-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              All work
            </TabsTrigger>
            <TabsTrigger value="reports" className="px-4 flex items-center gap-2">
              <FileEdit className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Content for Tabs */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          {/* ... keep existing code (Filter button and Metrics Cards, using currentProject.metrics) */}
          <div className="flex">
            <Button variant="outline" className="gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter
            </Button>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 flex items-center gap-3">
              <div className="bg-gray-100 p-2 rounded-md">
                <CheckCircle className="h-6 w-6 text-gray-700" />
              </div>
              <div>
                <div className="font-semibold text-lg">{currentProject.metrics.completed} completed</div>
                <div className="text-sm text-gray-600">in the last 7 days</div>
              </div>
            </Card>
            
            <Card className="p-4 flex items-center gap-3">
              <div className="bg-gray-100 p-2 rounded-md">
                <FileEdit className="h-6 w-6 text-gray-700" />
              </div>
              <div>
                <div className="font-semibold text-lg">{currentProject.metrics.updated} updated</div>
                <div className="text-sm text-gray-600">in the last 7 days</div>
              </div>
            </Card>
            
            <Card className="p-4 flex items-center gap-3">
              <div className="bg-gray-100 p-2 rounded-md">
                <FileText className="h-6 w-6 text-gray-700" />
              </div>
              <div>
                <div className="font-semibold text-lg">{currentProject.metrics.created} created</div>
                <div className="text-sm text-gray-600">in the last 7 days</div>
              </div>
            </Card>
            
            <Card className="p-4 flex items-center gap-3">
              <div className="bg-gray-100 p-2 rounded-md">
                <Calendar className="h-6 w-6 text-gray-700" />
              </div>
              <div>
                <div className="font-semibold text-lg">{currentProject.metrics.due} due soon</div>
                <div className="text-sm text-gray-600">in the next 7 days</div>
              </div>
            </Card>
          </div>
          {/* ... keep existing code (Status Overview, No Activity Yet, Priority Breakdown, Types of Work) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-gray-50">
              <h2 className="text-lg font-semibold mb-1">Status overview</h2>
              <p className="text-sm text-gray-600 mb-8">The status overview for this project will display here after you <Button variant="link" className="h-auto p-0" onClick={handleCreateWorkItem}>create some work items</Button></p>
              
              <div className="flex flex-col items-center justify-center">
                <div className="text-5xl font-bold mb-3">0</div>
                <div className="text-gray-600">Total work items</div>
              </div>

              <div className="mt-8 space-y-2">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                    <span>To Do</span>
                  </div>
                  <span>0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
                    <span>Testing</span>
                  </div>
                  <span>0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-pink-500 rounded-sm"></div>
                    <span>Design</span>
                  </div>
                  <span>0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                    <span>Concepting</span>
                  </div>
                  <span>0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
                    <span>Launch</span>
                  </div>
                  <span>0</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gray-50 flex flex-col justify-between">
              <h2 className="text-lg font-semibold mb-6">No activity yet</h2>
              
              <div className="flex justify-center my-8">
                <div className="relative">
                  <div className="w-16 h-16 bg-gray-200 rounded-md absolute top-2 left-2"></div>
                  <div className="w-16 h-16 bg-blue-500 rounded-md flex items-center justify-center text-white relative">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                </div>
              </div>
              
              <p className="text-center text-gray-600">Create a few work items and invite some teammates to your project to see your project activity.</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-gray-50">
              <h2 className="text-lg font-semibold">Priority breakdown</h2>
              <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                <p>No priority data available</p>
              </div>
            </Card>
            <Card className="p-6 bg-gray-50">
              <h2 className="text-lg font-semibold">Types of work</h2>
              <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                <p>No work type data available</p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "board" && (
        <div className="min-h-[600px] p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Project Board</h3>
            <Button onClick={handleCreateWorkItem}>Create New Task</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* To Do Column */}
            <div className="bg-slate-100 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-slate-700">To Do</h4>
              <div className="space-y-3 min-h-[100px]">
                <Card className="p-3 bg-white shadow-sm">
                  <p className="font-medium text-sm">Task 1: Design homepage mockup</p>
                  <p className="text-xs text-slate-500 mt-1">Due: May 20</p>
                </Card>
                <Card className="p-3 bg-white shadow-sm">
                  <p className="font-medium text-sm">Task 2: Setup database schema</p>
                  <p className="text-xs text-slate-500 mt-1">Due: May 22</p>
                </Card>
              </div>
            </div>
            {/* In Progress Column */}
            <div className="bg-slate-100 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-slate-700">In Progress</h4>
              <div className="space-y-3 min-h-[100px]">
                <Card className="p-3 bg-white shadow-sm">
                  <p className="font-medium text-sm">Task 3: Develop API endpoints</p>
                  <p className="text-xs text-slate-500 mt-1">Due: May 25</p>
                </Card>
              </div>
            </div>
            {/* Done Column */}
            <div className="bg-slate-100 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-slate-700">Done</h4>
              <div className="space-y-3 min-h-[100px]">
                <Card className="p-3 bg-white shadow-sm opacity-70">
                  <p className="font-medium text-sm line-through">Task 4: Initial research</p>
                  <p className="text-xs text-slate-500 mt-1">Completed: May 10</p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "notes" && (
        <div className="p-4 space-y-4">
          <h3 className="text-lg font-medium">Project Notes for {currentProject.name}</h3>
          <Textarea
            placeholder="Add your notes for this project here..."
            value={projectNote}
            onChange={(e) => setProjectNote(e.target.value)}
            className="min-h-[200px] text-sm"
          />
          <Button onClick={() => toast.success("Note saved (mock)")}>Save Note (Mock)</Button>
        </div>
      )}

      {/* ... keep existing placeholders for other tabs (list, calendar, timeline, etc.) ... */}
      {activeTab === "list" && (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center max-w-md">
            <h3 className="text-lg font-medium mb-2">List View</h3>
            <p className="text-muted-foreground mb-4">View all your tasks in a filterable, sortable list format.</p>
            <Button onClick={handleCreateWorkItem}>Create New Task</Button>
          </div>
        </div>
      )}

      {activeTab === "calendar" && (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center max-w-md">
            <h3 className="text-lg font-medium mb-2">Calendar View</h3>
            <p className="text-muted-foreground mb-4">View and manage project tasks by dates.</p>
            <Button onClick={handleCreateWorkItem}>Create New Task</Button>
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center max-w-md">
            <h3 className="text-lg font-medium mb-2">Timeline View</h3>
            <p className="text-muted-foreground mb-4">Visualize your project schedule and dependencies.</p>
            <Button onClick={handleCreateWorkItem}>Create New Task</Button>
          </div>
        </div>
      )}
      {/* Remaining tabs: approvals, forms, pages, attachments, all-work, reports will keep their placeholder content */}
    </div>
  );
};

export default ProjectDetails;
