'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Edit2, Save, X, Trash2 } from 'lucide-react';

interface Lead {
  _id: string;
  leadNumber: string;
  customerName: string;
  notes?: Array<{
    _id: string;
    content: string;
    createdAt: string;
    createdBy: {
      name: string;
      email: string;
    };
  }>;
}

interface EnhancedNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onUpdate: () => void;
}

export default function EnhancedNotesModal({ isOpen, onClose, lead, onUpdate }: EnhancedNotesModalProps) {
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    if (lead?.notes) {
      setNotes(lead.notes);
    }
  }, [lead]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !lead) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leads/${lead._id}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newNote })
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes);
        setNewNote('');
        onUpdate();
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

  const handleEditNote = (noteId: string, content: string) => {
    setEditingNote(noteId);
    setEditContent(content);
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim() || !lead) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leads/${lead._id}/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editContent })
      });

      if (response.ok) {
        // Update local notes
        setNotes(prev => prev.map(note => 
          note._id === noteId 
            ? { ...note, content: editContent }
            : note
        ));
        setEditingNote(null);
        setEditContent('');
        onUpdate();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Failed to update note');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setEditContent('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notes for {lead?.customerName} ({lead?.leadNumber})
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Add New Note */}
          <div className="border-b pb-4 mb-4">
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
          <div className="flex-1 overflow-y-auto space-y-3">
            {notes.length > 0 ? (
              notes.map((note) => (
                <div key={note._id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {note.createdBy?.name}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditNote(note._id, note.content)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {editingNote === note._id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(note._id)}
                          disabled={!editContent.trim() || loading}
                          className="flex items-center gap-1"
                        >
                          <Save className="h-3 w-3" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="flex items-center gap-1"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {note.content}
                    </p>
                  )}
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
        </div>

        <div className="border-t pt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}