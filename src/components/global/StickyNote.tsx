
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation
import { StickyNote as StickyNoteIcon, X, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StickyNote: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const location = useLocation(); // Get location object
  const noteKey = `stickyNote_${location.pathname}`; // Create a unique key based on the path

  useEffect(() => {
    const savedNote = localStorage.getItem(noteKey);
    if (savedNote) {
      setNote(savedNote);
    } else {
      setNote(''); // Ensure note is reset if no saved note for this page
    }
  }, [noteKey]); // Rerun effect if noteKey changes (i.e., page changes)

  useEffect(() => {
    localStorage.setItem(noteKey, note);
  }, [note, noteKey]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (isOpen) { // Closing
      setIsEditing(false);
    } else { // Opening
      // Reload note when opening, in case it was changed on another tab for the same page
      const savedNote = localStorage.getItem(noteKey);
      if (savedNote) {
        setNote(savedNote);
      } else {
        setNote('');
      }
      if (!note && !savedNote) setIsEditing(true); // Auto-edit if note is empty
    }
  };

  const handleNoteChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(event.target.value);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg"
        onClick={toggleOpen}
        aria-label="Open sticky note"
      >
        <StickyNoteIcon className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-64 shadow-lg animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between py-2 px-4 border-b">
        <CardTitle className="text-base font-semibold flex items-center">
          <StickyNoteIcon className="h-4 w-4 mr-2" />
          Sticky Note
        </CardTitle>
        <div className="flex items-center gap-1">
          {!isEditing && note && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleOpen}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        {isEditing ? (
          <Textarea
            value={note}
            onChange={handleNoteChange}
            placeholder="Type your note..."
            className="w-full h-32 resize-none text-sm"
            autoFocus
            onBlur={() => setIsEditing(false)}
          />
        ) : (
          <div
            className="w-full h-32 p-2 text-sm whitespace-pre-wrap overflow-y-auto cursor-text"
            onClick={() => setIsEditing(true)}
          >
            {note || <span className="text-muted-foreground">Click to add a note...</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StickyNote;

