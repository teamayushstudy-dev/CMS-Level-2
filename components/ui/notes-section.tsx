'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus } from 'lucide-react';

interface Note {
  _id: string;
  content: string;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

interface NotesSectionProps {
  leadId: string;
  notes: Note[];
  onNoteAdded: (note: Note) => void;
}

export default function NotesSection({ leadId, notes, onNoteAdded }: NotesSectionProps) {
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newNote })
      });

      if (response.ok) {
        const data = await response.json();
        const newNoteData = data.notes[data.notes.length - 1];
        onNoteAdded(newNoteData);
        setNewNote('');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Notes ({notes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Note */}
        <div>
          <Label htmlFor="newNote">Add New Note</Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="newNote"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Enter your note..."
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddNote();
                }
              }}
            />
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim() || loading}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>

        {/* Notes List */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {notes.length > 0 ? (
            notes.map((note) => (
              <div key={note._id} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="text-xs">
                    {note.createdBy?.name}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No notes yet</p>
              <p className="text-sm text-gray-400">Add the first note above</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}