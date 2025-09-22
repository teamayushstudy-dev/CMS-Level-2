'use client';

import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FollowupNotificationProps {
  userId: string;
}

interface UpcomingFollowup {
  _id: string;
  leadNumber: string;
  customerName: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string;
}

export default function FollowupNotification({ userId }: FollowupNotificationProps) {
  const [upcomingFollowups, setUpcomingFollowups] = useState<UpcomingFollowup[]>([]);
  const [shownToasts, setShownToasts] = useState<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    // Check for upcoming followups every minute
    intervalRef.current = setInterval(checkUpcomingFollowups, 60000);
    
    // Initial check
    checkUpcomingFollowups();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId]);

  const checkUpcomingFollowups = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/followups/upcoming', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const upcoming = data.upcomingFollowups || [];
        
        // Check for followups that are 10 minutes away
        const now = new Date();
        const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
        
        const imminent = upcoming.filter((followup: UpcomingFollowup) => {
          const scheduledTime = new Date(followup.scheduledDate);
          const timeDiff = scheduledTime.getTime() - now.getTime();
          const minutesUntil = Math.floor(timeDiff / (1000 * 60));
          
          return minutesUntil <= 10 && minutesUntil > 0;
        });

        // Show toasts for new imminent followups
        imminent.forEach((followup: UpcomingFollowup) => {
          const toastId = `followup-${followup._id}`;
          
          if (!shownToasts.has(toastId)) {
            const scheduledTime = new Date(followup.scheduledDate);
            const timeDiff = scheduledTime.getTime() - now.getTime();
            const minutesUntil = Math.floor(timeDiff / (1000 * 60));
            
            toast.warning(`Upcoming Follow-up!`, {
              description: `${followup.status} for ${followup.customerName} (${followup.leadNumber}) in ${minutesUntil} minutes`,
              action: {
                label: 'View',
                onClick: () => {
                  router.push('/dashboard/followups');
                  // Remove from upcoming when viewed
                  setUpcomingFollowups(prev => prev.filter(f => f._id !== followup._id));
                  setShownToasts(prev => new Set([...Array.from(prev), toastId]));
                }
              },
              duration: 15000,
              onDismiss: () => {
                // Add to upcoming followups if not viewed
                setUpcomingFollowups(prev => {
                  const exists = prev.some(f => f._id === followup._id);
                  if (!exists) {
                    return [...prev, followup];
                  }
                  return prev;
                });
              }
            });
            
            setShownToasts(prev => new Set([...Array.from(prev), toastId]));
          }
        });
      }
    } catch (error) {
      console.error('Error checking upcoming followups:', error);
    }
  };

  const handleViewFollowups = () => {
    router.push('/dashboard/followups');
    setUpcomingFollowups([]);
  };

  if (upcomingFollowups.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-72 z-50">
      <Button
        onClick={handleViewFollowups}
        className="relative bg-orange-600 hover:bg-orange-700 shadow-lg flex items-center gap-2"
      >
        <Clock className="h-4 w-4" />
        Follow-ups
        <Badge className="bg-red-500 text-white ml-1">
          {upcomingFollowups.length}
        </Badge>
      </Button>
    </div>
  );
}