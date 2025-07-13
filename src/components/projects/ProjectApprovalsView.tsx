import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import {
    AlertCircle,
    ArrowRight,
    Calendar,
    CheckCircle2,
    CheckSquare,
    Clock,
    Download,
    Edit,
    Eye,
    FileText,
    Flag,
    MessageSquare,
    Plus,
    Search,
    Send,
    Settings,
    Timer,
    User,
    Users,
    XCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ProjectApprovalsViewProps {
  projectId: string | undefined;
}

const ProjectApprovalsView: React.FC<ProjectApprovalsViewProps> = ({ projectId }) => {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateApprovalOpen, setIsCreateApprovalOpen] = useState(false);
  const [isCreateWorkflowOpen, setIsCreateWorkflowOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    // Mock approvals data
    setApprovals([
      {
        id: 1,
        title: "Project Budget Approval",
        description: "Approval required for Q1 project budget allocation of $150,000",
        type: "Budget",
        priority: "High",
        status: "Pending",
        requester: "John Smith",
        currentApprover: "Sarah Johnson",
        approvalChain: [
          { name: "Sarah Johnson", role: "Project Manager", status: "pending", order: 1 },
          { name: "Mike Wilson", role: "Finance Director", status: "waiting", order: 2 },
          { name: "Lisa Brown", role: "CEO", status: "waiting", order: 3 }
        ],
        createdDate: "2024-01-15",
        dueDate: "2024-01-20",
        documents: ["budget-proposal.pdf", "cost-breakdown.xlsx"],
        comments: [
          { author: "John Smith", message: "Urgent approval needed for project kickoff", date: "2024-01-15" }
        ]
      },
      {
        id: 2,
        title: "Design Mockup Approval",
        description: "Final approval for user interface design mockups and prototypes",
        type: "Design",
        priority: "Medium",
        status: "In Review",
        requester: "Lisa Brown",
        currentApprover: "Tom Davis",
        approvalChain: [
          { name: "Tom Davis", role: "UX Lead", status: "approved", order: 1 },
          { name: "Sarah Johnson", role: "Project Manager", status: "in_review", order: 2 }
        ],
        createdDate: "2024-01-12",
        dueDate: "2024-01-18",
        documents: ["ui-mockups.fig", "prototype-demo.mp4"],
        comments: [
          { author: "Tom Davis", message: "Looks good, minor adjustments needed", date: "2024-01-14" },
          { author: "Lisa Brown", message: "Updated based on feedback", date: "2024-01-15" }
        ]
      },
      {
        id: 3,
        title: "Technical Architecture Review",
        description: "Approval for proposed system architecture and technology stack",
        type: "Technical",
        priority: "High",
        status: "Approved",
        requester: "Mike Wilson",
        currentApprover: null,
        approvalChain: [
          { name: "Tom Davis", role: "Tech Lead", status: "approved", order: 1 },
          { name: "Sarah Johnson", role: "Project Manager", status: "approved", order: 2 },
          { name: "John Smith", role: "CTO", status: "approved", order: 3 }
        ],
        createdDate: "2024-01-08",
        dueDate: "2024-01-15",
        approvedDate: "2024-01-14",
        documents: ["architecture-diagram.pdf", "tech-stack-analysis.docx"],
        comments: [
          { author: "Tom Davis", message: "Architecture looks solid", date: "2024-01-10" },
          { author: "John Smith", message: "Approved with recommendations", date: "2024-01-14" }
        ]
      },
      {
        id: 4,
        title: "Marketing Campaign Approval",
        description: "Approval for Q1 marketing campaign strategy and budget",
        type: "Marketing",
        priority: "Medium",
        status: "Rejected",
        requester: "Emma Davis",
        currentApprover: null,
        approvalChain: [
          { name: "Sarah Johnson", role: "Project Manager", status: "approved", order: 1 },
          { name: "Mike Wilson", role: "Marketing Director", status: "rejected", order: 2 }
        ],
        createdDate: "2024-01-10",
        dueDate: "2024-01-17",
        rejectedDate: "2024-01-16",
        documents: ["campaign-strategy.pdf", "budget-breakdown.xlsx"],
        comments: [
          { author: "Mike Wilson", message: "Budget exceeds allocated amount, please revise", date: "2024-01-16" }
        ]
      }
    ]);

    setWorkflows([
      {
        id: 1,
        name: "Budget Approval Workflow",
        description: "Standard workflow for budget approvals",
        steps: [
          { role: "Project Manager", required: true },
          { role: "Finance Director", required: true },
          { role: "CEO", required: false, condition: "amount > $100,000" }
        ],
        isActive: true,
        createdBy: "Admin",
        createdDate: "2024-01-01"
      },
      {
        id: 2,
        name: "Design Review Workflow",
        description: "Workflow for design and creative approvals",
        steps: [
          { role: "UX Lead", required: true },
          { role: "Project Manager", required: true },
          { role: "Client", required: false, condition: "client_review_required" }
        ],
        isActive: true,
        createdBy: "Admin",
        createdDate: "2024-01-01"
      }
    ]);
  }, [projectId]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in review': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in review': return <Eye className="h-4 w-4 text-blue-500" />;
      case 'approved': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'expired': return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getApprovalChainStatus = (approvalChain: any[]) => {
    const total = approvalChain.length;
    const completed = approvalChain.filter(step => step.status === 'approved').length;
    return { completed, total, percentage: (completed / total) * 100 };
  };

  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch = approval.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         approval.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || approval.status.toLowerCase() === statusFilter;
    
    const matchesTab = activeTab === "all" || 
                      (activeTab === "pending" && approval.status === "Pending") ||
                      (activeTab === "in_review" && approval.status === "In Review") ||
                      (activeTab === "approved" && approval.status === "Approved") ||
                      (activeTab === "rejected" && approval.status === "Rejected");
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  const CreateApprovalForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Approval Title</Label>
        <Input id="title" placeholder="Enter approval title" />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Describe what needs approval..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Type</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="budget">Budget</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="legal">Legal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="dueDate">Due Date</Label>
        <Input id="dueDate" type="date" />
      </div>
      <div>
        <Label htmlFor="approvers">Approvers</Label>
        <Input id="approvers" placeholder="Enter approver names (comma separated)" />
      </div>
      <div>
        <Label htmlFor="documents">Attach Documents</Label>
        <Input id="documents" type="file" multiple />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setIsCreateApprovalOpen(false)}>Cancel</Button>
        <Button onClick={() => {
          toast.success("Approval request created successfully!");
          setIsCreateApprovalOpen(false);
        }}>Create Approval</Button>
      </div>
    </div>
  );

  const ApprovalCard = ({ approval }: { approval: any }) => {
    const chainStatus = getApprovalChainStatus(approval.approvalChain);
    
    return (
      <Card className={`hover:shadow-md transition-shadow border-l-4 ${getPriorityColor(approval.priority)}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {getStatusIcon(approval.status)}
              <h3 className="font-semibold">{approval.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(approval.status)}>
                {approval.status}
              </Badge>
              <Badge variant="outline">{approval.priority}</Badge>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">{approval.description}</p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{chainStatus.completed}/{chainStatus.total} approved</span>
            </div>
            <Progress value={chainStatus.percentage} className="h-2" />
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-muted-foreground" />
                <span>Requested by {approval.requester}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>Due {approval.dueDate}</span>
              </div>
            </div>
            
            {approval.currentApprover && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                <User className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Waiting for approval from <strong>{approval.currentApprover}</strong></span>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span>{approval.documents.length} documents</span>
                <MessageSquare className="h-3 w-3" />
                <span>{approval.comments.length} comments</span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost">
                  <Eye className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost">
                  <Edit className="h-3 w-3" />
                </Button>
                {approval.status === "Pending" && (
                  <Button size="sm" variant="ghost">
                    <Send className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Approvals Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Approvals</h2>
          <p className="text-muted-foreground">Manage approval workflows and track approval status</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isCreateWorkflowOpen} onOpenChange={setIsCreateWorkflowOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Workflows
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Approval Workflows</DialogTitle>
                <DialogDescription>
                  Manage approval workflows for your project
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <Card key={workflow.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{workflow.name}</h4>
                        <Badge variant={workflow.isActive ? "default" : "secondary"}>
                          {workflow.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{workflow.description}</p>
                      <div className="flex items-center gap-2">
                        {workflow.steps.map((step: any, index: number) => (
                          <React.Fragment key={index}>
                            <Badge variant="outline" className="text-xs">
                              {step.role}
                            </Badge>
                            {index < workflow.steps.length - 1 && (
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateApprovalOpen} onOpenChange={setIsCreateApprovalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Approval
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Approval Request</DialogTitle>
                <DialogDescription>
                  Submit a new item for approval
                </DialogDescription>
              </DialogHeader>
              <CreateApprovalForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Approval Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{approvals.filter(a => a.status === 'Pending').length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Review</p>
                <p className="text-2xl font-bold">{approvals.filter(a => a.status === 'In Review').length}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{approvals.filter(a => a.status === 'Approved').length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Time</p>
                <p className="text-2xl font-bold">2.5d</p>
              </div>
              <Timer className="h-8 w-8 text-purple-500" />
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
              placeholder="Search approvals..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in review">In Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in_review">In Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredApprovals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No approvals found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "Create your first approval request to get started"
                  }
                </p>
                <Button onClick={() => setIsCreateApprovalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Approval
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredApprovals.map((approval) => (
                <ApprovalCard key={approval.id} approval={approval} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common approval actions and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <span>Bulk Approve</span>
              <span className="text-xs text-muted-foreground">Approve multiple items</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Users className="h-6 w-6 text-blue-500" />
              <span>Delegate Approval</span>
              <span className="text-xs text-muted-foreground">Assign to another approver</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Flag className="h-6 w-6 text-orange-500" />
              <span>Set Reminders</span>
              <span className="text-xs text-muted-foreground">Configure approval reminders</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectApprovalsView; 