'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  FileText, 
  ShoppingCart, 
  CreditCard, 
  Target,
  TrendingUp,
  Phone,
  Users,
  Activity,
  MessageSquare,
  LogOut,
  Car,
  Clock
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  // Load unread count on component mount
  useEffect(() => {
    if (user) {
      loadUnreadCount();
      // Set up interval to check for new messages
      const interval = setInterval(loadUnreadCount, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chats/unread-count', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      roles: ['admin', 'manager', 'agent']
    },
    {
      label: 'Lead Management',
      icon: FileText,
      path: '/dashboard/leads',
      roles: ['admin', 'manager', 'agent']
    },
    {
      label: 'Vendor Orders',
      icon: ShoppingCart,
      path: '/dashboard/orders',
      roles: ['admin', 'manager', 'agent']
    },
    {
      label: 'Sales Management',
      icon: TrendingUp,
      path: '/dashboard/sales',
      roles: ['admin', 'manager']
    },
    {
      label: 'Payment Records',
      icon: CreditCard,
      path: '/dashboard/payments',
      roles: ['admin', 'manager', 'agent']
    },
    {
      label: 'Target Management',
      icon: Target,
      path: '/dashboard/targets',
      roles: ['admin', 'manager']
    },
    {
      label: 'Follow-ups',
      icon: Clock,
      path: '/dashboard/followups',
      roles: ['admin', 'manager', 'agent']
    },
    {
      label: 'Chat System',
      icon: MessageSquare,
      path: '/dashboard/chat',
      roles: ['admin', 'manager', 'agent'],
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    {
      label: 'User Management',
      icon: Users,
      path: '/dashboard/users',
      roles: ['admin', 'manager']
    },
    {
      label: 'Analytics & Reports',
      icon: TrendingUp,
      path: '/dashboard/analytics',
      roles: ['admin', 'manager']
    },
    {
      label: 'Activity History',
      icon: Activity,
      path: '/dashboard/activity',
      roles: ['admin']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Car className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Motortiger</h1>
            <p className="text-sm text-gray-500">CMS</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.path}
              variant={isActive(item.path) ? 'default' : 'ghost'}
              className={`w-full justify-start gap-3 ${
                isActive(item.path) 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => router.push(item.path)}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <Badge className="bg-red-500 text-white text-xs">
                  {item.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
        
        <Button
          variant={pathname === '/dashboard/phone' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => router.push('/dashboard/phone')}
        >
          <Phone className="h-5 w-5" />
          Phone System
        </Button>
      </div>
    </div>
  );
}