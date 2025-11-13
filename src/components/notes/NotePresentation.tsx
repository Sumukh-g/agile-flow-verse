import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Edit,
    Maximize,
    Minimize,
    Play,
    Plus,
    Settings,
    Share,
    SkipBack,
    SkipForward,
    Trash2,
    Volume2,
    VolumeX
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface Slide {
  id: string;
  title: string;
  content: string;
  type: 'title' | 'content' | 'image' | 'chart' | 'quote';
  order: number;
  notes?: string;
}

interface Presentation {
  id: string;
  title: string;
  description: string;
  slides: Slide[];
  theme: 'default' | 'dark' | 'light' | 'colorful';
  isPresenting: boolean;
  currentSlide: number;
}

const NotePresentation: React.FC<{ note: any; onUpdateNote: (noteId: string, updates: any) => void }> = ({ note, onUpdateNote }) => {
  const [presentation, setPresentation] = useState<Presentation>({
    id: '1',
    title: 'My Presentation',
    description: 'A presentation created from notes',
    slides: [
      {
        id: '1',
        title: 'Welcome',
        content: 'Welcome to our presentation',
        type: 'title',
        order: 1,
        notes: 'Start with a warm welcome'
      },
      {
        id: '2',
        title: 'Agenda',
        content: '• Introduction\n• Key Points\n• Discussion\n• Conclusion',
        type: 'content',
        order: 2,
        notes: 'Outline the main topics'
      },
      {
        id: '3',
        title: 'Key Insights',
        content: 'Our research shows significant improvements in user engagement and satisfaction.',
        type: 'content',
        order: 3,
        notes: 'Highlight the main findings'
      }
    ],
    theme: 'default',
    isPresenting: false,
    currentSlide: 0
  });

  const [showCreateSlide, setShowCreateSlide] = useState(false);
  const [newSlide, setNewSlide] = useState({
    title: '',
    content: '',
    type: 'content' as Slide['type'],
    notes: ''
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const handleStartPresentation = () => {
    setPresentation(prev => ({ ...prev, isPresenting: true, currentSlide: 0 }));
    toast.success('Presentation started');
  };

  const handleStopPresentation = () => {
    setPresentation(prev => ({ ...prev, isPresenting: false }));
    toast.success('Presentation stopped');
  };

  const handleNextSlide = () => {
    if (presentation.currentSlide < presentation.slides.length - 1) {
      setPresentation(prev => ({ ...prev, currentSlide: prev.currentSlide + 1 }));
    }
  };

  const handlePreviousSlide = () => {
    if (presentation.currentSlide > 0) {
      setPresentation(prev => ({ ...prev, currentSlide: prev.currentSlide - 1 }));
    }
  };

  const handleCreateSlide = () => {
    if (newSlide.title.trim()) {
      const slide: Slide = {
        id: Date.now().toString(),
        title: newSlide.title,
        content: newSlide.content,
        type: newSlide.type,
        order: presentation.slides.length + 1,
        notes: newSlide.notes
      };
      setPresentation(prev => ({
        ...prev,
        slides: [...prev.slides, slide]
      }));
      setNewSlide({ title: '', content: '', type: 'content', notes: '' });
      setShowCreateSlide(false);
      toast.success('Slide created successfully');
    }
  };

  const handleDeleteSlide = (slideId: string) => {
    setPresentation(prev => ({
      ...prev,
      slides: prev.slides.filter(slide => slide.id !== slideId)
    }));
    toast.success('Slide deleted');
  };

  const handleThemeChange = (theme: string) => {
    setPresentation(prev => ({ ...prev, theme: theme as any }));
    toast.success('Theme updated');
  };

  const getSlideTypeIcon = (type: string) => {
    switch (type) {
      case 'title': return '📝';
      case 'content': return '📄';
      case 'image': return '🖼️';
      case 'chart': return '📊';
      case 'quote': return '💬';
      default: return '📄';
    }
  };

  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'dark': return 'bg-gray-900 text-white';
      case 'light': return 'bg-white text-gray-900';
      case 'colorful': return 'bg-gradient-to-br from-blue-500 to-purple-600 text-white';
      default: return 'bg-gray-50 text-gray-900';
    }
  };

  if (presentation.isPresenting) {
    const currentSlide = presentation.slides[presentation.currentSlide];
    return (
      <div className={`fixed inset-0 z-50 ${getThemeClasses(presentation.theme)} ${isFullscreen ? 'p-0' : 'p-4'}`}>
        <div className="flex flex-col h-full">
          {/* Presentation Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold">{presentation.title}</h2>
              <Badge variant="secondary">
                Slide {presentation.currentSlide + 1} of {presentation.slides.length}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleStopPresentation}>
                Exit
              </Button>
            </div>
          </div>

          {/* Slide Content */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-4xl w-full text-center">
              <h1 className="text-4xl font-bold mb-6">{currentSlide?.title}</h1>
              <div className="text-xl leading-relaxed whitespace-pre-line">
                {currentSlide?.content}
              </div>
            </div>
          </div>

          {/* Presentation Controls */}
          <div className="flex items-center justify-between p-4 border-t">
            <Button variant="outline" onClick={handlePreviousSlide} disabled={presentation.currentSlide === 0}>
              <SkipBack className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={handleNextSlide} disabled={presentation.currentSlide === presentation.slides.length - 1}>
              Next
              <SkipForward className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Presentation Mode</h3>
          <p className="text-sm text-muted-foreground">
            Create and present slides from your notes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={presentation.theme} onValueChange={handleThemeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="colorful">Colorful</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleStartPresentation} disabled={presentation.slides.length === 0}>
            <Play className="h-4 w-4 mr-2" />
            Start Presentation
          </Button>
        </div>
      </div>

      {/* Slides Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {presentation.slides.map((slide, index) => (
          <Card key={slide.id} className={`${index === presentation.currentSlide ? 'border-blue-500 bg-blue-50' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getSlideTypeIcon(slide.type)}</span>
                  <CardTitle className="text-sm">{slide.title}</CardTitle>
                </div>
                <div className="flex items-center space-x-1">
                  <Badge variant="outline" className="text-xs">
                    {slide.type}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteSlide(slide.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground mb-2">
                {slide.content.substring(0, 100)}...
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Slide {index + 1}
                </span>
                <Button variant="outline" size="sm">
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Slide */}
      {showCreateSlide && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Create New Slide</CardTitle>
            <CardDescription>
              Add a new slide to your presentation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="slide-title">Slide Title</Label>
                <Input
                  id="slide-title"
                  placeholder="Enter slide title"
                  value={newSlide.title}
                  onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slide-type">Slide Type</Label>
                <Select value={newSlide.type} onValueChange={(value: any) => setNewSlide({ ...newSlide, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Title Slide</SelectItem>
                    <SelectItem value="content">Content Slide</SelectItem>
                    <SelectItem value="image">Image Slide</SelectItem>
                    <SelectItem value="chart">Chart Slide</SelectItem>
                    <SelectItem value="quote">Quote Slide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slide-content">Content</Label>
              <Textarea
                id="slide-content"
                placeholder="Enter slide content"
                value={newSlide.content}
                onChange={(e) => setNewSlide({ ...newSlide, content: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slide-notes">Speaker Notes</Label>
              <Textarea
                id="slide-notes"
                placeholder="Enter speaker notes"
                value={newSlide.notes}
                onChange={(e) => setNewSlide({ ...newSlide, notes: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={handleCreateSlide} disabled={!newSlide.title.trim()}>
                Create Slide
              </Button>
              <Button variant="outline" onClick={() => setShowCreateSlide(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Slide Button */}
      {!showCreateSlide && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setShowCreateSlide(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Slide
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotePresentation;