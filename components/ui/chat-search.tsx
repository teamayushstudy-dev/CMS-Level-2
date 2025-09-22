'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MessageSquare, FileText, Image, Video, Share } from 'lucide-react';

interface SearchResult {
  chatId: string;
  chatName: string;
  chatType: string;
  messageId: string;
  content: string;
  senderName: string;
  timestamp: string;
  messageType: string;
}

interface ChatSearchProps {
  onSelectChat: (chatId: string) => void;
}

export default function ChatSearch({ onSelectChat }: ChatSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim() && query.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchChats();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
    }
  }, [query]);

  const searchChats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/chats/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    onSelectChat(result.chatId);
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const getMessageTypeIcon = (messageType: string) => {
    switch (messageType) {
      case 'file':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'image':
        return <Image className="h-4 w-4 text-blue-500" />;
      case 'video':
        return <Video className="h-4 w-4 text-purple-500" />;
      case 'lead_share':
        return <Share className="h-4 w-4 text-green-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Search Chats
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Chat Messages
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col flex-1 min-h-0">
          <div className="mb-4">
            <Input
              placeholder="Search messages, chat names..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Searching...</span>
              </div>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No messages found</p>
              </div>
            )}

            {!loading && query.length < 2 && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Type at least 2 characters to search</p>
              </div>
            )}

            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectResult(result)}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {getMessageTypeIcon(result.messageType)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{result.chatName}</span>
                        <Badge className="bg-gray-100 text-gray-800 text-xs">
                          {result.chatType}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">{result.senderName}:</span>{' '}
                        <span className="break-words">
                          {highlightText(result.content, query)}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(result.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}