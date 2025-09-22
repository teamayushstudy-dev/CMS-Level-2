'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageSquare,
  History,
  Search,
  Filter,
  Download,
  Play,
  Pause,
  RotateCcw,
  Send,
  Plus,
  User,
  Clock,
  Calendar,
  Tag,
  FileText,
  Settings,
  Headphones
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Call {
  _id: string;
  callId: string;
  callType: 'inbound' | 'outbound';
  fromNumber: string;
  toNumber: string;
  duration: number;
  status: string;
  startTime: string;
  endTime?: string;
  recordingUrl?: string;
  customerName?: string;
  notes?: string;
  tags: string[];
  isRecorded: boolean;
  callQuality?: string;
  cost?: number;
}

interface SMS {
  _id: string;
  smsId: string;
  messageType: 'inbound' | 'outbound';
  fromNumber: string;
  toNumber: string;
  content: string;
  status: string;
  sentAt: string;
  customerName?: string;
  isRead: boolean;
}

interface Lead {
  _id: string;
  leadNumber: string;
  customerName: string;
  phoneNumber: string;
  customerEmail: string;
  status: string;
}

export default function PhonePage() {
  const [activeTab, setActiveTab] = useState<'softphone' | 'history' | 'sms'>('softphone');
  const [calls, setCalls] = useState<Call[]>([]);
  const [smsMessages, setSmsMessages] = useState<SMS[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadSelector, setShowLeadSelector] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [callTags, setCallTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  // SMS states
  const [smsRecipient, setSmsRecipient] = useState('');
  const [smsContent, setSmsContent] = useState('');
  const [sendingSms, setSendingSms] = useState(false);
  const [selectedSmsLead, setSelectedSmsLead] = useState<Lead | null>(null);
  const [showSmsLeadSelector, setShowSmsLeadSelector] = useState(false);
  
  // Filters
  const [callSearch, setCallSearch] = useState('');
  const [callStatusFilter, setCallStatusFilter] = useState('');
  const [callTypeFilter, setCallTypeFilter] = useState('');
  const [smsSearch, setSmsSearch] = useState('');
  const [smsStatusFilter, setSmsStatusFilter] = useState('');
  
  // Pagination
  const [callPage, setCallPage] = useState(1);
  const [smsPage, setSmsPage] = useState(1);
  const [callTotalPages, setCallTotalPages] = useState(1);
  const [smsTotalPages, setSmsTotalPages] = useState(1);
  
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadCalls();
    loadSmsMessages();
    loadLeads();
  }, [callPage, smsPage, callSearch, callStatusFilter, callTypeFilter, smsSearch, smsStatusFilter]);

  useEffect(() => {
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, []);

  const loadCalls = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: callPage.toString(),
        limit: '10',
        ...(callSearch && { search: callSearch }),
        ...(callStatusFilter && { status: callStatusFilter }),
        ...(callTypeFilter && { type: callTypeFilter })
      });

      const response = await fetch(`/api/calls?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCalls(data.calls);
        setCallTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to load calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSmsMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: smsPage.toString(),
        limit: '10',
        ...(smsSearch && { search: smsSearch }),
        ...(smsStatusFilter && { status: smsStatusFilter })
      });

      const response = await fetch(`/api/sms?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSmsMessages(data.messages);
        setSmsTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to load SMS messages:', error);
    }
  };

  const loadLeads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/leads?limit=1000', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads);
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
    }
  };

  const startCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/calls/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toNumber: phoneNumber,
          leadId: selectedLead?._id,
          customerName: selectedLead?.customerName || '',
          recordCall: isRecording
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentCall(data.call);
        setIsCallActive(true);
        setCallDuration(0);
        
        // Start call timer
        callTimerRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
        
        toast.success('Call initiated successfully');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to start call');
      }
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Failed to start call');
    }
  };

  const endCall = async () => {
    if (!currentCall) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/calls/${currentCall._id}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: callNotes,
          tags: callTags
        })
      });

      if (response.ok) {
        setIsCallActive(false);
        setCurrentCall(null);
        setCallDuration(0);
        setCallNotes('');
        setCallTags([]);
        setPhoneNumber('');
        setSelectedLead(null);
        
        if (callTimerRef.current) {
          clearInterval(callTimerRef.current);
        }
        
        toast.success('Call ended successfully');
        loadCalls();
      } else {
        toast.error('Failed to end call');
      }
    } catch (error) {
      console.error('Error ending call:', error);
      toast.error('Failed to end call');
    }
  };

  const toggleMute = async () => {
    if (!currentCall) return;

    try {
      const token = localStorage.getItem('token');
      const action = isMuted ? 'unmute' : 'mute';
      
      const response = await fetch(`/api/calls/${currentCall._id}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setIsMuted(!isMuted);
        toast.success(`Call ${action}d`);
      } else {
        toast.error(`Failed to ${action} call`);
      }
    } catch (error) {
      console.error(`Error ${isMuted ? 'unmuting' : 'muting'} call:`, error);
      toast.error(`Failed to ${isMuted ? 'unmute' : 'mute'} call`);
    }
  };

  const sendSMS = async () => {
    if (!smsRecipient.trim() || !smsContent.trim()) {
      toast.error('Please enter recipient and message content');
      return;
    }

    setSendingSms(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toNumber: smsRecipient,
          content: smsContent,
          leadId: selectedSmsLead?._id,
          customerName: selectedSmsLead?.customerName || ''
        })
      });

      if (response.ok) {
        setSmsContent('');
        setSmsRecipient('');
        setSelectedSmsLead(null);
        toast.success('SMS sent successfully');
        loadSmsMessages();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to send SMS');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast.error('Failed to send SMS');
    } finally {
      setSendingSms(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'completed': 'bg-green-100 text-green-800',
      'missed': 'bg-red-100 text-red-800',
      'busy': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800',
      'no-answer': 'bg-gray-100 text-gray-800',
      'sent': 'bg-blue-100 text-blue-800',
      'delivered': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'received': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const addTag = () => {
    if (newTag.trim() && !callTags.includes(newTag.trim())) {
      setCallTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCallTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading phone system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Telecom System</h1>
              <p className="text-gray-600">Make calls, send SMS, and manage communication history</p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant={activeTab === 'softphone' ? 'default' : 'outline'}
                onClick={() => setActiveTab('softphone')}
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                Softphone
              </Button>
              <Button
                variant={activeTab === 'history' ? 'default' : 'outline'}
                onClick={() => setActiveTab('history')}
                className="flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                Call History
              </Button>
              <Button
                variant={activeTab === 'sms' ? 'default' : 'outline'}
                onClick={() => setActiveTab('sms')}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                SMS
              </Button>
            </div>
          </div>
        </div>

        {/* Softphone Tab */}
        {activeTab === 'softphone' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Softphone Interface */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  Virtual Softphone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Phone Number Input */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1234567890"
                      disabled={isCallActive}
                      className="mt-1 text-lg"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowLeadSelector(true)}
                      disabled={isCallActive}
                      className="flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      {selectedLead ? selectedLead.customerName : 'Select Lead'}
                    </Button>
                    {selectedLead && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPhoneNumber(selectedLead.phoneNumber);
                        }}
                        disabled={isCallActive}
                      >
                        Use Lead Phone
                      </Button>
                    )}
                  </div>
                </div>

                {/* Call Controls */}
                <div className="space-y-4">
                  {!isCallActive ? (
                    <Button
                      onClick={startCall}
                      className="w-full h-16 text-lg bg-green-600 hover:bg-green-700 flex items-center justify-center gap-3"
                      disabled={!phoneNumber.trim()}
                    >
                      <PhoneCall className="h-6 w-6" />
                      Start Call
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      {/* Call Status */}
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-green-700 font-medium">Call Active</span>
                        </div>
                        <p className="text-2xl font-bold text-green-700">
                          {formatDuration(callDuration)}
                        </p>
                        <p className="text-sm text-green-600">
                          {currentCall?.toNumber}
                        </p>
                      </div>

                      {/* Call Control Buttons */}
                      <div className="grid grid-cols-3 gap-3">
                        <Button
                          variant="outline"
                          onClick={toggleMute}
                          className={`h-12 ${isMuted ? 'bg-red-50 text-red-600' : ''}`}
                        >
                          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => setIsRecording(!isRecording)}
                          className={`h-12 ${isRecording ? 'bg-red-50 text-red-600' : ''}`}
                        >
                          <RotateCcw className="h-5 w-5" />
                        </Button>
                        
                        <Button
                          onClick={endCall}
                          className="h-12 bg-red-600 hover:bg-red-700"
                        >
                          <PhoneOff className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Call Notes and Tags */}
                {isCallActive && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="callNotes">Call Notes</Label>
                      <textarea
                        id="callNotes"
                        value={callNotes}
                        onChange={(e) => setCallNotes(e.target.value)}
                        placeholder="Add notes about this call..."
                        rows={3}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <Label>Call Tags</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Add tag..."
                          onKeyPress={(e) => e.key === 'Enter' && addTag()}
                          className="flex-1"
                        />
                        <Button onClick={addTag} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {callTags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => removeTag(tag)}
                          >
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Recent Calls */}
                <div>
                  <h4 className="font-medium mb-3">Recent Calls</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {calls.slice(0, 5).map((call) => (
                      <div key={call._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <Phone className={`h-4 w-4 ${call.callType === 'outbound' ? 'text-blue-600' : 'text-green-600'}`} />
                          <div>
                            <p className="text-sm font-medium">
                              {call.callType === 'outbound' ? call.toNumber : call.fromNumber}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDuration(call.duration)} • {new Date(call.startTime).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPhoneNumber(call.callType === 'outbound' ? call.toNumber : call.fromNumber);
                          }}
                          disabled={isCallActive}
                        >
                          Call
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick SMS */}
                <div>
                  <h4 className="font-medium mb-3">Quick SMS</h4>
                  <div className="space-y-3">
                    <Input
                      value={smsRecipient}
                      onChange={(e) => setSmsRecipient(e.target.value)}
                      placeholder="Recipient phone number"
                    />
                    <textarea
                      value={smsContent}
                      onChange={(e) => setSmsContent(e.target.value)}
                      placeholder="Message content..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      onClick={sendSMS}
                      disabled={sendingSms || !smsRecipient.trim() || !smsContent.trim()}
                      className="w-full flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {sendingSms ? 'Sending...' : 'Send SMS'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Call History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search calls..."
                        value={callSearch}
                        onChange={(e) => setCallSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <select
                    value={callStatusFilter}
                    onChange={(e) => setCallStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="missed">Missed</option>
                    <option value="busy">Busy</option>
                    <option value="failed">Failed</option>
                    <option value="no-answer">No Answer</option>
                  </select>

                  <select
                    value={callTypeFilter}
                    onChange={(e) => setCallTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="inbound">Inbound</option>
                    <option value="outbound">Outbound</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Call History Table */}
            <Card>
              <CardHeader>
                <CardTitle>Call History ({calls.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Quality</TableHead>
                        <TableHead>Recording</TableHead>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calls.map((call) => (
                        <TableRow key={call._id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Phone className={`h-4 w-4 ${call.callType === 'outbound' ? 'text-blue-600' : 'text-green-600'}`} />
                              <span className="capitalize">{call.callType}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            {call.callType === 'outbound' ? call.toNumber : call.fromNumber}
                          </TableCell>
                          <TableCell>{call.customerName || 'Unknown'}</TableCell>
                          <TableCell>{formatDuration(call.duration)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(call.status)}>
                              {call.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {call.callQuality && (
                              <Badge variant="outline">
                                {call.callQuality}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {call.isRecorded && call.recordingUrl ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(call.recordingUrl, '_blank')}
                                className="flex items-center gap-1"
                              >
                                <Play className="h-3 w-3" />
                                Play
                              </Button>
                            ) : (
                              <span className="text-gray-400">No recording</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{new Date(call.startTime).toLocaleDateString()}</div>
                              <div className="text-gray-500">{new Date(call.startTime).toLocaleTimeString()}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {call.tags.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {call.tags.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{call.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setPhoneNumber(call.callType === 'outbound' ? call.toNumber : call.fromNumber);
                                }}
                                disabled={isCallActive}
                              >
                                <PhoneCall className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSmsRecipient(call.callType === 'outbound' ? call.toNumber : call.fromNumber);
                                  setActiveTab('sms');
                                }}
                              >
                                <MessageSquare className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {callTotalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setCallPage(prev => Math.max(prev - 1, 1))}
                      disabled={callPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4">
                      Page {callPage} of {callTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCallPage(prev => Math.min(prev + 1, callTotalPages))}
                      disabled={callPage === callTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* SMS Tab */}
        {activeTab === 'sms' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SMS Composer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Send SMS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="smsRecipient">Recipient Phone Number</Label>
                  <Input
                    id="smsRecipient"
                    value={smsRecipient}
                    onChange={(e) => setSmsRecipient(e.target.value)}
                    placeholder="+1234567890"
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowSmsLeadSelector(true)}
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    {selectedSmsLead ? selectedSmsLead.customerName : 'Select Lead'}
                  </Button>
                  {selectedSmsLead && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSmsRecipient(selectedSmsLead.phoneNumber);
                      }}
                    >
                      Use Lead Phone
                    </Button>
                  )}
                </div>

                <div>
                  <Label htmlFor="smsContent">Message Content</Label>
                  <textarea
                    id="smsContent"
                    value={smsContent}
                    onChange={(e) => setSmsContent(e.target.value)}
                    placeholder="Type your message here..."
                    rows={4}
                    maxLength={1600}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {smsContent.length}/1600 characters
                  </p>
                </div>

                <Button
                  onClick={sendSMS}
                  disabled={sendingSms || !smsRecipient.trim() || !smsContent.trim()}
                  className="w-full flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {sendingSms ? 'Sending...' : 'Send SMS'}
                </Button>
              </CardContent>
            </Card>

            {/* SMS History */}
            <Card>
              <CardHeader>
                <CardTitle>SMS History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* SMS Filters */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search SMS..."
                          value={smsSearch}
                          onChange={(e) => setSmsSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <select
                      value={smsStatusFilter}
                      onChange={(e) => setSmsStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Status</option>
                      <option value="sent">Sent</option>
                      <option value="delivered">Delivered</option>
                      <option value="failed">Failed</option>
                      <option value="pending">Pending</option>
                      <option value="received">Received</option>
                    </select>
                  </div>

                  {/* SMS Messages */}
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {smsMessages.map((sms) => (
                      <div key={sms._id} className={`p-3 rounded-lg border ${
                        sms.messageType === 'outbound' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <MessageSquare className={`h-4 w-4 ${
                              sms.messageType === 'outbound' ? 'text-blue-600' : 'text-green-600'
                            }`} />
                            <span className="text-sm font-medium">
                              {sms.messageType === 'outbound' ? `To: ${sms.toNumber}` : `From: ${sms.fromNumber}`}
                            </span>
                          </div>
                          <Badge className={getStatusColor(sms.status)}>
                            {sms.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{sms.content}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{new Date(sms.sentAt).toLocaleString()}</span>
                          {sms.customerName && (
                            <span className="font-medium">{sms.customerName}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SMS Pagination */}
                  {smsTotalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSmsPage(prev => Math.max(prev - 1, 1))}
                        disabled={smsPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center px-3 text-sm">
                        Page {smsPage} of {smsTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSmsPage(prev => Math.min(prev + 1, smsTotalPages))}
                        disabled={smsPage === smsTotalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lead Selector Modal */}
        <Dialog open={showLeadSelector} onOpenChange={setShowLeadSelector}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select Lead for Call</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Search leads..."
                className="w-full"
              />
              <div className="max-h-80 overflow-y-auto">
                {leads.map((lead) => (
                  <div
                    key={lead._id}
                    onClick={() => {
                      setSelectedLead(lead);
                      setPhoneNumber(lead.phoneNumber);
                      setShowLeadSelector(false);
                    }}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{lead.customerName}</p>
                        <p className="text-sm text-gray-500">{lead.phoneNumber}</p>
                        <p className="text-xs text-gray-400">{lead.leadNumber}</p>
                      </div>
                      <Badge variant="outline">{lead.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* SMS Lead Selector Modal */}
        <Dialog open={showSmsLeadSelector} onOpenChange={setShowSmsLeadSelector}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select Lead for SMS</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Search leads..."
                className="w-full"
              />
              <div className="max-h-80 overflow-y-auto">
                {leads.map((lead) => (
                  <div
                    key={lead._id}
                    onClick={() => {
                      setSelectedSmsLead(lead);
                      setSmsRecipient(lead.phoneNumber);
                      setShowSmsLeadSelector(false);
                    }}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{lead.customerName}</p>
                        <p className="text-sm text-gray-500">{lead.phoneNumber}</p>
                        <p className="text-xs text-gray-400">{lead.leadNumber}</p>
                      </div>
                      <Badge variant="outline">{lead.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}