'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  ShoppingCart, 
  CreditCard, 
  Activity,
  TrendingUp,
  Target,
  MessageSquare,
  Plus
} from 'lucide-react';
import NotesModal from '@/components/ui/notes-modal';

interface DashboardStats {
  totalLeads: number;
  activeLeads: number;
  totalSales: number;
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalPayments: number;
  completedPayments: number;
}

interface RecentNote {
  _id: string;
  content: string;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
  leadNumber: string;
  customerName: string;
  leadId: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentNotes, setRecentNotes] = useState<RecentNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    loadDashboardStats();
    loadRecentNotes();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentNotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notes/recent', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecentNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Failed to load recent notes:', error);
    }
  };

  const handleCardClick = (path: string) => {
    router.push(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="text-gray-600">
              Here's an overview of your auto parts management system.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Role: {user?.role}</p>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleCardClick('/dashboard/leads')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalLeads}</div>
              <p className="text-sm text-blue-600">{stats.activeLeads} active</p>
            </CardContent>
          </Card>

          <Card 
            className="border-l-4 border-l-green-500 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleCardClick('/dashboard/sales')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalSales}</div>
              <p className="text-sm text-green-600">${stats.totalRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card 
            className="border-l-4 border-l-orange-500 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleCardClick('/dashboard/orders')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Vendor Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
              <p className="text-sm text-orange-600">{stats.pendingOrders} pending</p>
            </CardContent>
          </Card>

          <Card 
            className="border-l-4 border-l-purple-500 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleCardClick('/dashboard/payments')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalPayments}</div>
              <p className="text-sm text-purple-600">{stats.completedPayments} completed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity and Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New lead created</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Order status updated</p>
                  <p className="text-xs text-gray-500">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Payment processed</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Notes
              </div>
              <Button
                size="sm"
                onClick={() => setShowNotesModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Note
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {recentNotes.length > 0 ? (
                recentNotes.map((note, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-medium text-blue-600">
                        {note.leadNumber}
                      </p>
                      <span className="text-xs text-gray-500">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{note.content}</p>
                    <p className="text-xs text-gray-500">
                      by {note.createdBy?.name} • {note.customerName}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent notes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Add Notes Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setShowNotesModal(true)}
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg flex items-center justify-center"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Notes Modal */}
      <NotesModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        onNoteAdded={loadRecentNotes}
      />
    </div>
  );
}