'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/sidebar';
import { toast } from 'sonner';
import { useFollowupNotifications } from '@/hooks/use-followup-notifications';
import ChatNotification from '@/components/ui/chat-notification';
import FollowupNotification from '@/components/ui/followup-notification';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Initialize follow-up notifications
  useFollowupNotifications(user);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed left-0 top-0 h-full z-50">
        <Sidebar user={user} onLogout={handleLogout} />
      </div>
      <div className="ml-64 min-w-0">
        {children}
      </div>
      {user && <ChatNotification userId={user.id} />}
      {user && <FollowupNotification userId={user.id} />}
    </div>
  );
}