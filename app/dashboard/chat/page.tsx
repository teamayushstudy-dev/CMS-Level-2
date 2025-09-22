'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare,
  Users,
  Plus,
  Search,
  Send,
  X,
  UserPlus,
  Paperclip,
  Download,
  FileText,
  Image,
  Video,
  Share,
  Eye,
  Settings
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import LeadShareModal from '@/components/ui/lead-share-modal';
import ChatSearch from '@/components/ui/chat-search';
import ChatParticipantsManager from '@/components/ui/chat-participants-manager';
import ChatFilePreview from '@/components/ui/chat-file-preview';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Chat {
  _id: string;
  chatId: string;
  chatType: 'direct' | 'group';
  chatName?: string;
  participants: User[];
  createdBy: string;
  lastMessage?: {
    content: string;
    senderId: {
      name: string;
    };
    timestamp: string;
  };
  messages: Message[];
}

interface Message {
  messageId: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
  };
  content: string;
  messageType: 'text' | 'file' | 'image' | 'video' | 'lead_share';
  fileUrl?: string;
  fileName?: string;
  leadData?: any;
  isRead: boolean;
  timestamp: string;
}

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatType, setNewChatType] = useState<'direct' | 'group'>('direct');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupChatName, setGroupChatName] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchUsers, setSearchUsers] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showLeadShare, setShowLeadShare] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    loadChats();
    loadUsers();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedChat) {
      const interval = setInterval(() => {
        loadMessages(selectedChat._id);
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  useEffect(() => {
    // Clear unread messages when chat page is opened
    const clearUnreadMessages = () => {
      // This will be handled by the ChatNotification component
    };
    
    clearUnreadMessages();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChats(data.chats);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      // Use dedicated endpoint for chat users that allows all users to chat with each other
      const response = await fetch('/api/users/chat-users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setSelectedChat(data.chat);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async (messageType: string = 'text', content?: string, fileData?: any, leadData?: any) => {
    const messageContent = content || newMessage;
    if (!messageContent.trim() && !fileData && !leadData) return;
    if (!selectedChat) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/chats/${selectedChat._id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: messageContent,
          messageType,
          fileUrl: fileData?.fileUrl,
          fileName: fileData?.fileName,
          leadData
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.chat.messages);
        setNewMessage('');
        loadChats(); // Refresh chat list to update last message
        
        // Show notification for successful send
        if (messageType === 'file') {
          toast.success('File shared successfully');
        } else if (messageType === 'lead_share') {
          toast.success('Lead details shared successfully');
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('module', 'chats');
      formData.append('targetId', selectedChat?._id || '');

      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        const uploadedFile = data.files[0];
        
        await sendMessage(
          getFileMessageType(file.type),
          `Shared file: ${uploadedFile.originalName}`,
          {
            fileUrl: uploadedFile.filePath,
            fileName: uploadedFile.originalName
          }
        );
      } else {
        toast.error('Failed to upload file');
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
      setShowFileUpload(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getFileMessageType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'file';
  };

  const handleLeadShare = async (leadData: any) => {
    await sendMessage('lead_share', `Shared lead details: ${leadData.customerName} (${leadData.leadNumber})`, undefined, leadData);
    setShowLeadShare(false);
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Chat deleted successfully');
        setSelectedChat(null);
        setMessages([]);
        loadChats();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete chat');
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const createChat = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    if (newChatType === 'group' && !groupChatName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatType: newChatType,
          participants: selectedUsers,
          chatName: newChatType === 'group' ? groupChatName : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        setShowNewChatModal(false);
        setSelectedUsers([]);
        setGroupChatName('');
        loadChats();
        setSelectedChat(data.chat);
        loadMessages(data.chat._id);
        toast.success('Chat created successfully');
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast.error('Failed to create chat');
    }
  };

  const getChatDisplayName = (chat: Chat) => {
    if (chat.chatType === 'group') {
      return chat.chatName || `Group: ${chat.participants.map(p => p.name).join(', ')}`;
    }
    
    const otherParticipant = chat.participants.find(p => p._id !== currentUser?._id);
    return otherParticipant?.name || 'Unknown User';
  };

  // getUnreadCount function
  const getUnreadCount = (chat: Chat) => {
    if (!chat.messages) return 0;
    return chat.messages.filter((message: any) => 
      message.senderId && // Add this null-check
      message.senderId._id !== currentUser?._id && 
      !message.readBy?.some((r: any) => r.userId === currentUser?._id)
    ).length;
  };

  const renderMessage = (message: Message) => {
    const isOwn = message.senderId._id === currentUser?._id;
    
    return (
    <div key={message.messageId} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwn ? 'bg-blue-600 text-white ml-auto' : 'bg-gray-100 text-gray-900 mr-auto'
        }`}>
          {!isOwn && selectedChat?.chatType === 'group' && message.senderId && ( // Add message.senderId check here
            <p className="text-xs font-medium mb-1 opacity-75">
              {message.senderId.name}
            </p>
          )}
          
          {message.messageType === 'text' && (
            <p className="text-sm">{message.content}</p>
          )}
          
          {(message.messageType === 'file' || message.messageType === 'image' || message.messageType === 'video') && (
            <div className="space-y-2">
              <p className="text-sm">{message.content}</p>
              {message.fileUrl && (
                <div className="flex items-center gap-2">
                  {message.messageType === 'image' && (
                    <Image className="h-4 w-4" />
                  )}
                  {message.messageType === 'video' && (
                    <Video className="h-4 w-4" />
                  )}
                  {message.messageType === 'file' && (
                    <FileText className="h-4 w-4" />
                  )}
                  <a
                    href={message.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline hover:no-underline"
                  >
                    {message.fileName || 'Download'}
                  </a>
                </div>
              )}
            </div>
          )}
          
          {message.messageType === 'lead_share' && message.leadData && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{message.content}</p>
              <div className={`p-3 rounded border ${isOwn ? 'border-blue-300 bg-blue-500' : 'border-gray-300 bg-white'}`}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium text-sm ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                      Lead Details
                    </h4>
                    <Button
                      size="sm"
                      variant={isOwn ? "secondary" : "outline"}
                      onClick={() => router.push(`/dashboard/leads/${message.leadData._id}`)}
                      className="h-6 px-2 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                  
                  <div className={`text-xs space-y-1 ${isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
                    <div className="flex justify-between">
                      <span>Lead Number:</span>
                      <span className="font-medium">{message.leadData.leadNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <span className="font-medium">{message.leadData.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span className="font-medium">{message.leadData.phoneNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="font-medium">{message.leadData.customerEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-medium">{message.leadData.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Agent:</span>
                      <span className="font-medium">{message.leadData.assignedAgent?.name}</span>
                    </div>
                    {message.leadData.salesPrice && (
                      <div className="flex justify-between">
                        <span>Sales Price:</span>
                        <span className="font-medium">${message.leadData.salesPrice.toLocaleString()}</span>
                      </div>
                    )}
                    {message.leadData.totalMargin && (
                      <div className="flex justify-between">
                        <span>Margin:</span>
                        <span className="font-medium">${message.leadData.totalMargin.toLocaleString()}</span>
                      </div>
                    )}
                    {message.leadData.products && message.leadData.products.length > 0 && (
                      <div className="pt-1 border-t border-opacity-20">
                        <span>Products:</span>
                        <div className="mt-1 space-y-1">
                          {message.leadData.products.map((product: any, index: number) => (
                            <div key={index} className="text-xs">
                              • {product.productName} ({product.productType})
                              {product.make && ` - ${product.make}`}
                              {product.model && ` ${product.model}`}
                              {product.yearOfMfg && ` (${product.yearOfMfg})`}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <p className={`text-xs mt-1 ${
            isOwn ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  };

  const filteredUsers = users.filter(user => 
    user._id !== currentUser?._id &&
    user.name.toLowerCase().includes(searchUsers.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chats...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Chat System</h1>
              <p className="text-gray-600">Communicate with team members, share files and lead details</p>
            </div>
            
            <div className="flex gap-3">
              <ChatSearch onSelectChat={(chatId) => {
                const chat = chats.find(c => c._id === chatId);
                if (chat) {
                  setSelectedChat(chat);
                  loadMessages(chatId);
                }
              }} />
              
              <Dialog open={showNewChatModal} onOpenChange={setShowNewChatModal}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Chat
                </Button>
              </DialogTrigger>
              </Dialog>
            </div>
            <Dialog open={showNewChatModal} onOpenChange={setShowNewChatModal}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Chat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Chat Type</Label>
                    <div className="flex gap-2 mt-1">
                      <Button
                        variant={newChatType === 'direct' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewChatType('direct')}
                      >
                        Direct Chat
                      </Button>
                      <Button
                        variant={newChatType === 'group' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewChatType('group')}
                      >
                        Group Chat
                      </Button>
                    </div>
                  </div>

                  {newChatType === 'group' && (
                    <div>
                      <Label htmlFor="groupName">Group Name</Label>
                      <Input
                        id="groupName"
                        value={groupChatName}
                        onChange={(e) => setGroupChatName(e.target.value)}
                        placeholder="Enter group name"
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div>
                    <Label>Search Users</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        value={searchUsers}
                        onChange={(e) => setSearchUsers(e.target.value)}
                        placeholder="Search users..."
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Select Users ({selectedUsers.length} selected)</Label>
                    <div className="mt-1 max-h-40 overflow-y-auto border rounded-md p-2">
                      {filteredUsers.map(user => (
                        <label key={user._id} className="flex items-center space-x-2 mb-2">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (newChatType === 'direct' && selectedUsers.length >= 1) {
                                  setSelectedUsers([user._id]);
                                } else {
                                  setSelectedUsers(prev => [...prev, user._id]);
                                }
                              } else {
                                setSelectedUsers(prev => prev.filter(id => id !== user._id));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium">{user.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({user.role})</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewChatModal(false);
                        setSelectedUsers([]);
                        setGroupChatName('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={createChat}>
                      Create Chat
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Chat List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chats ({chats.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {chats.map((chat) => {
                  const unreadCount = getUnreadCount(chat);
                  const displayName = getChatDisplayName(chat);
                  const participantNames = chat.participants.map(p => p.name).join(', ');
                  return (
                    <div
                      key={chat._id}
                      onClick={() => loadMessages(chat._id)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedChat?._id === chat._id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            {chat.chatType === 'group' ? (
                              <Users className="h-5 w-5 text-blue-600" />
                            ) : (
                              <span className="text-sm font-medium text-blue-600">
                                {displayName.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm truncate" title={displayName}>
                              {displayName}
                            </p>
                            <p className="text-xs text-gray-400 truncate" title={participantNames}>
                              {participantNames}
                            </p>
                            {chat.lastMessage && chat.lastMessage.senderId && (
                              <p className="text-xs text-gray-500 truncate mt-1">
                                {chat.lastMessage.senderId.name}: {chat.lastMessage.content}
                              </p>
                            )}
                          </div>
                        </div>
                        {unreadCount > 0 && (
                          <Badge className="bg-red-500 text-white text-xs">
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {chats.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No chats yet</p>
                    <Button
                      onClick={() => setShowNewChatModal(true)}
                      className="mt-2"
                      size="sm"
                    >
                      Start a conversation
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Messages */}
          <Card className="lg:col-span-2">
            {selectedChat ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {selectedChat.chatType === 'group' ? (
                          <Users className="h-4 w-4 text-blue-600" />
                        ) : (
                          <span className="text-sm font-medium text-blue-600">
                            {getChatDisplayName(selectedChat).charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{getChatDisplayName(selectedChat)}</h3>
                        {selectedChat.chatType === 'group' && selectedChat.chatName && (
                          <p className="text-sm text-gray-600">Group Chat</p>
                        )}
                        {selectedChat.chatType === 'direct' && (
                          <p className="text-sm text-gray-600">Direct Chat</p>
                        )}
                        <div className="text-sm text-gray-500">
                          <p className="font-medium">Participants ({selectedChat.participants.length}):</p>
                          <p className="truncate max-w-md" title={selectedChat.participants.map(p => p.name).join(', ')}>
                            {selectedChat.participants.map(p => p.name).join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Admin Delete Button */}
                      {currentUser?.role === 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteChat(selectedChat._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      {selectedChat.chatType === 'group' && (
                        <ChatParticipantsManager
                          chat={selectedChat}
                          currentUserId={currentUser?._id || ''}
                          onUpdate={() => {
                            loadChats();
                            loadMessages(selectedChat._id);
                          }}
                        />
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0 flex flex-col h-[calc(100vh-350px)]">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message: Message) => renderMessage(message))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex gap-2 mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFileUpload(true)}
                        className="flex items-center gap-1"
                      >
                        <Paperclip className="h-3 w-3" />
                        File
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowLeadShare(true)}
                        className="flex items-center gap-1"
                      >
                        <Share className="h-3 w-3" />
                        Share Lead
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            sendMessage();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button onClick={() => sendMessage()} disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a chat</h3>
                  <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* File Upload Modal */}
        <Dialog open={showFileUpload} onOpenChange={setShowFileUpload}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Share File</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select File</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  accept="*/*"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports documents, images, videos and other file types (Max 10MB)
                </p>
              </div>
              
              {uploadingFile && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Uploading file...</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Lead Share Modal */}
        <LeadShareModal
          isOpen={showLeadShare}
          onClose={() => setShowLeadShare(false)}
          onShare={handleLeadShare}
        />
      </div>
    </div>
  );
}