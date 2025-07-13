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
    Calendar,
    Download,
    Edit,
    Eye,
    MessageSquare,
    Pin,
    Plus,
    Search,
    Share,
    Star,
    StickyNote,
    Tag,
    Trash2,
    Upload,
    User
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ProjectNotesViewProps {
  projectId: string | undefined;
}

const ProjectNotesView: React.FC<ProjectNotesViewProps> = ({ projectId }) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isEditNoteOpen, setIsEditNoteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    // Mock notes data
    setNotes([
      {
        id: 1,
        title: "Project Requirements Analysis",
        content: "Detailed analysis of project requirements including functional and non-functional requirements. Key stakeholders identified and their expectations documented.",
        category: "Planning",
        tags: ["requirements", "analysis", "stakeholders"],
        author: "John Smith",
        createdDate: "2024-01-10",
        updatedDate: "2024-01-12",
        isPinned: true,
        isStarred: false,
        isShared: true,
        collaborators: ["Sarah Johnson", "Mike Wilson"],
        comments: 3,
        views: 15
      },
      {
        id: 2,
        title: "Technical Architecture Notes",
        content: "System architecture decisions and technical considerations. Database design, API structure, and integration points documented.",
        category: "Technical",
        tags: ["architecture", "database", "api"],
        author: "Mike Wilson",
        createdDate: "2024-01-08",
        updatedDate: "2024-01-14",
        isPinned: false,
        isStarred: true,
        isShared: false,
        collaborators: ["Tom Davis"],
        comments: 7,
        views: 22
      },
      {
        id: 3,
        title: "Meeting Notes - Client Kickoff",
        content: "Client kickoff meeting notes including project timeline, deliverables, and communication protocols. Action items assigned to team members.",
        category: "Meetings",
        tags: ["meeting", "client", "kickoff"],
        author: "Sarah Johnson",
        createdDate: "2024-01-05",
        updatedDate: "2024-01-05",
        isPinned: true,
        isStarred: true,
        isShared: true,
        collaborators: ["John Smith", "Lisa Brown"],
        comments: 5,
        views: 28
      },
      {
        id: 4,
        title: "Design System Guidelines",
        content: "Comprehensive design system documentation including color palette, typography, component library, and usage guidelines.",
        category: "Design",
        tags: ["design", "guidelines", "components"],
        author: "Lisa Brown",
        createdDate: "2024-01-12",
        updatedDate: "2024-01-15",
        isPinned: false,
        isStarred: false,
        isShared: true,
        collaborators: ["Sarah Johnson"],
        comments: 2,
        views: 18
      },
      {
        id: 5,
        title: "Testing Strategy",
        content: "Testing approach and strategy for the project including unit testing, integration testing, and user acceptance testing procedures.",
        category: "Testing",
        tags: ["testing", "strategy", "qa"],
        author: "Tom Davis",
        createdDate: "2024-01-14",
        updatedDate: "2024-01-14",
        isPinned: false,
        isStarred: false,
        isShared: false,
        collaborators: [],
        comments: 1,
        views: 8
      }
    ]);

    setCategories(["Planning", "Technical", "Meetings", "Design", "Testing", "Research"]);
  }, [projectId]);

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || note.category === selectedCategory;
    
    const matchesTab = activeTab === "all" || 
                      (activeTab === "pinned" && note.isPinned) ||
                      (activeTab === "starred" && note.isStarred) ||
                      (activeTab === "shared" && note.isShared);
    
    return matchesSearch && matchesCategory && matchesTab;
  });

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Planning': 'bg-blue-100 text-blue-800',
      'Technical': 'bg-green-100 text-green-800',
      'Meetings': 'bg-purple-100 text-purple-800',
      'Design': 'bg-pink-100 text-pink-800',
      'Testing': 'bg-orange-100 text-orange-800',
      'Research': 'bg-indigo-100 text-indigo-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const AddNoteForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Note Title</Label>
        <Input id="title" placeholder="Enter note title" />
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
          placeholder="Write your note content here..." 
          className="min-h-[200px]"
        />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="pinned" />
          <Label htmlFor="pinned">Pin this note</Label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="shared" />
          <Label htmlFor="shared">Share with team</Label>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setIsAddNoteOpen(false)}>Cancel</Button>
        <Button onClick={() => {
          toast.success("Note created successfully!");
          setIsAddNoteOpen(false);
        }}>Create Note</Button>
      </div>
    </div>
  );

  const NoteCard = ({ note }: { note: any }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {note.isPinned && <Pin className="h-4 w-4 text-blue-500" />}
            {note.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
            <h3 className="font-semibold text-lg">{note.title}</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm">
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm">
              <Share className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm mb-3 line-clamp-3">
          {note.content}
        </p>
        
        <div className="flex items-center gap-2 mb-3">
          <Badge className={getCategoryColor(note.category)}>
            {note.category}
          </Badge>
          {note.tags.slice(0, 3).map((tag: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs">
              #{tag}
            </Badge>
          ))}
          {note.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{note.tags.length - 3}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{note.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{note.updatedDate}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{note.views}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{note.comments}</span>
            </div>
            {note.isShared && (
              <div className="flex items-center gap-1">
                <Share className="h-3 w-3" />
                <span>{note.collaborators.length}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Notes Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Notes</h2>
          <p className="text-muted-foreground">Capture and organize project knowledge and insights</p>
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
          <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create New Note</DialogTitle>
                <DialogDescription>
                  Add a new note to your project knowledge base
                </DialogDescription>
              </DialogHeader>
              <AddNoteForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Notes Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Notes</p>
                <p className="text-2xl font-bold">{notes.length}</p>
              </div>
              <StickyNote className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pinned</p>
                <p className="text-2xl font-bold">{notes.filter(n => n.isPinned).length}</p>
              </div>
              <Pin className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Shared</p>
                <p className="text-2xl font-bold">{notes.filter(n => n.isShared).length}</p>
              </div>
              <Share className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <Tag className="h-8 w-8 text-orange-500" />
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
              placeholder="Search notes..."
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
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">All Notes</TabsTrigger>
          <TabsTrigger value="pinned">Pinned</TabsTrigger>
          <TabsTrigger value="starred">Starred</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredNotes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <StickyNote className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notes found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || selectedCategory !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "Create your first note to get started"
                  }
                </p>
                <Button onClick={() => setIsAddNoteOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Note
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates to project notes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notes.slice(0, 5).map((note) => (
              <div key={note.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{note.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{note.author}</span> updated{' '}
                    <span className="font-medium">{note.title}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{note.updatedDate}</p>
                </div>
                <Badge className={getCategoryColor(note.category)}>
                  {note.category}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectNotesView; 