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
    AlignLeft,
    ArrowDown,
    ArrowUp,
    BarChart3,
    Calendar,
    CheckCircle2,
    Copy,
    Download,
    Edit,
    Eye,
    FileText,
    FormInput,
    Hash,
    Link,
    Mail,
    Phone,
    Plus,
    Radio,
    Search,
    Send,
    Settings,
    Share,
    Sliders,
    Square,
    Star,
    Trash2,
    Type,
    Upload,
    Users,
    X
} from 'lucide-react';
import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useForms, useCreateForm, useUpdateForm, useDeleteForm, useFormResponses, useShareForm, useFormShares, useDeleteFormShare } from '@/hooks/useForms';
import { type Form, type FormField, api } from '@/lib/api';

interface ProjectFormsViewProps {
  projectId: string | undefined;
}

const ProjectFormsView: React.FC<ProjectFormsViewProps> = ({ projectId }) => {
  const { data: forms = [], isLoading } = useForms(projectId);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [editingForm, setEditingForm] = useState<Form | null>(null);
  const [sharingForm, setSharingForm] = useState<Form | null>(null);
  const [viewingForm, setViewingForm] = useState<Form | null>(null);

  const createForm = useCreateForm();
  const updateForm = useUpdateForm();
  const deleteForm = useDeleteForm();
  const shareForm = useShareForm();
  const deleteShare = useDeleteFormShare();

  // Form creation state
  const [newForm, setNewForm] = useState({
    title: '',
    description: '',
    type: 'survey' as Form['type'],
    status: 'draft' as Form['status'],
    fields: [] as FormField[],
    settings: {
      allowAnonymous: false,
      requireLogin: true,
      sendConfirmation: true,
      limitResponses: false,
      maxResponses: 100,
    },
    isPublic: false,
  });

  // Field editor state - using inline editing instead of dialog
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  // AI form generation state
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Form templates
  const formTemplates = {
    'feedback-survey': {
      title: 'Customer Feedback Survey',
      description: 'Collect comprehensive feedback from customers about your product or service',
      type: 'feedback' as Form['type'],
      fields: [
        { id: 'f1', type: 'text' as const, label: 'Your Name', placeholder: 'Enter your full name', required: true },
        { id: 'f2', type: 'email' as const, label: 'Email Address', placeholder: 'your.email@example.com', required: true },
        { id: 'f3', type: 'rating' as const, label: 'Overall Satisfaction', placeholder: '', required: true, min: 1, max: 5 },
        { id: 'f4', type: 'select' as const, label: 'How did you hear about us?', placeholder: 'Select an option', required: false, options: ['Social Media', 'Search Engine', 'Friend/Colleague', 'Advertisement', 'Other'] },
        { id: 'f5', type: 'scale' as const, label: 'Likelihood to Recommend (0-10)', placeholder: '', required: true, min: 0, max: 10, step: 1 },
        { id: 'f6', type: 'textarea' as const, label: 'Additional Comments', placeholder: 'Share your thoughts, suggestions, or concerns...', required: false },
      ],
    },
    'bug-report': {
      title: 'Bug Report & Issue Tracking',
      description: 'Report bugs, issues, or unexpected behavior in our application',
      type: 'bug-report' as Form['type'],
      fields: [
        { id: 'f1', type: 'text' as const, label: 'Bug Title', placeholder: 'Brief, descriptive title (e.g., "Login button not working")', required: true },
        { id: 'f2', type: 'select' as const, label: 'Severity Level', placeholder: 'Select severity', required: true, options: ['Low - Minor issue', 'Medium - Affects functionality', 'High - Major issue', 'Critical - System down'] },
        { id: 'f3', type: 'select' as const, label: 'Affected Area', placeholder: 'Select area', required: true, options: ['Authentication', 'Dashboard', 'Forms', 'Reports', 'Settings', 'Other'] },
        { id: 'f4', type: 'textarea' as const, label: 'Detailed Description', placeholder: 'Describe the bug in detail. What happened? What did you expect?', required: true },
        { id: 'f5', type: 'textarea' as const, label: 'Steps to Reproduce', placeholder: '1. Go to...\n2. Click on...\n3. See error...', required: true },
        { id: 'f6', type: 'textarea' as const, label: 'Environment Details', placeholder: 'Browser, OS, device, etc.', required: false },
        { id: 'f7', type: 'file' as const, label: 'Screenshots/Attachments', placeholder: '', required: false },
      ],
    },
    'contact-form': {
      title: 'Contact Us Form',
      description: 'Get in touch with our team. We\'ll respond within 24 hours.',
      type: 'application' as Form['type'],
      fields: [
        { id: 'f1', type: 'text' as const, label: 'Full Name', placeholder: 'John Doe', required: true },
        { id: 'f2', type: 'email' as const, label: 'Email Address', placeholder: 'john.doe@example.com', required: true },
        { id: 'f3', type: 'phone' as const, label: 'Phone Number', placeholder: '+1 (555) 123-4567', required: false },
        { id: 'f4', type: 'text' as const, label: 'Company/Organization', placeholder: 'Your company name', required: false },
        { id: 'f5', type: 'select' as const, label: 'Inquiry Type', placeholder: 'Select type', required: true, options: ['General Inquiry', 'Sales Question', 'Technical Support', 'Partnership', 'Other'] },
        { id: 'f6', type: 'textarea' as const, label: 'Message', placeholder: 'Tell us how we can help you...', required: true },
      ],
    },
    'event-registration': {
      title: 'Event Registration Form',
      description: 'Register for our upcoming event. Secure your spot today!',
      type: 'application' as Form['type'],
      fields: [
        { id: 'f1', type: 'text' as const, label: 'Full Name', placeholder: 'Enter your full name', required: true },
        { id: 'f2', type: 'email' as const, label: 'Email Address', placeholder: 'your.email@example.com', required: true },
        { id: 'f3', type: 'phone' as const, label: 'Phone Number', placeholder: '+1 (555) 123-4567', required: true },
        { id: 'f4', type: 'text' as const, label: 'Organization/Company', placeholder: 'Your organization name', required: false },
        { id: 'f5', type: 'date' as const, label: 'Preferred Event Date', placeholder: 'Select date', required: false },
        { id: 'f6', type: 'radio' as const, label: 'Attendance Type', placeholder: '', required: true, options: ['In-person', 'Virtual/Online', 'Both (Hybrid)'] },
        { id: 'f7', type: 'checkbox' as const, label: 'Dietary Requirements', placeholder: '', required: false, options: ['Vegetarian', 'Vegan', 'Gluten-free', 'No restrictions'] },
        { id: 'f8', type: 'textarea' as const, label: 'Special Requests or Notes', placeholder: 'Any special accommodations or requests?', required: false },
      ],
    },
    'product-feedback': {
      title: 'Product Feedback & Feature Request',
      description: 'Share your ideas and help us improve our product',
      type: 'feedback' as Form['type'],
      fields: [
        { id: 'f1', type: 'text' as const, label: 'Your Name', placeholder: 'Enter your name', required: true },
        { id: 'f2', type: 'email' as const, label: 'Email', placeholder: 'your.email@example.com', required: true },
        { id: 'f3', type: 'rating' as const, label: 'Product Rating', placeholder: '', required: true, min: 1, max: 5 },
        { id: 'f4', type: 'select' as const, label: 'Feature Category', placeholder: 'Select category', required: true, options: ['New Feature Request', 'Improvement Suggestion', 'Bug Report', 'UI/UX Feedback', 'Performance Issue'] },
        { id: 'f5', type: 'textarea' as const, label: 'Your Feedback', placeholder: 'Describe your idea, suggestion, or feedback in detail...', required: true },
        { id: 'f6', type: 'scale' as const, label: 'Priority Level (1-10)', placeholder: '', required: false, min: 1, max: 10, step: 1 },
      ],
    },
  };

  const fieldTypes = [
    { value: 'text', label: 'Text Input', icon: <Type className="h-4 w-4" /> },
    { value: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
    { value: 'phone', label: 'Phone', icon: <Phone className="h-4 w-4" /> },
    { value: 'number', label: 'Number', icon: <Hash className="h-4 w-4" /> },
    { value: 'textarea', label: 'Text Area', icon: <AlignLeft className="h-4 w-4" /> },
    { value: 'select', label: 'Dropdown', icon: <Settings className="h-4 w-4" /> },
    { value: 'checkbox', label: 'Checkbox', icon: <Square className="h-4 w-4" /> },
    { value: 'radio', label: 'Radio Button', icon: <Radio className="h-4 w-4" /> },
    { value: 'date', label: 'Date', icon: <Calendar className="h-4 w-4" /> },
    { value: 'rating', label: 'Rating (Stars)', icon: <Star className="h-4 w-4" /> },
    { value: 'scale', label: 'Scale/Slider', icon: <Sliders className="h-4 w-4" /> },
    { value: 'file', label: 'File Upload', icon: <Upload className="h-4 w-4" /> },
  ];

  const handleAddField = (type: string) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: type as FormField['type'],
      label: `New ${type} field`,
      placeholder: type === 'rating' || type === 'scale' ? undefined : `Enter ${type}`,
      required: false,
      options: (type === 'select' || type === 'radio') ? ['Option 1', 'Option 2'] : undefined,
      min: (type === 'rating' || type === 'scale') ? 1 : undefined,
      max: type === 'rating' ? 5 : type === 'scale' ? 10 : undefined,
      step: type === 'scale' ? 1 : undefined,
    };
    setNewForm(prev => ({ ...prev, fields: [...prev.fields, newField] }));
    setEditingFieldId(newField.id);
  };

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    setNewForm(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    }));
  };

  const handleToggleEdit = (fieldId: string) => {
    setEditingFieldId(editingFieldId === fieldId ? null : fieldId);
  };

  const handleDeleteField = (index: number) => {
    setNewForm(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    setNewForm(prev => {
      if (newIndex < 0 || newIndex >= prev.fields.length) return prev;
      const updatedFields = [...prev.fields];
      [updatedFields[index], updatedFields[newIndex]] = [updatedFields[newIndex], updatedFields[index]];
      return { ...prev, fields: updatedFields };
    });
  };

  const handleUseTemplate = (templateKey: keyof typeof formTemplates) => {
    const template = formTemplates[templateKey];
    setNewForm(prev => ({
      ...prev,
      title: template.title,
      description: template.description,
      type: template.type,
      fields: template.fields.map(f => ({ ...f, id: `field-${Date.now()}-${Math.random()}` })),
    }));
    toast.success('Template applied! Customize as needed.');
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a description of the form you want to create');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.agents.ai.chat({
        provider: 'openai',
        messages: [
          {
            role: 'system',
            content: `You are a form builder assistant. Generate a complete form structure from user descriptions. 
Return ONLY a valid JSON object with this exact structure:
{
  "title": "Form Title",
  "description": "Form description",
  "type": "survey|feedback|bug-report|requirements|review|application",
  "fields": [
    {
      "id": "field-1",
      "type": "text|email|phone|number|textarea|select|checkbox|radio|date|rating|scale|file",
      "label": "Field Label",
      "placeholder": "Placeholder text",
      "required": true|false,
      "options": ["Option 1", "Option 2"] // only for select/radio/checkbox
      "min": 1, // only for rating/scale
      "max": 5, // only for rating/scale
      "step": 1 // only for scale
    }
  ]
}
Make sure all field IDs are unique. Use appropriate field types based on the user's needs.`
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        temperature: 0.7,
        maxTokens: 2000
      });

      try {
        const formData = JSON.parse(response.content);
        
        // Validate and set form data
        if (formData.title && formData.fields && Array.isArray(formData.fields)) {
          setNewForm(prev => ({
            ...prev,
            title: formData.title,
            description: formData.description || '',
            type: formData.type || 'survey',
            fields: formData.fields.map((f: any, idx: number) => ({
              id: f.id || `field-${Date.now()}-${idx}`,
              type: f.type || 'text',
              label: f.label || 'Untitled Field',
              placeholder: f.placeholder,
              required: f.required || false,
              options: f.options,
              min: f.min,
              max: f.max,
              step: f.step,
            })),
          }));
          setIsAiDialogOpen(false);
          setAiPrompt('');
          toast.success('Form generated successfully! Review and customize as needed.');
        } else {
          throw new Error('Invalid form structure');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        toast.error('Failed to parse AI response. Please try again with a clearer description.');
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast.error(error?.response?.data?.message || 'Failed to generate form. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handlers
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewForm(prev => ({ ...prev, title: e.target.value }));
  }, []);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewForm(prev => ({ ...prev, description: e.target.value }));
  }, []);

  const handleCreateForm = async () => {
    if (!newForm.title.trim()) {
      toast.error('Form title is required');
      return;
    }
    try {
      await createForm.mutateAsync({
        ...newForm,
        projectId,
      });
      setNewForm({
        title: '',
        description: '',
        type: 'survey',
        status: 'draft',
        fields: [],
        settings: {
          allowAnonymous: false,
          requireLogin: true,
          sendConfirmation: true,
          limitResponses: false,
          maxResponses: 100,
        },
        isPublic: false,
      });
      setIsCreateFormOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create form');
    }
  };

  const handleDeleteForm = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form? All responses will be deleted.')) return;
    try {
      await deleteForm.mutateAsync(id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete form');
    }
  };

  const handleShareForm = async (form: Form, userId?: string, access: 'view' | 'respond' | 'edit' = 'respond') => {
    try {
      await shareForm.mutateAsync({
        id: form.id,
        data: { userId, access },
      });
      setSharingForm(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to share form');
    }
  };

  const handleCopyFormLink = (form: Form) => {
    const link = `${window.location.origin}/forms/${form.id}`;
    navigator.clipboard.writeText(link);
    toast.success('Form link copied to clipboard');
  };

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

  const filteredForms = forms.filter((form: Form) => {
    const matchesSearch = form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (form.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || form.status.toLowerCase() === statusFilter;
    
    const matchesTab = activeTab === "all" || 
                      (activeTab === "active" && form.status === "active") ||
                      (activeTab === "draft" && form.status === "draft") ||
                      (activeTab === "closed" && form.status === "closed");
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  const CreateFormForm = () => (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* AI Form Generation */}
      <div className="space-y-2 border-b pb-4">
        <div className="flex items-center justify-between">
          <Label>AI Form Generator</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAiDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Star className="h-4 w-4" />
            Generate with AI
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Describe the form you want to create and AI will generate it for you
        </p>
      </div>

      {/* Form Templates */}
      <div className="space-y-2">
        <Label>Quick Start Templates</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleUseTemplate('feedback-survey')}
            className="h-auto p-3 flex flex-col items-start"
          >
            <Users className="h-5 w-5 mb-1 text-blue-500" />
            <span className="font-medium">Customer Feedback</span>
            <span className="text-xs text-muted-foreground">Comprehensive feedback survey</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleUseTemplate('product-feedback')}
            className="h-auto p-3 flex flex-col items-start"
          >
            <Star className="h-5 w-5 mb-1 text-yellow-500" />
            <span className="font-medium">Product Feedback</span>
            <span className="text-xs text-muted-foreground">Feature requests & ratings</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleUseTemplate('bug-report')}
            className="h-auto p-3 flex flex-col items-start"
          >
            <AlertCircle className="h-5 w-5 mb-1 text-red-500" />
            <span className="font-medium">Bug Report</span>
            <span className="text-xs text-muted-foreground">Issue tracking form</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleUseTemplate('contact-form')}
            className="h-auto p-3 flex flex-col items-start"
          >
            <Mail className="h-5 w-5 mb-1 text-green-500" />
            <span className="font-medium">Contact Us</span>
            <span className="text-xs text-muted-foreground">Get in touch form</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleUseTemplate('event-registration')}
            className="h-auto p-3 flex flex-col items-start"
          >
            <Calendar className="h-5 w-5 mb-1 text-purple-500" />
            <span className="font-medium">Event Registration</span>
            <span className="text-xs text-muted-foreground">Register for events</span>
          </Button>
        </div>
      </div>

      {/* Basic Form Info */}
      <div className="space-y-4 border-t pt-4">
        <div>
          <Label htmlFor="title">Form Title *</Label>
          <Input 
            id="title" 
            placeholder="Enter form title" 
            value={newForm.title}
            onChange={handleTitleChange}
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            placeholder="Describe the purpose of this form..." 
            value={newForm.description}
            onChange={handleDescriptionChange}
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Form Type</Label>
            <Select value={newForm.type} onValueChange={(v) => {
              setNewForm(prev => ({ ...prev, type: v as Form['type'] }));
            }}>
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
            <Select value={newForm.status} onValueChange={(v) => {
              setNewForm(prev => ({ ...prev, status: v as Form['status'] }));
            }}>
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
      </div>

      {/* Add Fields Section */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <Label>Form Fields</Label>
          <Badge variant="outline">{newForm.fields.length} fields</Badge>
        </div>
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">Add Field Type</Label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {fieldTypes.map((fieldType) => (
              <Button
                key={fieldType.value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddField(fieldType.value)}
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                {fieldType.icon}
                <span className="text-xs">{fieldType.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Fields List - Google Forms Style Inline Editing */}
        {newForm.fields.length > 0 && (
          <div className="space-y-4 border rounded-lg p-4 bg-background">
            {newForm.fields.map((field, index) => {
              const isEditing = editingFieldId === field.id;
              return (
                <div key={field.id} className="border-b last:border-b-0 pb-4 last:pb-0 space-y-3">
                  {/* Field Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Question/Label - Inline Editable */}
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={field.label || ''}
                            onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                            placeholder="Question"
                            className="text-base font-medium"
                            autoFocus
                          />
                          <Input
                            value={field.placeholder || ''}
                            onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                            placeholder="Description or placeholder (optional)"
                            className="text-sm"
                          />
                          
                          {/* Options for select/radio/checkbox */}
                          {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
                            <div className="space-y-2">
                              <Label className="text-xs">Options</Label>
                              {field.options?.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <Input
                                    value={opt}
                                    onChange={(e) => {
                                      const newOptions = [...(field.options || [])];
                                      newOptions[optIdx] = e.target.value;
                                      handleUpdateField(field.id, { options: newOptions });
                                    }}
                                    placeholder={`Option ${optIdx + 1}`}
                                    className="text-sm"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const newOptions = field.options?.filter((_, i) => i !== optIdx) || [];
                                      handleUpdateField(field.id, { options: newOptions.length > 0 ? newOptions : undefined });
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`];
                                  handleUpdateField(field.id, { options: newOptions });
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Option
                              </Button>
                            </div>
                          )}

                          {/* Min/Max for rating/scale */}
                          {(field.type === 'rating' || field.type === 'scale') && (
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs">Min</Label>
                                <Input
                                  type="number"
                                  value={field.min ?? ''}
                                  onChange={(e) => handleUpdateField(field.id, { min: e.target.value ? Number(e.target.value) : undefined })}
                                  placeholder="1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Max</Label>
                                <Input
                                  type="number"
                                  value={field.max ?? ''}
                                  onChange={(e) => handleUpdateField(field.id, { max: e.target.value ? Number(e.target.value) : undefined })}
                                  placeholder="5"
                                />
                              </div>
                              {field.type === 'scale' && (
                                <div>
                                  <Label className="text-xs">Step</Label>
                                  <Input
                                    type="number"
                                    value={field.step ?? ''}
                                    onChange={(e) => handleUpdateField(field.id, { step: e.target.value ? Number(e.target.value) : undefined })}
                                    placeholder="1"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Field Type Selector */}
                          <div>
                            <Label className="text-xs">Field Type</Label>
                            <Select
                              value={field.type}
                              onValueChange={(v) => handleUpdateField(field.id, { type: v as FormField['type'] })}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {fieldTypes.map(ft => (
                                  <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Required Toggle */}
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={field.required || false}
                              onCheckedChange={(checked) => handleUpdateField(field.id, { required: checked })}
                            />
                            <Label className="text-sm">Required</Label>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="cursor-pointer hover:bg-muted/50 p-2 rounded -ml-2"
                          onClick={() => setEditingFieldId(field.id)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base font-medium">{field.label || 'Untitled Question'}</span>
                            {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                            <Badge variant="outline" className="text-xs">{field.type}</Badge>
                          </div>
                          {field.placeholder && (
                            <p className="text-sm text-muted-foreground">{field.placeholder}</p>
                          )}
                          {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && field.options && (
                            <div className="mt-2 space-y-1">
                              {field.options.map((opt, optIdx) => (
                                <div key={optIdx} className="text-sm text-muted-foreground flex items-center gap-2">
                                  {field.type === 'radio' && <Radio className="h-3 w-3" />}
                                  {field.type === 'checkbox' && <Square className="h-3 w-3" />}
                                  {field.type === 'select' && <span className="text-xs">•</span>}
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!isEditing && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveField(index, 'up')}
                            disabled={index === 0}
                            title="Move up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveField(index, 'down')}
                            disabled={index === newForm.fields.length - 1}
                            title="Move down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleEdit(field.id)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {isEditing && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingFieldId(null)}
                          title="Done"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteField(index)}
                        title="Delete"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Settings */}
      <div className="space-y-3 border-t pt-4">
        <Label>Form Settings</Label>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="public" className="text-sm font-normal">Make form public</Label>
            <Switch 
              id="public" 
              checked={newForm.isPublic}
              onCheckedChange={(checked) => {
                setNewForm(prev => ({ ...prev, isPublic: checked }));
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="anonymous" className="text-sm font-normal">Allow anonymous responses</Label>
            <Switch 
              id="anonymous" 
              checked={newForm.settings.allowAnonymous}
              onCheckedChange={(checked) => {
                setNewForm(prev => ({ 
                  ...prev, 
                  settings: { ...prev.settings, allowAnonymous: checked } 
                }));
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="confirmation" className="text-sm font-normal">Send confirmation email</Label>
            <Switch 
              id="confirmation" 
              checked={newForm.settings.sendConfirmation}
              onCheckedChange={(checked) => {
                setNewForm(prev => ({ 
                  ...prev, 
                  settings: { ...prev.settings, sendConfirmation: checked } 
                }));
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="limit" className="text-sm font-normal">Limit number of responses</Label>
            <Switch 
              id="limit" 
              checked={newForm.settings.limitResponses}
              onCheckedChange={(checked) => {
                setNewForm(prev => ({ 
                  ...prev, 
                  settings: { ...prev.settings, limitResponses: checked } 
                }));
              }}
            />
          </div>
        </div>
      </div>

      {/* AI Generation Dialog */}
      <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Form with AI</DialogTitle>
            <DialogDescription>
              Describe the form you want to create. AI will generate the form structure with appropriate fields.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ai-prompt">Form Description</Label>
              <Textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Example: Create a customer satisfaction survey with name, email, rating from 1-5, and comments field..."
                rows={6}
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Be specific about the fields you need. Mention field types, whether they're required, and any options for dropdowns.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsAiDialogOpen(false);
                setAiPrompt('');
              }} disabled={isGenerating}>
                Cancel
              </Button>
              <Button onClick={handleGenerateWithAI} disabled={!aiPrompt.trim() || isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate Form'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Actions */}
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={() => {
          setIsCreateFormOpen(false);
          setNewForm({
            title: '',
            description: '',
            type: 'survey',
            status: 'draft',
            fields: [],
            settings: {
              allowAnonymous: false,
              requireLogin: true,
              sendConfirmation: true,
              limitResponses: false,
              maxResponses: 100,
            },
            isPublic: false,
          });
          setEditingFieldId(null);
        }}>
          Cancel
        </Button>
        <Button onClick={handleCreateForm} disabled={!newForm.title.trim() || createForm.isPending}>
          {createForm.isPending ? 'Creating...' : 'Create Form'}
        </Button>
      </div>
    </div>
  );

  const FormCard = ({ form }: { form: Form }) => (
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
            {form.type && (
              <Badge className={getTypeColor(form.type)}>
                {form.type}
              </Badge>
            )}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3">{form.description || 'No description'}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
          <div>
            <p className="text-muted-foreground">Responses</p>
            <p className="font-medium">{form.responses || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Views</p>
            <p className="font-medium">{form.views || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Created by</p>
            <p className="font-medium">{form.creator?.name || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Last modified</p>
            <p className="font-medium">{new Date(form.updatedAt).toLocaleDateString()}</p>
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
            {form.fields?.length || 0} fields
          </Badge>
        </div>
        
        <div className="flex justify-between items-center pt-3 border-t">
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => setViewingForm(form)}>
              <Eye className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingForm(form)}>
              <Edit className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleCopyFormLink(form)}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSharingForm(form)}>
              <Share className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={async () => {
              try {
                const responses = await api.forms.listResponses(form.id);
                toast.info(`Form has ${responses?.length || 0} responses`);
              } catch (error) {
                toast.error('Failed to load responses');
              }
            }}>
              <BarChart3 className="h-3 w-3 mr-1" />
              Analytics
            </Button>
            {form.status === "active" && (
              <Button size="sm" onClick={() => setSharingForm(form)}>
                <Send className="h-3 w-3 mr-1" />
                Share
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => handleDeleteForm(form.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
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
      {isLoading ? (
        <div className="text-center py-8">Loading forms...</div>
      ) : (
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
                  <p className="text-2xl font-bold">{forms.filter((f: Form) => f.status === 'active').length}</p>
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
                  <p className="text-2xl font-bold">{forms.reduce((sum: number, form: Form) => sum + (form.responses || 0), 0)}</p>
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
                  <p className="text-2xl font-bold">{forms.reduce((sum: number, form: Form) => sum + (form.views || 0), 0)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
            {forms.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No forms yet. Create a form to start collecting responses.</p>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Click on a form's "Analytics" button to view its responses.
              </p>
            )}
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