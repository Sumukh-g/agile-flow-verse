import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Copy,
    Download,
    MoreHorizontal,
    Plus,
    Share2,
    Sparkles,
    Trash2
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  tags: string[];
  usageCount: number;
  createdAt: Date;
  isPublic: boolean;
  author: string;
  aiGenerated: boolean;
}

const NoteTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Meeting Notes',
      description: 'Template for capturing meeting discussions and action items',
      category: 'Work',
      content: '# Meeting Notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n1. \n2. \n3. \n\n## Discussion\n\n## Action Items\n- [ ] \n- [ ] \n- [ ] \n\n## Next Steps\n\n',
      tags: ['Meetings', 'Work'],
      usageCount: 45,
      createdAt: new Date('2023-01-15'),
      isPublic: true,
      author: 'System',
      aiGenerated: false
    },
    {
      id: '2',
      name: 'Project Brief',
      description: 'Template for new project specifications and planning',
      category: 'Work',
      content: '# Project Brief\n\n**Project Name:** \n**Start Date:** \n**End Date:** \n\n## Objectives\n\n## Scope\n\n## Deliverables\n\n## Stakeholders\n\n## Budget\n\n## Timeline\n\n',
      tags: ['Project', 'Planning'],
      usageCount: 32,
      createdAt: new Date('2023-02-20'),
      isPublic: true,
      author: 'System',
      aiGenerated: false
    },
    {
      id: '3',
      name: 'Weekly Report',
      description: 'Template for weekly status updates and progress tracking',
      category: 'Work',
      content: '# Weekly Report\n\n**Week of:** \n\n## Accomplishments\n\n## In Progress\n\n## Blockers\n\n## Next Week Plans\n\n',
      tags: ['Reports', 'Weekly'],
      usageCount: 28,
      createdAt: new Date('2023-03-10'),
      isPublic: true,
      author: 'System',
      aiGenerated: false
    },
    {
      id: '4',
      name: 'Brainstorming Session',
      description: 'AI-generated template for creative brainstorming sessions',
      category: 'Ideas',
      content: '# Brainstorming Session\n\n**Topic:** \n**Date:** \n**Participants:** \n\n## Problem Statement\n\n## Ideas\n\n### Category 1\n- \n- \n- \n\n### Category 2\n- \n- \n- \n\n## Top Ideas\n1. \n2. \n3. \n\n## Next Steps\n\n',
      tags: ['Ideas', 'Creative'],
      usageCount: 15,
      createdAt: new Date('2023-04-05'),
      isPublic: true,
      author: 'AI Assistant',
      aiGenerated: true
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: Template) => {
    // This would typically create a new note from the template
    toast.success(`Template "${template.name}" applied successfully`);
  };

  const handleDuplicateTemplate = (template: Template) => {
    const newTemplate: Template = {
      ...template,
      id: `template_${Date.now()}`,
      name: `${template.name} (Copy)`,
      usageCount: 0,
      createdAt: new Date(),
      author: 'Current User'
    };
    setTemplates(prev => [newTemplate, ...prev]);
    toast.success('Template duplicated successfully');
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    toast.success('Template deleted successfully');
  };

  const generateAITemplate = async (prompt: string) => {
    setIsGenerating(true);
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newTemplate: Template = {
        id: `template_${Date.now()}`,
        name: `AI Generated Template`,
        description: `AI-generated template based on: "${prompt}"`,
        category: 'AI Generated',
        content: `# AI Generated Template\n\n**Generated from:** ${prompt}\n\n## Content\n\nThis is a simulated AI-generated template that would typically include relevant structure and content based on the user's prompt.\n\n## Sections\n\n### Section 1\n- \n- \n- \n\n### Section 2\n- \n- \n- \n\n## Summary\n\n`,
        tags: ['AI Generated', 'Custom'],
        usageCount: 0,
        createdAt: new Date(),
        isPublic: false,
        author: 'AI Assistant',
        aiGenerated: true
      };
      
      setTemplates(prev => [newTemplate, ...prev]);
      setAiPrompt('');
      setShowAI(false);
      toast.success('AI template generated successfully');
    } catch (error) {
      toast.error('Failed to generate AI template');
    } finally {
      setIsGenerating(false);
    }
  };

  const categories = ['all', 'Work', 'Personal', 'Ideas', 'AI Generated'];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Templates</h2>
          <p className="text-gray-600">Use pre-built templates or create your own</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowAI(true)}>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate with AI
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 w-64"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-2 border rounded-md"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category}
            </option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                </div>
                {template.aiGenerated && (
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {template.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Used {template.usageCount} times</span>
                  <span>{template.author}</span>
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1"
                  >
                    Use Template
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Generation Dialog */}
      {showAI && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Generate Template with AI</h3>
            <textarea
              placeholder="Describe the template you want to generate..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full p-3 border rounded-md mb-4"
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowAI(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => generateAITemplate(aiPrompt)}
                disabled={!aiPrompt.trim() || isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteTemplates; 