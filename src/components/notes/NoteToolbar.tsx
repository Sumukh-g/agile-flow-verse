import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Archive,
    Bold,
    Brain,
    Code,
    Copy,
    Download,
    Heading1,
    Heading2,
    Heading3,
    Italic,
    Link,
    List,
    ListOrdered,
    Lock,
    Mic,
    MicOff,
    Paperclip,
    Pin,
    Quote,
    Save,
    Share,
    Star,
    Strikethrough,
    Table,
    Tag,
    Trash2,
    Underline,
    Unlock,
    Users,
    Video
} from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface Note {
  id: string;
  title: string;
  content: string;
  type: string;
  tags: string[];
  pinned: boolean;
  starred: boolean;
  archived: boolean;
  passwordProtected?: boolean;
  aiGenerated?: boolean;
  collaborators: string[];
  version: number;
  lastEditedBy: string;
  updatedAt: Date;
}

interface NoteToolbarProps {
  note: Note;
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
  const [isEditing, setIsEditing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showComments, setShowComments] = useState(false);
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
  const [showWorkflows2, setShowWorkflows2] = useState(false);
  const [showIntegrations2, setShowIntegrations2] = useState(false);
  const [showAnalytics2, setShowAnalytics2] = useState(false);
  const [showDatabase2, setShowDatabase2] = useState(false);
  const [showCalendar2, setShowCalendar2] = useState(false);
  const [showKanban2, setShowKanban2] = useState(false);
  const [showTimeline2, setShowTimeline2] = useState(false);
  const [showMindmap2, setShowMindmap2] = useState(false);
  const [showWhiteboard2, setShowWhiteboard2] = useState(false);
  const [showPresentation2, setShowPresentation2] = useState(false);
  const [showForms2, setShowForms2] = useState(false);
  const [showWorkflows3, setShowWorkflows3] = useState(false);
  const [showIntegrations3, setShowIntegrations3] = useState(false);
  const [showAnalytics3, setShowAnalytics3] = useState(false);
  const [showDatabase3, setShowDatabase3] = useState(false);
  const [showCalendar3, setShowCalendar3] = useState(false);
  const [showKanban3, setShowKanban3] = useState(false);
  const [showTimeline3, setShowTimeline3] = useState(false);
  const [showMindmap3, setShowMindmap3] = useState(false);
  const [showWhiteboard3, setShowWhiteboard3] = useState(false);
  const [showPresentation3, setShowPresentation3] = useState(false);
  const [showForms3, setShowForms3] = useState(false);
  const [showWorkflows4, setShowWorkflows4] = useState(false);
  const [showIntegrations4, setShowIntegrations4] = useState(false);
  const [showAnalytics4, setShowAnalytics4] = useState(false);
  const [showDatabase4, setShowDatabase4] = useState(false);
  const [showCalendar4, setShowCalendar4] = useState(false);
  const [showKanban4, setShowKanban4] = useState(false);
  const [showTimeline4, setShowTimeline4] = useState(false);
  const [showMindmap4, setShowMindmap4] = useState(false);
  const [showWhiteboard4, setShowWhiteboard4] = useState(false);
  const [showPresentation4, setShowPresentation4] = useState(false);
  const [showForms4, setShowForms4] = useState(false);

