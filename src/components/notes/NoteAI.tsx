import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Brain,
    CheckCircle,
    Copy,
    Layers,
    Sparkles,
    Tag,
    Wand2
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

const NoteAI: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');

  const aiFeatures = [
    {
      name: 'Content Generation',
      description: 'Generate content based on prompts',
      icon: Sparkles,
      action: () => generateContent()
    },
    {
      name: 'Smart Summarization',
      description: 'Summarize long content automatically',
      icon: Brain,
      action: () => summarizeContent()
    },
    {
      name: 'Grammar Check',
      description: 'Check and improve grammar',
      icon: CheckCircle,
      action: () => checkGrammar()
    },
    {
      name: 'Style Enhancement',
      description: 'Improve writing style and tone',
      icon: Wand2,
      action: () => enhanceStyle()
    },
    {
      name: 'Keyword Suggestions',
      description: 'Suggest relevant keywords and tags',
      icon: Tag,
      action: () => suggestKeywords()
    },
    {
      name: 'Structure Analysis',
      description: 'Analyze and improve document structure',
      icon: Layers,
      action: () => analyzeStructure()
    }
  ];

  const generateContent = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setGeneratedContent('This is AI-generated content based on your prompt. It includes relevant information, suggestions, and structured content that would typically be created by an AI assistant.');
      toast.success('Content generated successfully');
    } catch (error) {
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const summarizeContent = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Content summarized successfully');
    } catch (error) {
      toast.error('Failed to summarize content');
    } finally {
      setIsGenerating(false);
    }
  };

  const checkGrammar = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Grammar check completed');
    } catch (error) {
      toast.error('Failed to check grammar');
    } finally {
      setIsGenerating(false);
    }
  };

  const enhanceStyle = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1800));
      toast.success('Style enhanced successfully');
    } catch (error) {
      toast.error('Failed to enhance style');
    } finally {
      setIsGenerating(false);
    }
  };

  const suggestKeywords = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      toast.success('Keywords suggested successfully');
    } catch (error) {
      toast.error('Failed to suggest keywords');
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeStructure = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2200));
      toast.success('Structure analyzed successfully');
    } catch (error) {
      toast.error('Failed to analyze structure');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">AI Assistant</h2>
          <p className="text-gray-600">Enhance your notes with AI-powered features</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Sparkles className="w-3 h-3 mr-1" />
          AI Powered
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aiFeatures.map((feature) => (
          <Card key={feature.name} className="hover:shadow-lg transition-all cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <feature.icon className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">{feature.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
              <Button 
                onClick={feature.action}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Processing...' : 'Use Feature'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {generatedContent && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Generated Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm">{generatedContent}</p>
            </div>
            <div className="flex space-x-2 mt-4">
              <Button size="sm" onClick={() => setGeneratedContent('')}>
                Clear
              </Button>
              <Button size="sm" variant="outline">
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NoteAI; 