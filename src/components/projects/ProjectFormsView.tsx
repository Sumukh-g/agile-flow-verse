import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import {
    AlertCircle,
    BarChart3,
    CheckCircle2,
    Copy,
    Download,
    Edit,
    Eye,
    FileText,
    FormInput,
    Link,
    Plus,
    Search,
    Send,
    Settings,
    Share,
    Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ProjectFormsViewProps {
  projectId: string | undefined;
}

const ProjectFormsView: React.FC<ProjectFormsViewProps> = ({ projectId }) => {
  const [forms, setForms] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    // Mock forms data
    setForms([
      {
        id: 1,
        title: "Project Feedback Survey",
        description: "Collect feedback from stakeholders about project progress and satisfaction",
        type: "Survey",
        status: "Active",
        createdBy: "John Smith",
        createdDate: "2024-01-10",
        lastModified: "2024-01-15",
        responses: 23,
        views: 156,
        isPublic: true,
        fields: [
          { type: "text", label: "Name", required: true },
          { type: "email", label: "Email", required: true },
          { type: "rating", label: "Overall Satisfaction", required: true },
          { type: "textarea", label: "Comments", required: false }
        ],
        settings: {
          allowAnonymous: false,
          requireLogin: true,
          sendConfirmation: true,
          limitResponses: false
        }
      },
      {
        id: 2,
        title: "Bug Report Form",
        description: "Form for team members to report bugs and issues",
        type: "Bug Report",
        status: "Active",
        createdBy: "Sarah Johnson",
        createdDate: "2024-01-08",
        lastModified: "2024-01-12",
        responses: 15,
        views: 89,
        isPublic: false,
        fields: [
          { type: "text", label: "Bug Title", required: true },
          { type: "select", label: "Priority", required: true, options: ["Low", "Medium", "High", "Critical"] },
          { type: "textarea", label: "Description", required: true },
          { type: "file", label: "Screenshots", required: false }
        ],
        settings: {
          allowAnonymous: false,
          requireLogin: true,
          sendConfirmation: false,
          limitResponses: false
        }
      },
      {
        id: 3,
        title: "Client Requirements Form",
        description: "Gather detailed requirements from clients for new features",
        type: "Requirements",
        status: "Draft",
        createdBy: "Mike Wilson",
        createdDate: "2024-01-12",
        lastModified: "2024-01-14",
        responses: 0,
        views: 12,
        isPublic: true,
        fields: [
          { type: "text", label: "Feature Name", required: true },
          { type: "textarea", label: "Detailed Description", required: true },
          { type: "select", label: "Priority Level", required: true, options: ["Low", "Medium", "High"] },
          { type: "date", label: "Expected Delivery", required: false }
        ],
        settings: {
          allowAnonymous: true,
          requireLogin: false,
          sendConfirmation: true,
          limitResponses: true,
          maxResponses: 50
        }
      },
      {
        id: 4,
        title: "Team Performance Review",
        description: "Quarterly performance review form for team members",
        type: "Review",
        status: "Closed",
        createdBy: "Lisa Brown",
        createdDate: "2024-01-01",
        lastModified: "2024-01-05",
        responses: 8,
        views: 45,
        isPublic: false,
        fields: [
          { type: "text", label: "Employee Name", required: true },
          { type: "rating", label: "Technical Skills", required: true },
          { type: "rating", label: "Communication", required: true },
          { type: "textarea", label: "Goals for Next Quarter", required: true }
        ],
        settings: {
          allowAnonymous: false,
          requireLogin: true,
          sendConfirmation: true,
          limitResponses: false
        }
      }
    ]);

    setResponses([
      {
        id: 1,
        formId: 1,
        formTitle: "Project Feedback Survey",
        respondent: "Alice Cooper",
        email: "alice@company.com",
        submittedDate: "2024-01-15",
        responses: {
          "Name": "Alice Cooper",
          "Email": "alice@company.com",
          "Overall Satisfaction": "4",
          "Comments": "Great progress so far, keep up the good work!"
        }
      },
      {
        id: 2,
        formId: 2,
        formTitle: "Bug Report Form",
        respondent: "Bob Johnson",
        email: "bob@company.com",
        submittedDate: "2024-01-14",
        responses: {
          "Bug Title": "Login button not working",
          "Priority": "High",
          "Description": "The login button becomes unresponsive after clicking",
          "Screenshots": "screenshot.png"
        }
      }
    ]);
  }, [projectId]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Survey': 'bg-blue-100 text-blue-800',
      'Bug Report': 'bg-red-100 text-red-800',
      'Requirements': 'bg-purple-100 text-purple-800',
      'Review': 'bg-orange-100 text-orange-800',
      'Feedback': 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const filteredForms = forms.filter(form => {
    const matchesSearch = form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         form.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || form.status.toLowerCase() === statusFilter;
    
    const matchesTab = activeTab === "all" || 
                      (activeTab === "active" && form.status === "Active") ||
                      (activeTab === "draft" && form.status === "Draft") ||
                      (activeTab === "closed" && form.status === "Closed");
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  const CreateFormForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Form Title</Label>
        <Input id="title" placeholder="Enter form title" />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Describe the purpose of this form..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Form Type</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="survey">Survey</SelectItem>
              <SelectItem value="feedback">Feedback</SelectItem>
              <SelectItem value="bug-report">Bug Report</SelectItem>
              <SelectItem value="requirements">Requirements</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="application">Application</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-3">
        <Label>Form Settings</Label>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="public">Make form public</Label>
            <Switch id="public" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="anonymous">Allow anonymous responses</Label>
            <Switch id="anonymous" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="confirmation">Send confirmation email</Label>
            <Switch id="confirmation" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="limit">Limit number of responses</Label>
            <Switch id="limit" />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setIsCreateFormOpen(false)}>Cancel</Button>
        <Button onClick={() => {
          toast.success("Form created successfully!");
          setIsCreateFormOpen(false);
        }}>Create Form</Button>
      </div>
    </div>
  );

  const FormCard = ({ form }: { form: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <FormInput className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">{form.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(form.status)}>
              {form.status}
            </Badge>
            <Badge className={getTypeColor(form.type)}>
              {form.type}
            </Badge>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3">{form.description}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
          <div>
            <p className="text-muted-foreground">Responses</p>
            <p className="font-medium">{form.responses}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Views</p>
            <p className="font-medium">{form.views}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Created by</p>
            <p className="font-medium">{form.createdBy}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Last modified</p>
            <p className="font-medium">{form.lastModified}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          {form.isPublic && (
            <Badge variant="outline" className="text-xs">
              <Link className="h-3 w-3 mr-1" />
              Public
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {form.fields.length} fields
          </Badge>
        </div>
        
        <div className="flex justify-between items-center pt-3 border-t">
          <div className="flex gap-1">
            <Button size="sm" variant="ghost">
              <Eye className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost">
              <Edit className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost">
              <Copy className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost">
              <Share className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline">
              <BarChart3 className="h-3 w-3 mr-1" />
              Analytics
            </Button>
            {form.status === "Active" && (
              <Button size="sm">
                <Send className="h-3 w-3 mr-1" />
                Share
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Forms Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Forms</h2>
          <p className="text-muted-foreground">Create and manage forms for data collection and feedback</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Form
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Form</DialogTitle>
                <DialogDescription>
                  Create a new form to collect data and feedback
                </DialogDescription>
              </DialogHeader>
              <CreateFormForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Forms Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Forms</p>
                <p className="text-2xl font-bold">{forms.length}</p>
              </div>
              <FormInput className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Forms</p>
                <p className="text-2xl font-bold">{forms.filter(f => f.status === 'Active').length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Responses</p>
                <p className="text-2xl font-bold">{forms.reduce((sum, form) => sum + form.responses, 0)}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response Rate</p>
                <p className="text-2xl font-bold">68%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
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
              placeholder="Search forms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">All Forms</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredForms.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FormInput className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No forms found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "Create your first form to start collecting data"
                  }
                </p>
                <Button onClick={() => setIsCreateFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Form
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredForms.map((form) => (
                <FormCard key={form.id} form={form} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Recent Responses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Responses</CardTitle>
          <CardDescription>Latest form submissions from your team and stakeholders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {responses.slice(0, 5).map((response) => (
              <div key={response.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <FormInput className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{response.formTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      Response from {response.respondent}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{response.submittedDate}</p>
                  <Button size="sm" variant="ghost">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Form Templates</CardTitle>
          <CardDescription>Quick start templates for common form types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Users className="h-6 w-6 text-blue-500" />
              <span>Feedback Survey</span>
              <span className="text-xs text-muted-foreground">Collect user feedback</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <span>Bug Report</span>
              <span className="text-xs text-muted-foreground">Report issues and bugs</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <FileText className="h-6 w-6 text-green-500" />
              <span>Requirements Form</span>
              <span className="text-xs text-muted-foreground">Gather requirements</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectFormsView; 