export interface FollowupNotification {
  id: string;
  leadNumber: string;
  customerName: string;
  followupType: string;
  scheduledTime: Date;
  timeUntil: number; // minutes until follow-up
}

export function checkUpcomingFollowups(followups: any[]): FollowupNotification[] {
  const now = new Date();
  const notifications: FollowupNotification[] = [];

  followups.forEach(followup => {
    if (followup.scheduledDate && !followup.isDone) {
      const scheduledTime = new Date(followup.scheduledDate);
      const timeUntilMs = scheduledTime.getTime() - now.getTime();
      const timeUntilMinutes = Math.floor(timeUntilMs / (1000 * 60));

      // Show notification if follow-up is within 60 minutes
      if (timeUntilMinutes <= 60 && timeUntilMinutes > 0) {
        notifications.push({
          id: followup._id,
          leadNumber: followup.leadNumber,
          customerName: followup.customerName,
          followupType: followup.status,
          scheduledTime,
          timeUntil: timeUntilMinutes
        });
      }
    }
  });

  return notifications.sort((a, b) => a.timeUntil - b.timeUntil);
}

export function formatTimeUntil(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}