  // Audio recording functionality
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        // Add audio to note
        onUpdateNote(note.id, { 
          audioUrl: url,
          audioRecordedAt: new Date()
        });
        toast.success('Audio recording saved');
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast.error('Failed to start recording');
    }
  }, [note.id, onUpdateNote]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    // Stop recording logic would be here
  }, []);

  // AI assistance
  const generateWithAI = useCallback(async (prompt: string) => {
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const aiContent = `AI generated content based on: "${prompt}"\n\nThis is a placeholder for AI-generated content. In a real implementation, this would call an AI API to generate relevant content based on the prompt.`;
      
      onUpdateNote(note.id, { 
        content: note.content + '\n\n' + aiContent,
        aiGenerated: true,
        aiPrompt: prompt
      });
      
      toast.success('AI content generated');
    } catch (error) {
      toast.error('Failed to generate AI content');
    }
  }, [note.id, note.content, onUpdateNote]);

  // Password protection
  const togglePasswordProtection = useCallback(() => {
    if (note.passwordProtected) {
      onUpdateNote(note.id, { passwordProtected: false, password: null });
      toast.success('Password protection removed');
    } else {
      setShowPasswordDialog(true);
    }
  }, [note.id, note.passwordProtected, onUpdateNote]);

  const setPasswordProtection = useCallback(() => {
    if (password.trim()) {
      onUpdateNote(note.id, { 
        passwordProtected: true, 
        password: password.trim() 
      });
      setPassword('');
      setShowPasswordDialog(false);
      toast.success('Password protection enabled');
    }
  }, [note.id, password, onUpdateNote]);

  // Collaboration
  const toggleCollaboration = useCallback(() => {
    setIsCollaborating(!isCollaborating);
    onUpdateNote(note.id, { 
      isCollaborating: !isCollaborating,
      collaborationStartedAt: new Date()
    });
    toast.success(isCollaborating ? 'Collaboration stopped' : 'Collaboration started');
  }, [note.id, isCollaborating, onUpdateNote]);

  // Version control
  const saveVersion = useCallback(() => {
    onUpdateNote(note.id, { 
      version: note.version + 1,
      lastSavedVersion: new Date()
    });
    toast.success('Version saved');
  }, [note.id, note.version, onUpdateNote]);

  const restoreVersion = useCallback((version: number) => {
    onUpdateNote(note.id, { 
      version: version,
      restoredFromVersion: version,
      restoredAt: new Date()
    });
    toast.success(`Restored to version ${version}`);
  }, [note.id, onUpdateNote]);

  return (
    <div className="border-b bg-white dark:bg-gray-800 p-4">
      {/* Main Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {/* Text Formatting */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Format bold */}}
            className="h-8 w-8 p-0"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Format italic */}}
            className="h-8 w-8 p-0"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Format underline */}}
            className="h-8 w-8 p-0"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Format strikethrough */}}
            className="h-8 w-8 p-0"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          
          {/* Headings */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Add heading 1 */}}
            className="h-8 w-8 p-0"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Add heading 2 */}}
            className="h-8 w-8 p-0"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Add heading 3 */}}
            className="h-8 w-8 p-0"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          
          {/* Lists */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Add bullet list */}}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Add numbered list */}}
            className="h-8 w-8 p-0"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          
          {/* Special Blocks */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Add quote */}}
            className="h-8 w-8 p-0"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Add code block */}}
            className="h-8 w-8 p-0"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Add table */}}
            className="h-8 w-8 p-0"
          >
            <Table className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Media Controls */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Add attachment */}}
            className="h-8 w-8 p-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={isRecording ? stopRecording : startRecording}
            className={`h-8 w-8 p-0 ${isRecording ? 'bg-red-500 text-white' : ''}`}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Add video */}}
            className="h-8 w-8 p-0"
          >
            <Video className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Add link */}}
            className="h-8 w-8 p-0"
          >
            <Link className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          
          {/* AI Features */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAI(!showAI)}
            className="h-8 w-8 p-0"
          >
            <Brain className="h-4 w-4" />
          </Button>
          
          {/* Collaboration */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCollaboration}
            className={`h-8 w-8 p-0 ${isCollaborating ? 'bg-green-500 text-white' : ''}`}
          >
            <Users className="h-4 w-4" />
          </Button>
          
          {/* Version Control */}
          <Button
            variant="outline"
            size="sm"
            onClick={saveVersion}
            className="h-8 w-8 p-0"
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* AI Panel */}
      {showAI && (
        <div className="border-t pt-4 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Brain className="h-4 w-4" />
            <span className="font-medium">AI Assistant</span>
          </div>
          <div className="flex space-x-2">
            <Input
              placeholder="Ask AI to help with your note..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  generateWithAI(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              className="flex-1"
            />
            <Button onClick={() => generateWithAI('Summarize this note')}>
              Summarize
            </Button>
            <Button onClick={() => generateWithAI('Improve writing style')}>
              Improve
            </Button>
          </div>
        </div>
      )}

      {/* Note Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTogglePin(note.id)}
          >
            <Pin className="h-4 w-4 mr-2" />
            {note.pinned ? 'Unpin' : 'Pin'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleStar(note.id)}
          >
            <Star className="h-4 w-4 mr-2" />
            {note.starred ? 'Unstar' : 'Star'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onShareNote(note.id)}
          >
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExportNote(note.id)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDuplicateNote(note.id)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePasswordProtection}
          >
            {note.passwordProtected ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
            {note.passwordProtected ? 'Unlock' : 'Lock'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleArchive(note.id)}
          >
            <Archive className="h-4 w-4 mr-2" />
            {note.archived ? 'Unarchive' : 'Archive'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDeleteNote(note.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Note Info */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>Version {note.version}</span>
          <span>Last edited by {note.lastEditedBy}</span>
          <span>Updated {note.updatedAt.toLocaleDateString()}</span>
          {note.aiGenerated && (
            <Badge variant="secondary">
              <Brain className="h-3 w-3 mr-1" />
              AI Generated
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {note.collaborators.length > 0 && (
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{note.collaborators.length} collaborators</span>
            </div>
          )}
          {note.tags.length > 0 && (
            <div className="flex items-center space-x-1">
              <Tag className="h-3 w-3" />
              <span>{note.tags.length} tags</span>
            </div>
          )}
        </div>
      </div>

      {/* Password Protection Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-medium mb-4">Set Password Protection</h3>
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-4"
            />
            <div className="flex space-x-2">
              <Button onClick={() => setShowPasswordDialog(false)}>
                Cancel
              </Button>
              <Button onClick={setPasswordProtection}>
                Set Password
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteToolbar; 