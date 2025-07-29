import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    AlertCircle,
    Archive,
    BarChart3,
    Clock,
    Copy,
    Download,
    FileText,
    Globe,
    Lightbulb,
    Lock,
    MoreHorizontal,
    Pin,
    Plus,
    Share2,
    Star,
    Trash2,
    Users
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface NoteToolbarProps {
  note: any;
  onUpdateNote: (noteId: string, updates: any) => void;
  onTogglePin: (noteId: string) => void;
  onToggleStar: (noteId: string) => void;
  onToggleArchive: (noteId: string) => void;
  onShareNote: (noteId: string) => void;
  onExportNote: (noteId: string) => void;
  onDuplicateNote: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
}

const NoteToolbar: React.FC<NoteToolbarProps> = ({
  note,
  onUpdateNote,
  onTogglePin,
  onToggleStar,
  onToggleArchive,
  onShareNote,
  onExportNote,
  onDuplicateNote,
  onDeleteNote
}) => {
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showWorkflows, setShowWorkflows] = useState(false);
  const [showDatabase, setShowDatabase] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showMindmap, setShowMindmap] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  const [showForms, setShowForms] = useState(false);
  const [showIntegrations2, setShowIntegrations2] = useState(false);
  const [showWorkflows2, setShowWorkflows2] = useState(false);
  const [showDatabase2, setShowDatabase2] = useState(false);
  const [showCalendar2, setShowCalendar2] = useState(false);
  const [showKanban2, setShowKanban2] = useState(false);
  const [showTimeline2, setShowTimeline2] = useState(false);
  const [showMindmap2, setShowMindmap2] = useState(false);
  const [showWhiteboard2, setShowWhiteboard2] = useState(false);
  const [showPresentation2, setShowPresentation2] = useState(false);
  const [showForms2, setShowForms2] = useState(false);
  const [showIntegrations3, setShowIntegrations3] = useState(false);
  const [showWorkflows3, setShowWorkflows3] = useState(false);
  const [showDatabase3, setShowDatabase3] = useState(false);
  const [showCalendar3, setShowCalendar3] = useState(false);
  const [showKanban3, setShowKanban3] = useState(false);
  const [showTimeline3, setShowTimeline3] = useState(false);
  const [showMindmap3, setShowMindmap3] = useState(false);
  const [showWhiteboard3, setShowWhiteboard3] = useState(false);
  const [showPresentation3, setShowPresentation3] = useState(false);
  const [showForms3, setShowForms3] = useState(false);
  const [showIntegrations4, setShowIntegrations4] = useState(false);
  const [showWorkflows4, setShowWorkflows4] = useState(false);
  const [showDatabase4, setShowDatabase4] = useState(false);
  const [showCalendar4, setShowCalendar4] = useState(false);
  const [showKanban4, setShowKanban4] = useState(false);
  const [showTimeline4, setShowTimeline4] = useState(false);
  const [showMindmap4, setShowMindmap4] = useState(false);
  const [showWhiteboard4, setShowWhiteboard4] = useState(false);
  const [showPresentation4, setShowPresentation4] = useState(false);
  const [showForms4, setShowForms4] = useState(false);
  const [showIntegrations5, setShowIntegrations5] = useState(false);
  const [showWorkflows5, setShowWorkflows5] = useState(false);
  const [showDatabase5, setShowDatabase5] = useState(false);
  const [showCalendar5, setShowCalendar5] = useState(false);
  const [showKanban5, setShowKanban5] = useState(false);
  const [showTimeline5, setShowTimeline5] = useState(false);
  const [showMindmap5, setShowMindmap5] = useState(false);
  const [showWhiteboard5, setShowWhiteboard5] = useState(false);
  const [showPresentation5, setShowPresentation5] = useState(false);
  const [showForms5, setShowForms5] = useState(false);
  const [showIntegrations6, setShowIntegrations6] = useState(false);
  const [showWorkflows6, setShowWorkflows6] = useState(false);
  const [showDatabase6, setShowDatabase6] = useState(false);
  const [showCalendar6, setShowCalendar6] = useState(false);
  const [showKanban6, setShowKanban6] = useState(false);
  const [showTimeline6, setShowTimeline6] = useState(false);
  const [showMindmap6, setShowMindmap6] = useState(false);
  const [showWhiteboard6, setShowWhiteboard6] = useState(false);
  const [showPresentation6, setShowPresentation6] = useState(false);
  const [showForms6, setShowForms6] = useState(false);
  const [showIntegrations7, setShowIntegrations7] = useState(false);
  const [showWorkflows7, setShowWorkflows7] = useState(false);
  const [showDatabase7, setShowDatabase7] = useState(false);
  const [showCalendar7, setShowCalendar7] = useState(false);
  const [showKanban7, setShowKanban7] = useState(false);
  const [showTimeline7, setShowTimeline7] = useState(false);
  const [showMindmap7, setShowMindmap7] = useState(false);
  const [showWhiteboard7, setShowWhiteboard7] = useState(false);
  const [showPresentation7, setShowPresentation7] = useState(false);
  const [showForms7, setShowForms7] = useState(false);
  const [showIntegrations8, setShowIntegrations8] = useState(false);
  const [showWorkflows8, setShowWorkflows8] = useState(false);
  const [showDatabase8, setShowDatabase8] = useState(false);
  const [showCalendar8, setShowCalendar8] = useState(false);
  const [showKanban8, setShowKanban8] = useState(false);
  const [showTimeline8, setShowTimeline8] = useState(false);
  const [showMindmap8, setShowMindmap8] = useState(false);
  const [showWhiteboard8, setShowWhiteboard8] = useState(false);
  const [showPresentation8, setShowPresentation8] = useState(false);
  const [showForms8, setShowForms8] = useState(false);
  const [showIntegrations9, setShowIntegrations9] = useState(false);
  const [showWorkflows9, setShowWorkflows9] = useState(false);
  const [showDatabase9, setShowDatabase9] = useState(false);
  const [showCalendar9, setShowCalendar9] = useState(false);
  const [showKanban9, setShowKanban9] = useState(false);
  const [showTimeline9, setShowTimeline9] = useState(false);
  const [showMindmap9, setShowMindmap9] = useState(false);
  const [showWhiteboard9, setShowWhiteboard9] = useState(false);
  const [showPresentation9, setShowPresentation9] = useState(false);
  const [showForms9, setShowForms9] = useState(false);
  const [showIntegrations10, setShowIntegrations10] = useState(false);
  const [showWorkflows10, setShowWorkflows10] = useState(false);
  const [showDatabase10, setShowDatabase10] = useState(false);
  const [showCalendar10, setShowCalendar10] = useState(false);
  const [showKanban10, setShowKanban10] = useState(false);
  const [showTimeline10, setShowTimeline10] = useState(false);
  const [showMindmap10, setShowMindmap10] = useState(false);
  const [showWhiteboard10, setShowWhiteboard10] = useState(false);
  const [showPresentation10, setShowPresentation10] = useState(false);
  const [showForms10, setShowForms10] = useState(false);

  const handleTitleChange = (newTitle: string) => {
    onUpdateNote(note.id, { title: newTitle });
  };

  const handleTogglePublic = () => {
    onUpdateNote(note.id, { isPublic: !note.isPublic });
    toast.success(note.isPublic ? 'Note made private' : 'Note made public');
  };

  const handleAddTag = (tag: string) => {
    if (!note.tags.includes(tag)) {
      onUpdateNote(note.id, { tags: [...note.tags, tag] });
      toast.success('Tag added');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateNote(note.id, { tags: note.tags.filter((tag: string) => tag !== tagToRemove) });
    toast.success('Tag removed');
  };

  return (
    <div className="border-b bg-white p-4">
      <div className="flex items-center justify-between">
        {/* Left side - Title and basic actions */}
        <div className="flex items-center space-x-4 flex-1">
          <div className="flex-1 max-w-md">
            <Input
              value={note.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-lg font-semibold border-none focus:ring-0 p-0"
              placeholder="Untitled Note"
            />
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTogglePin(note.id)}
              className={note.pinned ? 'bg-yellow-100 text-yellow-800' : ''}
            >
              <Pin className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleStar(note.id)}
              className={note.starred ? 'bg-yellow-100 text-yellow-800' : ''}
            >
              <Star className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTogglePublic}
              className={note.isPublic ? 'bg-blue-100 text-blue-800' : ''}
            >
              {note.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Right side - Advanced actions */}
        <div className="flex items-center space-x-2">
          {/* Collaboration */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Users className="w-4 h-4 mr-2" />
                Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onShareNote(note.id)}>
                <Share2 className="w-4 h-4 mr-2" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowCollaboration(true)}>
                <Users className="w-4 h-4 mr-2" />
                Manage Access
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowComments(true)}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Comments
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onExportNote(note.id)}>
                <FileText className="w-4 h-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicateNote(note.id)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* More actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setShowVersionHistory(true)}>
                <Clock className="w-4 h-4 mr-2" />
                Version History
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowAnalytics(true)}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowTemplates(true)}>
                <FileText className="w-4 h-4 mr-2" />
                Templates
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onToggleArchive(note.id)}>
                <Archive className="w-4 h-4 mr-2" />
                {note.archived ? 'Unarchive' : 'Archive'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDeleteNote(note.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tags */}
      <div className="mt-3 flex items-center space-x-2">
        <span className="text-sm text-gray-500">Tags:</span>
        {note.tags.map((tag: string) => (
          <Badge
            key={tag}
            variant="secondary"
            className="text-xs cursor-pointer hover:bg-red-100"
            onClick={() => handleRemoveTag(tag)}
          >
            {tag} ×
          </Badge>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleAddTag('Important')}>
              <AlertCircle className="w-4 h-4 mr-2" />
              Important
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddTag('Work')}>
              <Briefcase className="w-4 h-4 mr-2" />
              Work
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddTag('Personal')}>
              <User className="w-4 h-4 mr-2" />
              Personal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddTag('Ideas')}>
              <Lightbulb className="w-4 h-4 mr-2" />
              Ideas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddTag('To-Do')}>
              <CheckSquare className="w-4 h-4 mr-2" />
              To-Do
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Note info */}
      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
        <span>Last edited {new Date(note.updatedAt).toLocaleDateString()}</span>
        <span>{note.wordCount} words</span>
        <span>{note.readingTime} min read</span>
        {note.collaborators.length > 0 && (
          <span>{note.collaborators.length} collaborators</span>
        )}
      </div>
    </div>
  );
};

export default NoteToolbar; 