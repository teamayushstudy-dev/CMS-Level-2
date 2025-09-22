'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, UserPlus, UserMinus, Search } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Chat {
  _id: string;
  chatType: string;
  chatName?: string;
  participants: User[];
  createdBy: string;
}

interface ChatParticipantsManagerProps {
  chat: Chat;
  currentUserId: string;
  onUpdate: () => void;
}

export default function ChatParticipantsManager({ chat, currentUserId, onUpdate }: ChatParticipantsManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchUsers, setSearchUsers] = useState('');
  const [loading, setLoading] = useState(false);

  const loadAvailableUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out users already in the chat
        const participantIds = chat.participants.map(p => p._id);
        const available = data.users.filter((user: User) => !participantIds.includes(user._id));
        setAvailableUsers(available);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleAddParticipants = async (userIds: string[]) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chats/participants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId: chat._id,
          userIds,
          action: 'add'
        })
      });

      if (response.ok) {
        toast.success('Participants added successfully');
        onUpdate();
        setIsOpen(false);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to add participants');
      }
    } catch (error) {
      console.error('Failed to add participants:', error);
      toast.error('Failed to add participants');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this participant?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chats/participants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId: chat._id,
          userIds: [userId],
          action: 'remove'
        })
      });

      if (response.ok) {
        toast.success('Participant removed successfully');
        onUpdate();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to remove participant');
      }
    } catch (error) {
      console.error('Failed to remove participant:', error);
      toast.error('Failed to remove participant');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
    user.email.toLowerCase().includes(searchUsers.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={loadAvailableUsers}
          className="flex items-center gap-1"
        >
          <Settings className="h-3 w-3" />
          Manage
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Group Participants</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col flex-1 min-h-0 space-y-6">
          {/* Current Participants */}
          <div>
            <Label className="text-base font-semibold">Current Participants ({chat.participants.length})</Label>
            <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg">
              {chat.participants.map(participant => (
                <div key={participant._id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{participant.name}</p>
                      <p className="text-xs text-gray-500">{participant.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gray-100 text-gray-800 text-xs">
                      {participant.role}
                    </Badge>
                    {participant._id === currentUserId && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">You</Badge>
                    )}
                    {participant._id === chat.createdBy && (
                      <Badge className="bg-green-100 text-green-800 text-xs">Creator</Badge>
                    )}
                    {participant._id !== currentUserId && participant._id !== chat.createdBy && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveParticipant(participant._id)}
                        disabled={loading}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      >
                        <UserMinus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Participants */}
          <div className="flex-1 min-h-0">
            <Label className="text-base font-semibold">Add Participants</Label>
            <div className="mt-2">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users to add..."
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <div key={user._id} className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-green-600">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-100 text-gray-800 text-xs">
                          {user.role}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleAddParticipants([user._id])}
                          disabled={loading}
                          className="h-6 px-2 text-xs flex items-center gap-1"
                        >
                          <UserPlus className="h-3 w-3" />
                          Add
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">
                      {searchUsers ? 'No users found matching your search' : 'No users available to add'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}