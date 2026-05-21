/**
 * Task Custom Fields Component
 * 
 * Manages custom field values for a task.
 * 
 * Features:
 * - Text, number, date, and select field types
 * - Inline editing
 * - Auto-save on change
 * - Field validation
 * 
 * Custom fields are stored as JSON in the task's customFields column.
 * 
 * @param taskId - ID of the task
 * @param customFields - Current custom field values
 * @param fieldDefinitions - Available field definitions for the project
 * @param onFieldChange - Callback when fields are updated
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { 
  Settings2, 
  Type, 
  Hash, 
  Calendar as CalendarIcon, 
  List,
  Plus,
  X,
  Check,
  Pencil
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Field type definitions
interface FieldDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[]; // For select type
  required?: boolean;
  placeholder?: string;
}

interface TaskCustomFieldsProps {
  taskId: string;
  customFields: Record<string, any>;
  fieldDefinitions?: FieldDefinition[];
  onFieldChange: (fieldId: string, value: any) => void;
  readOnly?: boolean;
}

// Default field definitions if none provided
const defaultFieldDefinitions: FieldDefinition[] = [
  { id: 'sprint', name: 'Sprint', type: 'text', placeholder: 'e.g., Sprint 12' },
  { id: 'storyPoints', name: 'Story Points', type: 'number', placeholder: '0' },
  { id: 'startDate', name: 'Start Date', type: 'date' },
  { id: 'category', name: 'Category', type: 'select', options: ['Feature', 'Bug', 'Improvement', 'Task', 'Research'] },
  { id: 'component', name: 'Component', type: 'text', placeholder: 'e.g., Backend, Frontend' },
  { id: 'epicLink', name: 'Epic Link', type: 'text', placeholder: 'Epic ID or name' },
];

export function TaskCustomFields({
  taskId,
  customFields = {},
  fieldDefinitions = defaultFieldDefinitions,
  onFieldChange,
  readOnly = false,
}: TaskCustomFieldsProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<any>(null);

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'number': return <Hash className="h-4 w-4" />;
      case 'date': return <CalendarIcon className="h-4 w-4" />;
      case 'select': return <List className="h-4 w-4" />;
      default: return <Settings2 className="h-4 w-4" />;
    }
  };

  const startEditing = (fieldId: string, currentValue: any) => {
    setEditingField(fieldId);
    setTempValue(currentValue);
  };

  const saveField = (fieldId: string) => {
    onFieldChange(fieldId, tempValue);
    setEditingField(null);
    setTempValue(null);
  };

  const cancelEditing = () => {
    setEditingField(null);
    setTempValue(null);
  };

  const clearField = (fieldId: string) => {
    onFieldChange(fieldId, null);
  };

  const renderFieldValue = (field: FieldDefinition) => {
    const value = customFields[field.id];
    const isEditing = editingField === field.id;

    if (readOnly) {
      return renderDisplayValue(field, value);
    }

    if (isEditing) {
      return renderEditingField(field);
    }

    return (
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded p-1 -m-1 group"
        onClick={() => startEditing(field.id, value)}
      >
        {renderDisplayValue(field, value)}
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
      </div>
    );
  };

  const renderDisplayValue = (field: FieldDefinition, value: any) => {
    if (value === null || value === undefined || value === '') {
      return (
        <span className="text-muted-foreground text-sm italic">
          {field.placeholder || 'Not set'}
        </span>
      );
    }

    switch (field.type) {
      case 'date':
        try {
          return <span className="text-sm">{format(new Date(value), 'MMM d, yyyy')}</span>;
        } catch {
          return <span className="text-sm">{value}</span>;
        }
      case 'select':
        return <Badge variant="secondary">{value}</Badge>;
      case 'number':
        return <span className="text-sm font-mono">{value}</span>;
      default:
        return <span className="text-sm">{value}</span>;
    }
  };

  const renderEditingField = (field: FieldDefinition) => {
    switch (field.type) {
      case 'text':
        return (
          <div className="flex items-center gap-2">
            <Input
              value={tempValue || ''}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={field.placeholder}
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveField(field.id);
                if (e.key === 'Escape') cancelEditing();
              }}
            />
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveField(field.id)}>
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}>
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        );

      case 'number':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={tempValue || ''}
              onChange={(e) => setTempValue(e.target.value ? Number(e.target.value) : null)}
              placeholder={field.placeholder}
              className="h-8 text-sm w-24"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveField(field.id);
                if (e.key === 'Escape') cancelEditing();
              }}
            />
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveField(field.id)}>
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}>
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        );

      case 'date':
        return (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-8 text-sm justify-start text-left font-normal",
                    !tempValue && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {tempValue ? format(new Date(tempValue), 'MMM d, yyyy') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={tempValue ? new Date(tempValue) : undefined}
                  onSelect={(date) => {
                    setTempValue(date?.toISOString());
                    setTimeout(() => saveField(field.id), 100);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}>
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        );

      case 'select':
        return (
          <div className="flex items-center gap-2">
            <Select
              value={tempValue || ''}
              onValueChange={(value) => {
                setTempValue(value);
                onFieldChange(field.id, value);
                setEditingField(null);
              }}
            >
              <SelectTrigger className="h-8 text-sm w-[180px]">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}>
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  // Group fields by whether they have values
  const fieldsWithValues = fieldDefinitions.filter(f => customFields[f.id] !== null && customFields[f.id] !== undefined);
  const emptyFields = fieldDefinitions.filter(f => customFields[f.id] === null || customFields[f.id] === undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Custom Fields
        </CardTitle>
        <CardDescription>
          Additional task information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Fields with values */}
        {fieldsWithValues.map((field) => (
          <div key={field.id} className="flex items-center justify-between py-2 border-b last:border-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[120px]">
              {getFieldIcon(field.type)}
              <span>{field.name}</span>
              {field.required && <span className="text-red-500">*</span>}
            </div>
            <div className="flex items-center gap-2">
              {renderFieldValue(field)}
              {!readOnly && customFields[field.id] && editingField !== field.id && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-50 hover:opacity-100"
                  onClick={() => clearField(field.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* Empty fields (collapsed by default) */}
        {emptyFields.length > 0 && (
          <div className="pt-2">
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                <Plus className="h-4 w-4" />
                <span>{emptyFields.length} more fields</span>
              </summary>
              <div className="mt-2 space-y-3 pl-2 border-l-2">
                {emptyFields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[120px]">
                      {getFieldIcon(field.type)}
                      <span>{field.name}</span>
                      {field.required && <span className="text-red-500">*</span>}
                    </div>
                    {renderFieldValue(field)}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* Empty state */}
        {fieldDefinitions.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Settings2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No custom fields configured</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

