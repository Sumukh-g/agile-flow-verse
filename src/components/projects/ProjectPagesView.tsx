import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import {
    Bookmark,
    Download,
    Edit,
    Eye,
    FileText,
    Globe,
    History,
    Lock,
    Plus,
    Search,
    Settings,
    Share,
    Star,
    Upload,
    Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ProjectPagesViewProps {
  projectId: string | undefined;
}

const ProjectPagesView: React.FC<ProjectPagesViewProps> = ({ projectId }) => {
  const [pages, setPages] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCreatePageOpen, setIsCreatePageOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    // Mock pages data
    setPages([
      {
        id: 1,
        title: "Project Overview",
        content: "Comprehensive overview of the project including goals, scope, timeline, and key stakeholders. This document serves as the central reference point for all project activities.",
        category: "Documentation",
        tags: ["overview", "goals", "scope"],
        author: "John Smith",
        createdDate: "2024-01-10",
        lastModified: "2024-01-15",
        lastEditor: "Sarah Johnson",
        isPublic: true,
        isStarred: true,
        isBookmarked: false,
        views: 45,
        comments: 8,
        collaborators: ["Sarah Johnson", "Mike Wilson", "Lisa Brown"],
        status: "Published",
        version: "1.3"
      },
      {
        id: 2,
        title: "Technical Architecture",
        content: "Detailed technical architecture documentation including system design, database schema, API specifications, and integration points.",
        category: "Technical",
        tags: ["architecture", "design", "api"],
        author: "Mike Wilson",
        createdDate: "2024-01-08",
        lastModified: "2024-01-14",
        lastEditor: "Tom Davis",
        isPublic: false,
        isStarred: false,
        isBookmarked: true,
        views: 32,
        comments: 12,
        collaborators: ["Tom Davis", "John Smith"],
        status: "Published",
        version: "2.1"
      },
      {
        id: 3,
        title: "User Stories & Requirements",
        content: "Collection of user stories, functional requirements, and acceptance criteria for the project features.",
        category: "Requirements",
        tags: ["user-stories", "requirements", "features"],
        author: "Sarah Johnson",
        createdDate: "2024-01-12",
        lastModified: "2024-01-16",
        lastEditor: "Lisa Brown",
        isPublic: true,
        isStarred: true,
        isBookmarked: true,
        views: 28,
        comments: 6,
        collaborators: ["Lisa Brown", "John Smith", "Emma Davis"],
        status: "Published",
        version: "1.5"
      },
      {
        id: 4,
        title: "Meeting Notes - Sprint Planning",
        content: "Notes from sprint planning meetings including task assignments, estimates, and sprint goals.",
        category: "Meetings",
        tags: ["meetings", "sprint", "planning"],
        author: "Lisa Brown",
        createdDate: "2024-01-14",
        lastModified: "2024-01-14",
        lastEditor: "Lisa Brown",
        isPublic: false,
        isStarred: false,
        isBookmarked: false,
        views: 15,
        comments: 3,
        collaborators: ["John Smith", "Sarah Johnson"],
        status: "Draft",
        version: "1.0"
      },
      {
        id: 5,
        title: "API Documentation",
        content: "Complete API documentation with endpoints, request/response examples, and authentication details.",
        category: "Technical",
        tags: ["api", "documentation", "endpoints"],
        author: "Tom Davis",
        createdDate: "2024-01-11",
        lastModified: "2024-01-13",
        lastEditor: "Mike Wilson",
        isPublic: true,
        isStarred: false,
        isBookmarked: false,
        views: 67,
        comments: 15,
        collaborators: ["Mike Wilson", "John Smith"],
        status: "Published",
        version: "1.8"
      },
      {
        id: 6,
        title: "Testing Strategy",
        content: "Comprehensive testing strategy including unit tests, integration tests, and user acceptance testing procedures.",
        category: "Testing",
        tags: ["testing", "strategy", "qa"],
        author: "Emma Davis",
        createdDate: "2024-01-13",
        lastModified: "2024-01-15",
        lastEditor: "Tom Davis",
        isPublic: false,
        isStarred: false,
        isBookmarked: true,
        views: 22,
        comments: 4,
        collaborators: ["Tom Davis", "Sarah Johnson"],
        status: "Review",
        version: "1.2"
      }
    ]);

    setCategories(["Documentation", "Technical", "Requirements", "Meetings", "Testing", "Design"]);
  }, [projectId]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'review': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Documentation': 'bg-blue-100 text-blue-800',
      'Technical': 'bg-green-100 text-green-800',
      'Requirements': 'bg-purple-100 text-purple-800',
      'Meetings': 'bg-orange-100 text-orange-800',
      'Testing': 'bg-red-100 text-red-800',
      'Design': 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || page.category === selectedCategory;
    
    const matchesTab = activeTab === "all" || 
                      (activeTab === "starred" && page.isStarred) ||
                      (activeTab === "bookmarked" && page.isBookmarked) ||
                      (activeTab === "recent" && true) ||
                      (activeTab === "shared" && page.isPublic);
    
    return matchesSearch && matchesCategory && matchesTab;
  });

  const CreatePageForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Page Title</Label>
        <Input id="title" placeholder="Enter page title" />
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="tags">Tags</Label>
        <Input id="tags" placeholder="Enter tags (comma separated)" />
      </div>
      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea 
          id="content" 
          placeholder="Write your page content here..." 
          className="min-h-[300px]"
        />
      </div>
      <div className="space-y-3">
        <Label>Page Settings</Label>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="public">Make page public</Label>
            <input type="checkbox" id="public" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="comments">Allow comments</Label>
            <input type="checkbox" id="comments" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">Notify collaborators</Label>
            <input type="checkbox" id="notifications" defaultChecked />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setIsCreatePageOpen(false)}>Cancel</Button>
        <Button variant="outline">Save as Draft</Button>
        <Button onClick={() => {
          toast.success("Page created successfully!");
          setIsCreatePageOpen(false);
        }}>Publish</Button>
      </div>
    </div>
  );

  const PageCard = ({ page }: { page: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">{page.title}</h3>
            {page.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
            {page.isBookmarked && <Bookmark className="h-4 w-4 text-blue-500 fill-current" />}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(page.status)}>
              {page.status}
            </Badge>
            {page.isPublic ? (
              <Globe className="h-4 w-4 text-green-500" />
            ) : (
              <Lock className="h-4 w-4 text-gray-500" />
            )}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {page.content}
        </p>
        
        <div className="flex items-center gap-2 mb-3">
          <Badge className={getCategoryColor(page.category)}>
            {page.category}
          </Badge>
          {page.tags.slice(0, 3).map((tag: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs">
              #{tag}
            </Badge>
          ))}
          {page.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{page.tags.length - 3}
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
          <div>
            <p className="text-muted-foreground">Author</p>
            <p className="font-medium">{page.author}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Version</p>
            <p className="font-medium">v{page.version}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Views</p>
            <p className="font-medium">{page.views}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Comments</p>
            <p className="font-medium">{page.comments}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="flex -space-x-2">
            {page.collaborators.slice(0, 3).map((collaborator: string, index: number) => (
              <Avatar key={index} className="h-6 w-6 border-2 border-white">
                <AvatarFallback className="text-xs">
                  {collaborator.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            ))}
            {page.collaborators.length > 3 && (
              <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                <span className="text-xs">+{page.collaborators.length - 3}</span>
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {page.collaborators.length} collaborator{page.collaborators.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="flex justify-between items-center pt-3 border-t">
          <div className="text-xs text-muted-foreground">
            Last edited by {page.lastEditor} on {page.lastModified}
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost">
              <Eye className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost">
              <Edit className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost">
              <Share className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost">
              <History className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Pages Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Pages</h2>
          <p className="text-muted-foreground">Collaborative documentation and knowledge base for your project</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Dialog open={isCreatePageOpen} onOpenChange={setIsCreatePageOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Page
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Page</DialogTitle>
                <DialogDescription>
                  Create a new documentation page for your project
                </DialogDescription>
              </DialogHeader>
              <CreatePageForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pages Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pages</p>
                <p className="text-2xl font-bold">{pages.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{pages.filter(p => p.status === 'Published').length}</p>
              </div>
              <Globe className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Collaborators</p>
                <p className="text-2xl font-bold">{new Set(pages.flatMap(p => p.collaborators)).size}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{pages.reduce((sum, page) => sum + page.views, 0)}</p>
              </div>
              <Eye className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="all">All Pages</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="starred">Starred</TabsTrigger>
          <TabsTrigger value="bookmarked">Bookmarked</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredPages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No pages found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || selectedCategory !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "Create your first page to start building your knowledge base"
                  }
                </p>
                <Button onClick={() => setIsCreatePageOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Page
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredPages.map((page) => (
                <PageCard key={page.id} page={page} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates to project pages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pages.slice(0, 5).map((page) => (
              <div key={page.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{page.lastEditor.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{page.lastEditor}</span> updated{' '}
                    <span className="font-medium">{page.title}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{page.lastModified}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryColor(page.category)}>
                    {page.category}
                  </Badge>
                  <Badge variant="outline">v{page.version}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Page Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Page Templates</CardTitle>
          <CardDescription>Quick start templates for common documentation types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <FileText className="h-6 w-6 text-blue-500" />
              <span>Project Overview</span>
              <span className="text-xs text-muted-foreground">Project summary template</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Settings className="h-6 w-6 text-green-500" />
              <span>Technical Spec</span>
              <span className="text-xs text-muted-foreground">Technical documentation</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Users className="h-6 w-6 text-purple-500" />
              <span>Meeting Notes</span>
              <span className="text-xs text-muted-foreground">Meeting documentation</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectPagesView; 