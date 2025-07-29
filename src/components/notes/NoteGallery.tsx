import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import {
    Activity,
    Archive,
    Brain,
    Calendar,
    Copy,
    Database,
    Download,
    FileText,
    FormInput,
    Globe,
    Lock,
    MoreHorizontal,
    Palette,
    Pin,
    Presentation,
    Share2,
    Star,
    Trash2,
    Trello,
    Users,
    Workflow
} from 'lucide-react';
import React from 'react';

interface NoteGalleryProps {
  notes: any[];
  onNoteSelect: (note: any) => void;
  onTogglePin: (noteId: string) => void;
  onToggleStar: (noteId: string) => void;
  onToggleArchive: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onShareNote: (noteId: string) => void;
  onExportNote: (noteId: string) => void;
  onDuplicateNote: (noteId: string) => void;
}

const NoteGallery: React.FC<NoteGalleryProps> = ({
  notes,
  onNoteSelect,
  onTogglePin,
  onToggleStar,
  onToggleArchive,
  onDeleteNote,
  onShareNote,
  onExportNote,
  onDuplicateNote
}) => {
  const getNoteIcon = (note: any) => {
    switch (note.type) {
      case 'database':
        return <Database className="w-6 h-6" />;
      case 'calendar':
        return <Calendar className="w-6 h-6" />;
      case 'kanban':
        return <Trello className="w-6 h-6" />;
      case 'timeline':
        return <Activity className="w-6 h-6" />;
      case 'mindmap':
        return <Brain className="w-6 h-6" />;
      case 'whiteboard':
        return <Palette className="w-6 h-6" />;
      case 'presentation':
        return <Presentation className="w-6 h-6" />;
      case 'form':
        return <FormInput className="w-6 h-6" />;
      case 'workflow':
        return <Workflow className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  const getNoteColor = (note: any) => {
    switch (note.category) {
      case 'Work':
        return 'bg-blue-50 border-blue-200';
      case 'Personal':
        return 'bg-green-50 border-green-200';
      case 'Ideas':
        return 'bg-yellow-50 border-yellow-200';
      case 'Important':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {notes.map((note) => (
        <Card
          key={note.id}
          className={`cursor-pointer transition-all hover:shadow-lg ${getNoteColor(note)}`}
          onClick={() => onNoteSelect(note)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <div className="text-gray-600">
                  {getNoteIcon(note)}
                </div>
                <div className="flex items-center space-x-1">
                  {note.pinned && <Pin className="w-3 h-3 text-yellow-500" />}
                  {note.starred && <Star className="w-3 h-3 text-yellow-500" />}
                  {note.isPublic ? (
                    <Globe className="w-3 h-3 text-blue-500" />
                  ) : (
                    <Lock className="w-3 h-3 text-gray-500" />
                  )}
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onTogglePin(note.id)}>
                    <Pin className="w-4 h-4 mr-2" />
                    {note.pinned ? 'Unpin' : 'Pin'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleStar(note.id)}>
                    <Star className="w-4 h-4 mr-2" />
                    {note.starred ? 'Unstar' : 'Star'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onShareNote(note.id)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExportNote(note.id)}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicateNote(note.id)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
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
            
            <h3 className="font-semibold text-sm truncate">{note.title}</h3>
          </CardHeader>
          
          <CardContent className="pt-0">
            <p className="text-xs text-gray-600 mb-3 line-clamp-3">
              {note.content.substring(0, 150)}...
            </p>
            
            <div className="space-y-2">
              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {note.tags.slice(0, 3).map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {note.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{note.tags.length - 3}
                  </Badge>
                )}
              </div>
              
              {/* Note info */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{format(note.updatedAt, 'MMM d')}</span>
                <div className="flex items-center space-x-1">
                  <span>{note.wordCount} words</span>
                  {note.collaborators.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>{note.collaborators.length}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default NoteGallery; 