import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface NoteListProps {
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

const NoteList: React.FC<NoteListProps> = ({
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
        return <Database className="w-4 h-4" />;
      case 'calendar':
        return <Calendar className="w-4 h-4" />;
      case 'kanban':
        return <Trello className="w-4 h-4" />;
      case 'timeline':
        return <Activity className="w-4 h-4" />;
      case 'mindmap':
        return <Brain className="w-4 h-4" />;
      case 'whiteboard':
        return <Palette className="w-4 h-4" />;
      case 'presentation':
        return <Presentation className="w-4 h-4" />;
      case 'form':
        return <FormInput className="w-4 h-4" />;
      case 'workflow':
        return <Workflow className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-2 p-4">
      {notes.map((note) => (
        <div
          key={note.id}
          className="flex items-center space-x-4 p-4 bg-white border rounded-lg hover:shadow-md transition-all cursor-pointer"
          onClick={() => onNoteSelect(note)}
        >
          {/* Icon and status indicators */}
          <div className="flex items-center space-x-3">
            <div className="text-gray-600">
              {getNoteIcon(note)}
            </div>
            <div className="flex items-center space-x-1">
              {note.pinned && <Pin className="w-3 h-3 text-yellow-500" />}
              {note.starred && <Star className="w-3 h-3 text-yellow-500" />}
              {note.archived && <Archive className="w-3 h-3 text-gray-500" />}
              {note.isPublic ? (
                <Globe className="w-3 h-3 text-blue-500" />
              ) : (
                <Lock className="w-3 h-3 text-gray-500" />
              )}
            </div>
          </div>

          {/* Note content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-medium text-sm truncate">{note.title}</h3>
              <Badge variant="outline" className="text-xs">
                {note.category}
              </Badge>
            </div>
            <p className="text-xs text-gray-600 truncate mb-2">
              {note.content.substring(0, 100)}...
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {format(note.updatedAt, 'MMM d, yyyy')}
              </span>
              <span className="text-xs text-gray-500">
                {note.wordCount} words
              </span>
              {note.collaborators.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500">{note.collaborators.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center space-x-1">
            {note.tags.slice(0, 2).map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {note.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{note.tags.length - 2}
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(note.id);
              }}
              className={note.pinned ? 'text-yellow-600' : 'text-gray-400'}
            >
              <Pin className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar(note.id);
              }}
              className={note.starred ? 'text-yellow-600' : 'text-gray-400'}
            >
              <Star className="w-4 h-4" />
            </Button>
            
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
        </div>
      ))}
    </div>
  );
};

export default NoteList; 