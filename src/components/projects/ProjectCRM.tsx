import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    BarChart3,
    Building2,
    Calendar,
    DollarSign,
    Edit,
    Eye,
    Filter,
    Mail,
    MessageSquare,
    Phone,
    Plus,
    Search,
    Target,
    TrendingUp,
    Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ProjectCRMProps {
  projectId: string | undefined;
}

const ProjectCRM: React.FC<ProjectCRMProps> = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState("contacts");
  const [contacts, setContacts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);

  useEffect(() => {
    // Mock data for demonstration
    setContacts([
      {
        id: 1,
        name: "John Smith",
        email: "john.smith@company.com",
        phone: "+1 (555) 123-4567",
        company: "Tech Corp",
        position: "CEO",
        status: "Active",
        lastContact: "2024-01-15",
        value: 50000,
        avatar: null,
        tags: ["VIP", "Decision Maker"],
        address: "123 Business St, NY",
        website: "techcorp.com"
      },
      {
        id: 2,
        name: "Sarah Johnson",
        email: "sarah.j@startup.io",
        phone: "+1 (555) 987-6543",
        company: "Startup Inc",
        position: "CTO",
        status: "Prospect",
        lastContact: "2024-01-12",
        value: 25000,
        avatar: null,
        tags: ["Technical", "Interested"],
        address: "456 Innovation Ave, CA",
        website: "startup.io"
      }
    ]);

    setLeads([
      {
        id: 1,
        name: "Enterprise Deal",
        company: "Big Corp",
        contact: "Mike Wilson",
        email: "mike@bigcorp.com",
        phone: "+1 (555) 111-2222",
        source: "Website",
        status: "Qualified",
        score: 85,
        value: 100000,
        createdDate: "2024-01-10",
        lastActivity: "2024-01-14"
      },
      {
        id: 2,
        name: "SMB Opportunity",
        company: "Small Business",
        contact: "Lisa Brown",
        email: "lisa@smallbiz.com",
        phone: "+1 (555) 333-4444",
        source: "Referral",
        status: "New",
        score: 65,
        value: 15000,
        createdDate: "2024-01-12",
        lastActivity: "2024-01-12"
      }
    ]);

    setDeals([
      {
        id: 1,
        name: "Q1 Software License",
        company: "Tech Corp",
        contact: "John Smith",
        stage: "Proposal",
        value: 75000,
        probability: 70,
        closeDate: "2024-02-15",
        createdDate: "2024-01-01",
        lastActivity: "2024-01-14",
        notes: "Waiting for final approval from board"
      },
      {
        id: 2,
        name: "Annual Support Contract",
        company: "Startup Inc",
        contact: "Sarah Johnson",
        stage: "Negotiation",
        value: 30000,
        probability: 85,
        closeDate: "2024-01-30",
        createdDate: "2024-01-05",
        lastActivity: "2024-01-13",
        notes: "Price negotiation in progress"
      }
    ]);

    setActivities([
      {
        id: 1,
        type: "call",
        contact: "John Smith",
        company: "Tech Corp",
        description: "Follow-up call regarding proposal",
        date: "2024-01-15",
        duration: "30 min",
        outcome: "Positive"
      },
      {
        id: 2,
        type: "email",
        contact: "Sarah Johnson",
        company: "Startup Inc",
        description: "Sent pricing information",
        date: "2024-01-14",
        outcome: "Sent"
      },
      {
        id: 3,
        type: "meeting",
        contact: "Mike Wilson",
        company: "Big Corp",
        description: "Product demo presentation",
        date: "2024-01-13",
        duration: "60 min",
        outcome: "Interested"
      }
    ]);
  }, [projectId]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      case 'qualified': return 'bg-purple-100 text-purple-800';
      case 'new': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'proposal': return 'bg-yellow-100 text-yellow-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'closed won': return 'bg-green-100 text-green-800';
      case 'closed lost': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const AddContactForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" placeholder="Enter full name" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="Enter email" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" placeholder="Enter phone number" />
        </div>
        <div>
          <Label htmlFor="company">Company</Label>
          <Input id="company" placeholder="Enter company name" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="position">Position</Label>
          <Input id="position" placeholder="Enter position/title" />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" placeholder="Additional notes..." />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setIsAddContactOpen(false)}>Cancel</Button>
        <Button onClick={() => {
          toast.success("Contact added successfully!");
          setIsAddContactOpen(false);
        }}>Add Contact</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* CRM Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project CRM</h2>
          <p className="text-muted-foreground">Manage contacts, leads, and deals for this project</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Quick Add
          </Button>
        </div>
      </div>

      {/* CRM Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                <p className="text-2xl font-bold">{contacts.length}</p>
                <p className="text-xs text-green-600">+2 this week</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Leads</p>
                <p className="text-2xl font-bold">{leads.length}</p>
                <p className="text-xs text-green-600">+1 this week</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Deals</p>
                <p className="text-2xl font-bold">{deals.length}</p>
                <p className="text-xs text-orange-600">$105K pipeline</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">68%</p>
                <p className="text-xs text-green-600">+5% vs last month</p>
              </div>
              <TrendingUp className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                  <DialogDescription>
                    Add a new contact to your project CRM
                  </DialogDescription>
                </DialogHeader>
                <AddContactForm />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((contact) => (
              <Card key={contact.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback>{contact.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{contact.name}</h3>
                        <p className="text-sm text-muted-foreground">{contact.position}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(contact.status)}>
                      {contact.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.company}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>${contact.value.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-3">
                    {contact.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-3 border-t">
                    <span className="text-xs text-muted-foreground">
                      Last contact: {contact.lastContact}
                    </span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Lead Pipeline</h3>
            <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Lead</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Lead name" />
                  <Input placeholder="Company" />
                  <Input placeholder="Contact person" />
                  <Input placeholder="Email" />
                  <Input placeholder="Phone" />
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Lead source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddLeadOpen(false)}>Cancel</Button>
                    <Button onClick={() => {
                      toast.success("Lead added successfully!");
                      setIsAddLeadOpen(false);
                    }}>Add Lead</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {leads.map((lead) => (
              <Card key={lead.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{lead.name}</h3>
                      <p className="text-sm text-muted-foreground">{lead.company} • {lead.contact}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                      <div className="text-right">
                        <p className="font-semibold">${lead.value.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Score: {lead.score}%</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="truncate">{lead.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p>{lead.phone}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Source</p>
                      <p>{lead.source}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p>{lead.createdDate}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Lead Score</span>
                      <span className="text-sm font-medium">{lead.score}%</span>
                    </div>
                    <Progress value={lead.score} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deals" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Sales Pipeline</h3>
            <Dialog open={isAddDealOpen} onOpenChange={setIsAddDealOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Deal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Deal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Deal name" />
                  <Input placeholder="Company" />
                  <Input placeholder="Contact person" />
                  <Input placeholder="Deal value" type="number" />
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Deal stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospecting">Prospecting</SelectItem>
                      <SelectItem value="qualification">Qualification</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="closed-won">Closed Won</SelectItem>
                      <SelectItem value="closed-lost">Closed Lost</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Expected close date" type="date" />
                  <Textarea placeholder="Deal notes..." />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDealOpen(false)}>Cancel</Button>
                    <Button onClick={() => {
                      toast.success("Deal added successfully!");
                      setIsAddDealOpen(false);
                    }}>Add Deal</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {deals.map((deal) => (
              <Card key={deal.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{deal.name}</h3>
                      <p className="text-sm text-muted-foreground">{deal.company} • {deal.contact}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">${deal.value.toLocaleString()}</p>
                      <Badge className={getStageColor(deal.stage)}>
                        {deal.stage}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground">Probability</p>
                      <p className="font-medium">{deal.probability}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Close Date</p>
                      <p>{deal.closeDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p>{deal.createdDate}</p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Win Probability</span>
                      <span className="text-sm font-medium">{deal.probability}%</span>
                    </div>
                    <Progress value={deal.probability} className="h-2" />
                  </div>
                  
                  {deal.notes && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm">{deal.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Activities</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Log Activity
            </Button>
          </div>

          <div className="space-y-3">
            {activities.map((activity) => (
              <Card key={activity.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      {activity.type === 'call' && <Phone className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'email' && <Mail className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'meeting' && <Calendar className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{activity.contact}</h4>
                        <span className="text-sm text-muted-foreground">{activity.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{activity.company}</p>
                      <p className="text-sm">{activity.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {activity.duration && <span>Duration: {activity.duration}</span>}
                        <span>Outcome: {activity.outcome}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Funnel</CardTitle>
                <CardDescription>Conversion rates through the pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Leads</span>
                    <span className="font-medium">100%</span>
                  </div>
                  <Progress value={100} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Qualified</span>
                    <span className="font-medium">75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Proposal</span>
                    <span className="font-medium">50%</span>
                  </div>
                  <Progress value={50} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Closed Won</span>
                    <span className="font-medium">25%</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue Forecast</CardTitle>
                <CardDescription>Projected revenue for next 3 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">This Month</p>
                      <p className="text-xl font-bold text-green-600">$45,000</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Next Month</p>
                      <p className="text-xl font-bold text-blue-600">$62,000</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-500" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Q1 Total</p>
                      <p className="text-xl font-bold text-purple-600">$180,000</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Key performance indicators for this project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">68%</p>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">$52K</p>
                  <p className="text-sm text-muted-foreground">Avg Deal Size</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">14</p>
                  <p className="text-sm text-muted-foreground">Days Avg Cycle</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">85%</p>
                  <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectCRM; 