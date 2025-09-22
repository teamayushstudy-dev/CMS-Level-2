'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { checkUpcomingFollowups, formatTimeUntil, FollowupNotification } from '@/utils/followupNotifications';

export function useFollowupNotifications(user: any) {
  const [notifications, setNotifications] = useState<FollowupNotification[]>([]);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const checkFollowups = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/followups/overdue', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const overdueFollowups = data.overdueFollowups || [];
          
          // Only show notifications for follow-ups not already shown
          const newNotifications = overdueFollowups.filter((followup: any) => {
            return !shownNotifications.has(followup._id);
          });

          if (newNotifications.length > 0) {
            newNotifications.forEach((followup: any) => {
              const scheduledTime = new Date(followup.scheduledDate);
              const overdueMins = Math.floor((new Date().getTime() - scheduledTime.getTime()) / (1000 * 60));
              
              toast.error(`Overdue Follow-up!`, {
                description: `${followup.status} for ${followup.customerName} (${followup.leadNumber}) was due ${overdueMins} minutes ago`,
                action: {
                  label: 'View Follow-ups',
                  onClick: () => window.location.href = '/dashboard/followups'
                },
                duration: 15000
              });
              
              // Mark as shown
              setShownNotifications(prev => new Set([...Array.from(prev), followup._id]));
            });
          }

          setNotifications(overdueFollowups);
          setLastCheck(new Date());
        }
      } catch (error) {
        console.error('Error checking overdue follow-ups:', error);
      }
    };

    // Initial check
    checkFollowups();

    // Set up interval for periodic checks (every 2 minutes)
    const interval = setInterval(checkFollowups, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, shownNotifications]);

  return { notifications };
}