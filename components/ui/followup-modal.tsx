'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';

export interface FollowupData {
  followupDate: string;
  followupTime: string;
  notes?: string;
}

interface FollowupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (data: FollowupData) => void;
  leadData: {
    customerName: string;
    leadNumber: string;
  };
  followupType: string;
}

export default function FollowupModal({
  isOpen,
  onClose,
  onSchedule,
  leadData,
  followupType,
}: FollowupModalProps) {
  const [formData, setFormData] = useState<FollowupData>({
    followupDate: '',
    followupTime: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.followupDate || !formData.followupTime) {
      toast.error('Please select both date and time for the follow-up.');
      return;
    }

    setLoading(true);
    try {
      await onSchedule(formData);
      // Reset form and close modal only after successful schedule
      setFormData({ followupDate: '', followupTime: '', notes: '' });
      onClose();
    } catch (error) {
      console.error('Scheduling failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule {followupType}</DialogTitle>
          <DialogDescription>
            For {leadData.customerName} (Lead #{leadData.leadNumber})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div>
            <Label htmlFor="followupDate">Follow-up Date *</Label>
            <Input
              id="followupDate"
              name="followupDate"
              type="date"
              value={formData.followupDate}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="followupTime">Follow-up Time *</Label>
            <Input
              id="followupTime"
              name="followupTime"
              type="time"
              value={formData.followupTime}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional notes..."
              rows={3}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="mt-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              {loading ? 'Scheduling...' : 'Schedule Follow-up'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
