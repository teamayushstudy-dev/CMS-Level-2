'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, User, Calendar } from 'lucide-react';

interface Lead {
  _id: string;
  leadNumber: string;
  customerName: string;
  description?: string;
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

interface LeadNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export default function LeadNotesModal({ isOpen, onClose, lead }: LeadNotesModalProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && lead) {
      loadLeadNotes();
    }
  }, [isOpen, lead]);

  const loadLeadNotes = async () => {
    if (!lead) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leads/${lead._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(data.lead.notes || []);
      }
    } catch (error) {
      console.error('Failed to load lead notes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Lead Notes & Description
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Lead Information */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{lead.customerName}</h3>
              <Badge className="bg-blue-100 text-blue-800">
                {lead.leadNumber}
              </Badge>
            </div>
          </div>

          {/* Description Section */}
          {lead.description && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Description
              </h4>
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <p className="text-gray-700 whitespace-pre-wrap">{lead.description}</p>
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Notes ({notes.length})
            </h4>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading notes...</p>
              </div>
            ) : notes.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {notes.map((note) => (
                  <div key={note._id} className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium">{note.createdBy?.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(note.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No notes available</p>
                <p className="text-sm text-gray-400">Notes will appear here when added</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}