'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, Plus } from 'lucide-react';

interface Lead {
  _id: string;
  leadNumber: string;
  customerName: string;
}

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoteAdded: () => void;
}

export default function NotesModal({ isOpen, onClose, onNoteAdded }: NotesModalProps) {
  const [selectedLead, setSelectedLead] = useState<string>('');
  const [noteContent, setNoteContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadLeads();
    }
  }, [isOpen]);

  const loadLeads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/leads?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLead || !noteContent.trim()) {
      alert('Please select a lead and enter note content');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leads/${selectedLead}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: noteContent })
      });

      if (response.ok) {
        setSelectedLead('');
        setNoteContent('');
        onNoteAdded();
        onClose();
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Add Note to Lead
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="leadSelect">Select Lead</Label>
            <select
              id="leadSelect"
              value={selectedLead}
              onChange={(e) => setSelectedLead(e.target.value)}
              required
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a lead...</option>
              {leads.map(lead => (
                <option key={lead._id} value={lead._id}>
                  {lead.leadNumber} - {lead.customerName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="noteContent">Note Content</Label>
            <textarea
              id="noteContent"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Enter your note..."
              rows={4}
              required
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedLead || !noteContent.trim()}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {loading ? 'Adding...' : 'Add Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}