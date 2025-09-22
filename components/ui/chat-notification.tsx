'use client';

import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ChatNotificationProps {
  userId: string;
}

interface UnreadMessage {
  chatId: string;
  chatName: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export default function ChatNotification({ userId }: ChatNotificationProps) {
  const [unreadMessages, setUnreadMessages] = useState<UnreadMessage[]>([]);
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());
  const [shownToasts, setShownToasts] = useState<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    // Check for new messages every 10 seconds
    intervalRef.current = setInterval(checkForNewMessages, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId]);

  const checkForNewMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/chats/new-messages?since=${lastCheckTime.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const newMessages = data.newMessages || [];
        
        if (newMessages.length > 0) {
          // Show toasts for new messages not already shown
          const newToasts = newMessages.filter((msg: UnreadMessage) => 
            !shownToasts.has(`${msg.chatId}-${msg.timestamp}`)
          );
          
          newToasts.forEach((message: UnreadMessage) => {
            const toastId = `${message.chatId}-${message.timestamp}`;
            
            toast.info(`New message from ${message.senderName}`, {
              description: message.content.substring(0, 100),
              action: {
                label: 'View',
                onClick: () => {
                  router.push('/dashboard/chat');
                  // Remove from unread when viewed
                  setUnreadMessages(prev => prev.filter(msg => 
                    `${msg.chatId}-${msg.timestamp}` !== toastId
                  ));
                  setShownToasts(prev => new Set([...Array.from(prev), toastId]));
                }
              },
              duration: 10000,
              onDismiss: () => {
                // Add to unread messages if not viewed
                setUnreadMessages(prev => {
                  const exists = prev.some(msg => `${msg.chatId}-${msg.timestamp}` === toastId);
                  if (!exists) {
                    return [...prev, message];
                  }
                  return prev;
                });
              }
            });
            
            setShownToasts(prev => new Set([...Array.from(prev), toastId]));
          });
          
          setLastCheckTime(new Date());
        }
      }
    } catch (error) {
      console.error('Error checking for new messages:', error);
    }
  };

  const handleViewMessages = () => {
    router.push('/dashboard/chat');
    setUnreadMessages([]);
  };

  if (unreadMessages.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <Button
        onClick={handleViewMessages}
        className="relative bg-blue-600 hover:bg-blue-700 shadow-lg flex items-center gap-2"
      >
        <MessageSquare className="h-4 w-4" />
        Messages
        <Badge className="bg-red-500 text-white ml-1">
          {unreadMessages.length}
        </Badge>
      </Button>
    </div>
  );
}