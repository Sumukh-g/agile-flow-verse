import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    AlignLeft,
    Calendar,
    Copy,
    Download,
    Edit,
    Eye,
    Hash,
    Mail,
    Phone,
    Plus,
    Radio,
    Send,
    Settings,
    Square,
    Trash2,
    Type
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface Form {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  isPublished: boolean;
  createdAt: string;
  responses: number;
}

const NoteForms: React.FC<{ note: any; onUpdateNote: (noteId: string, updates: any) => void }> = ({ note, onUpdateNote }) => {
  const [forms, setForms] = useState<Form[]>([
    {
      id: '1',
      title: 'User Feedback Form',
      description: 'Collect feedback from users about our product',
      fields: [
        { id: 'f1', type: 'text', label: 'Name', placeholder: 'Enter your name', required: true },
        { id: 'f2', type: 'email', label: 'Email', placeholder: 'Enter your email', required: true },
        { id: 'f3', type: 'textarea', label: 'Feedback', placeholder: 'Share your thoughts', required: true },
        { id: 'f4', type: 'select', label: 'Rating', options: ['Excellent', 'Good', 'Average', 'Poor'], required: true }
      ],
      isPublished: true,
      createdAt: '2024-01-15',
      responses: 24
    },
    {
      id: '2',
      title: 'Contact Information',
      description: 'Collect contact details from potential clients',
      fields: [
        { id: 'f5', type: 'text', label: 'Company Name', placeholder: 'Enter company name', required: true },
        { id: 'f6', type: 'email', label: 'Email', placeholder: 'Enter email address', required: true },
        { id: 'f7', type: 'phone', label: 'Phone', placeholder: 'Enter phone number', required: false },
        { id: 'f8', type: 'textarea', label: 'Message', placeholder: 'Tell us about your project', required: true }
      ],
      isPublished: false,
      createdAt: '2024-01-10',
      responses: 8
    }
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newForm, setNewForm] = useState({
    title: '',
    description: '',
    fields: [] as FormField[]
  });
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);

  const fieldTypes = [
    { value: 'text', label: 'Text Input', icon: <Type className="h-4 w-4" /> },
    { value: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
    { value: 'phone', label: 'Phone', icon: <Phone className="h-4 w-4" /> },
    { value: 'number', label: 'Number', icon: <Hash className="h-4 w-4" /> },
    { value: 'textarea', label: 'Text Area', icon: <AlignLeft className="h-4 w-4" /> },
    { value: 'select', label: 'Dropdown', icon: <Settings className="h-4 w-4" /> },
    { value: 'checkbox', label: 'Checkbox', icon: <Square className="h-4 w-4" /> },
    { value: 'radio', label: 'Radio Button', icon: <Radio className="h-4 w-4" /> },
    { value: 'date', label: 'Date', icon: <Calendar className="h-4 w-4" /> }
  ];

  const handleCreateForm = () => {
    if (newForm.title.trim()) {
      const form: Form = {
        id: Date.now().toString(),
        title: newForm.title,
        description: newForm.description,
        fields: newForm.fields,
        isPublished: false,
        createdAt: new Date().toISOString().split('T')[0],
        responses: 0
      };
      setForms(prev => [...prev, form]);
      setNewForm({ title: '', description: '', fields: [] });
      setShowCreateForm(false);
      toast.success('Form created successfully');
    }
  };

  const handleTogglePublish = (id: string) => {
    setForms(prev => 
      prev.map(form => 
        form.id === id 
          ? { ...form, isPublished: !form.isPublished }
          : form
      )
    );
    toast.success('Form publication status updated');
  };

  const handleDeleteForm = (id: string) => {
    setForms(prev => prev.filter(form => form.id !== id));
    toast.success('Form deleted');
  };

  const handleAddField = (type: string) => {
    const field: FormField = {
      id: Date.now().toString(),
      type: type as any,
      label: `New ${type} field`,
      placeholder: `Enter ${type}`,
      required: false,
      options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined
    };
    setNewForm(prev => ({ ...prev, fields: [...prev.fields, field] }));
    setEditingField(field);
    setShowFieldEditor(true);
  };

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    setNewForm(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
    setShowFieldEditor(false);
    setEditingField(null);
  };

  const handleRemoveField = (fieldId: string) => {
    setNewForm(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
  };

  const handleCopyForm = (id: string) => {
    const form = forms.find(f => f.id === id);
    if (form) {
      const copiedForm: Form = {
        ...form,
        id: Date.now().toString(),
        title: `${form.title} (Copy)`,
        isPublished: false,
        createdAt: new Date().toISOString().split('T')[0],
        responses: 0
      };
      setForms(prev => [...prev, copiedForm]);
      toast.success('Form copied successfully');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Form Builder</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage forms to collect information
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Form
        </Button>
      </div>

      {/* Forms List */}
      <div className="grid gap-4 md:grid-cols-2">
        {forms.map((form) => (
          <Card key={form.id} className={`${form.isPublished ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">{form.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {form.description}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={form.isPublished ? 'default' : 'secondary'}>
                    {form.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                  <Switch
                    checked={form.isPublished}
                    onCheckedChange={() => handleTogglePublish(form.id)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{form.fields.length} fields</span>
                  <span>{form.responses} responses</span>
                  <span>Created {form.createdAt}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm">
                    <Send className="h-3 w-3 mr-1" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleCopyForm(form.id)}>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteForm(form.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Create New Form</CardTitle>
            <CardDescription>
              Build a custom form with various field types
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="form-title">Form Title</Label>
                <Input
                  id="form-title"
                  placeholder="Enter form title"
                  value={newForm.title}
                  onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-description">Description</Label>
                <Input
                  id="form-description"
                  placeholder="Enter form description"
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                />
              </div>
            </div>

            {/* Field Types */}
            <div className="space-y-2">
              <Label>Add Fields</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {fieldTypes.map((fieldType) => (
                  <Button
                    key={fieldType.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddField(fieldType.value)}
                    className="flex items-center space-x-2"
                  >
                    {fieldType.icon}
                    <span className="text-xs">{fieldType.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            {newForm.fields.length > 0 && (
              <div className="space-y-2">
                <Label>Form Fields</Label>
                <div className="space-y-2">
                  {newForm.fields.map((field) => (
                    <div key={field.id} className="flex items-center space-x-2 p-2 border rounded">
                      <div className="flex-1">
                        <span className="text-sm font-medium">{field.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">({field.type})</span>
                        {field.required && (
                          <Badge variant="outline" className="ml-2 text-xs">Required</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingField(field);
                          setShowFieldEditor(true);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveField(field.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Button onClick={handleCreateForm} disabled={!newForm.title.trim()}>
                Create Form
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Field Editor */}
      {showFieldEditor && editingField && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Edit Field</CardTitle>
            <CardDescription>
              Configure the field properties
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="field-label">Field Label</Label>
                <Input
                  id="field-label"
                  value={editingField.label}
                  onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="field-placeholder">Placeholder</Label>
                <Input
                  id="field-placeholder"
                  value={editingField.placeholder || ''}
                  onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                />
              </div>
            </div>
            
            {(editingField.type === 'select' || editingField.type === 'radio') && (
              <div className="space-y-2">
                <Label htmlFor="field-options">Options (one per line)</Label>
                <Textarea
                  id="field-options"
                  value={editingField.options?.join('\n') || ''}
                  onChange={(e) => setEditingField({ 
                    ...editingField, 
                    options: e.target.value.split('\n').filter(opt => opt.trim()) 
                  })}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                checked={editingField.required}
                onCheckedChange={(checked) => setEditingField({ ...editingField, required: checked })}
              />
              <Label>Required field</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Button onClick={() => handleUpdateField(editingField.id, editingField)}>
                Save Field
              </Button>
              <Button variant="outline" onClick={() => setShowFieldEditor(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NoteForms; 