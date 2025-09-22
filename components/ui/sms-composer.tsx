'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, User, Paperclip, Smile } from 'lucide-react';

interface Lead {
  _id: string;
  customerName: string;
  phoneNumber: string;
  leadNumber: string;
}

interface SMSComposerProps {
  recipient: string;
  content: string;
  onRecipientChange: (recipient: string) => void;
  onContentChange: (content: string) => void;
  onSend: () => void;
  onSelectLead?: (lead: Lead) => void;
  leads?: Lead[];
  sending?: boolean;
  disabled?: boolean;
}

export default function SMSComposer({
  recipient,
  content,
  onRecipientChange,
  onContentChange,
  onSend,
  onSelectLead,
  leads = [],
  sending = false,
  disabled = false
}: SMSComposerProps) {
  const [showLeadSelector, setShowLeadSelector] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');

  const filteredLeads = leads.filter(lead =>
    lead.customerName.toLowerCase().includes(leadSearch.toLowerCase()) ||
    lead.phoneNumber.includes(leadSearch) ||
    lead.leadNumber.toLowerCase().includes(leadSearch.toLowerCase())
  );

  const handleLeadSelect = (lead: Lead) => {
    onRecipientChange(lead.phoneNumber);
    onSelectLead?.(lead);
    setShowLeadSelector(false);
    setLeadSearch('');
  };

  const getCharacterCount = () => {
    const maxLength = 1600;
    const segments = Math.ceil(content.length / 160);
    return {
      count: content.length,
      max: maxLength,
      segments,
      remaining: maxLength - content.length
    };
  };

  const charInfo = getCharacterCount();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Compose SMS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recipient */}
        <div>
          <Label htmlFor="recipient">Recipient</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="recipient"
              value={recipient}
              onChange={(e) => onRecipientChange(e.target.value)}
              placeholder="+1234567890"
              disabled={disabled}
              className="flex-1"
            />
            {onSelectLead && (
              <Button
                variant="outline"
                onClick={() => setShowLeadSelector(true)}
                disabled={disabled}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Leads
              </Button>
            )}
          </div>
        </div>

        {/* Message Content */}
        <div>
          <Label htmlFor="content">Message</Label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Type your message here..."
            rows={4}
            maxLength={1600}
            disabled={disabled}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">
              {charInfo.count}/{charInfo.max} characters • {charInfo.segments} segment{charInfo.segments !== 1 ? 's' : ''}
            </span>
            <span className={`text-xs ${charInfo.remaining < 50 ? 'text-red-500' : 'text-gray-500'}`}>
              {charInfo.remaining} remaining
            </span>
          </div>
        </div>

        {/* Quick Templates */}
        <div>
          <Label>Quick Templates</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onContentChange('Thank you for your inquiry. We will get back to you shortly.')}
              disabled={disabled}
            >
              Thank You
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onContentChange('Your order has been processed and will be shipped soon.')}
              disabled={disabled}
            >
              Order Update
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onContentChange('Please call us back at your earliest convenience.')}
              disabled={disabled}
            >
              Call Back
            </Button>
          </div>
        </div>

        {/* Send Button */}
        <Button
          onClick={onSend}
          disabled={disabled || sending || !recipient.trim() || !content.trim()}
          className="w-full flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {sending ? 'Sending...' : 'Send SMS'}
        </Button>

        {/* Lead Selector Modal */}
        {showLeadSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Select Lead</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLeadSelector(false)}
                >
                  ×
                </Button>
              </div>
              
              <Input
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                placeholder="Search leads..."
                className="mb-4"
              />
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead._id}
                    onClick={() => handleLeadSelect(lead)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border rounded"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{lead.customerName}</p>
                        <p className="text-sm text-gray-500">{lead.phoneNumber}</p>
                        <p className="text-xs text-gray-400">{lead.leadNumber}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredLeads.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No leads found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}