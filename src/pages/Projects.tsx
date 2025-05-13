
import React, { useState } from 'react';
import { Search, Plus, Grid, List, Filter, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

// Project data
const PROJECTS = [
  {
    id: 1,
    name: "Website Redesign",
    description: "Complete overhaul of the company website with new branding",
    status: "In Progress",
    progress: 65,
    members: ["JD", "AS", "TW"],
    team: "Design",
    created: "2 weeks ago"
  },
  {
    id: 2,
    name: "Mobile App Development",
    description: "Creating a new mobile application for customer engagement",
    status: "Planning",
    progress: 25,
    members: ["RM", "JW", "AS"],
    team: "Mobile",
    created: "1 month ago"
  },
  {
    id: 3,
    name: "CRM Integration",
    description: "Integrate our systems with the new customer relationship management platform",
    status: "On Hold",
    progress: 10,
    members: ["TW", "JD"],
    team: "Backend",
    created: "3 weeks ago"
  },
  {
    id: 4,
    name: "Social Media Campaign",
    description: "Q2 social media marketing campaign for product launch",
    status: "Completed",
    progress: 100,
    members: ["AS", "JW"],
    team: "Marketing",
    created: "1 week ago"
  },
  {
    id: 5,
    name: "Data Migration",
    description: "Migrate customer data to the new cloud storage solution",
    status: "In Progress",
    progress: 40,
    members: ["RM", "TW", "JD"],
    team: "DevOps",
    created: "1 month ago"
  },
  {
    id: 6,
    name: "Security Audit",
    description: "Perform comprehensive security assessment of all systems",
    status: "Planning",
    progress: 15,
    members: ["JD", "RM"],
    team: "Security",
    created: "2 days ago"
  }
];

// Helper function for getting status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'In Progress':
      return 'bg-blue-100 text-blue-800';
    case 'Planning':
      return 'bg-amber-100 text-amber-800';
    case 'On Hold':
      return 'bg-gray-100 text-gray-800';
    case 'Completed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

const Projects = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter projects based on search query
  const filteredProjects = PROJECTS.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">
          Manage and track all your workspace projects.
        </p>
      </div>
      
      {/* Action bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          
          <div className="border rounded-md flex">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>
      
      {/* Projects grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredProjects.map(project => (
            <ProjectListItem key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};

interface ProjectProps {
  project: {
    id: number;
    name: string;
    description: string;
    status: string;
    progress: number;
    members: string[];
    team: string;
    created: string;
  }
}

const ProjectCard = ({ project }: ProjectProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="h-2 bg-primary" />
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg">{project.name}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Edit Project</DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="mt-2">
          <Badge variant="outline" className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
          {project.description}
        </p>
        
        <div className="mt-4 space-y-2">
          <div className="text-xs text-muted-foreground flex justify-between">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1.5" />
        </div>
      </CardContent>
      
      <CardFooter className="bg-slate-50 px-6 py-3 flex items-center justify-between">
        <div className="flex -space-x-2">
          {project.members.map((member, idx) => (
            <Avatar key={idx} className="h-7 w-7 border-2 border-background">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {member}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          {project.team} · {project.created}
        </div>
      </CardFooter>
    </Card>
  );
};

const ProjectListItem = ({ project }: ProjectProps) => {
  return (
    <div className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{project.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
              {project.description}
            </p>
          </div>
          <Badge variant="outline" className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
        </div>
        
        <div className="mt-3 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Team:</span>
            <span className="font-medium text-foreground">{project.team}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Created:</span>
            <span className="font-medium text-foreground">{project.created}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {project.members.map((member, idx) => (
                <Avatar key={idx} className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {member}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-3 md:min-w-[240px]">
        <div className="w-full md:w-36 flex items-center gap-2">
          <Progress value={project.progress} className="h-2 flex-1" />
          <span className="text-xs font-medium">{project.progress}%</span>
        </div>
        
        <div className="flex items-center gap-2 self-end md:self-center">
          <Button variant="outline" size="sm">View</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit Project</DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default Projects;
