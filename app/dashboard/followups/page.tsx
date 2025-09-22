'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  CheckCircle,
  Clock,
  User,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Followup {
  _id: string;
  followupId: string;
  leadNumber: string;
  customerName: string;
  customerEmail: string;
  phoneNumber: string;
  productName?: string;
  salesPrice?: number;
  status: string;
  assignedAgent: {
    name: string;
    email: string;
  };
  dateCreated: string;
  isDone: boolean;
  completedDate?: string;
  completedBy?: {
    name: string;
  };
  notes: string[];
  scheduledDate?: Date;
}

export default function FollowupsPage() {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [doneFilter, setDoneFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFollowup, setSelectedFollowup] = useState<Followup | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completingId, setCompletingId] = useState<string | null>(null);
  const router = useRouter();

  const statusOptions = ['Follow up', 'Desision Follow up', 'Payment Follow up'];

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'Follow up': 'bg-blue-100 text-blue-800',
      'Desision Follow up': 'bg-orange-100 text-orange-800',
      'Payment Follow up': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    loadFollowups();
  }, [currentPage, search, statusFilter, doneFilter]);

  useEffect(() => {
    // Clear pending followup notifications when followups page is opened
    const clearPendingNotifications = () => {
      // This will be handled by the FollowupNotification component
    };
    
    clearPendingNotifications();
  }, []);

  const loadFollowups = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(doneFilter && { isDone: doneFilter })
      });

      const response = await fetch(`/api/followups?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFollowups(data.followups);
        setTotalPages(data.pagination.pages);
      } else {
        console.error('Failed to load followups');
      }
    } catch (error) {
      console.error('Error loading followups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteFollowup = async () => {
    if (!selectedFollowup) return;

    setCompletingId(selectedFollowup._id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/followups/${selectedFollowup._id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: completionNotes })
      });

      if (response.ok) {
        setSelectedFollowup(null);
        setCompletionNotes('');
        loadFollowups();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to complete follow-up');
      }
    } catch (error) {
      console.error('Error completing follow-up:', error);
      alert('Failed to complete follow-up');
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading follow-ups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Follow-up Management</h1>
            <p className="text-gray-600">Track and manage lead follow-ups</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search follow-ups..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <select
              value={doneFilter}
              onChange={(e) => setDoneFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="false">Active</option>
              <option value="true">Completed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Follow-ups Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Follow-ups ({followups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Follow-up ID</TableHead>
                  <TableHead>Lead Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Assigned Agent</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {followups.map((followup) => (
                  <TableRow key={followup._id} className={followup.isDone ? 'opacity-60' : ''}>
                    <TableCell className="font-medium">{followup.followupId}</TableCell>
                    <TableCell>
                      <Button
                        variant="link"
                        className="p-0 h-auto font-medium text-blue-600"
                        onClick={() => router.push(`/dashboard/leads/${followup.leadNumber}`)}
                      >
                        {followup.leadNumber}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{followup.customerName}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {followup.customerEmail}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {followup.phoneNumber}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(followup.status)}>
                        {followup.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-3 w-3 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{followup.assignedAgent?.name}</p>
                          <p className="text-xs text-gray-500">{followup.assignedAgent?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        {new Date(followup.dateCreated).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {followup.isDone ? (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                          {followup.completedDate && (
                            <span className="text-xs text-gray-500">
                              {new Date(followup.completedDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!followup.isDone && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => setSelectedFollowup(followup)}
                              className="flex items-center gap-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Complete
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Complete Follow-up</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-gray-600">
                                  <strong>Customer:</strong> {followup.customerName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <strong>Type:</strong> {followup.status}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <strong>Lead:</strong> {followup.leadNumber}
                                </p>
                                {followup.scheduledDate && (
                                  <p className="text-sm text-gray-600">
                                    <strong>Scheduled:</strong> {new Date(followup.scheduledDate).toLocaleString()}
                                  </p>
                                )}
                              </div>
                              
                              <div>
                                <Label htmlFor="notes">Completion Notes (Optional)</Label>
                                <textarea
                                  id="notes"
                                  value={completionNotes}
                                  onChange={(e) => setCompletionNotes(e.target.value)}
                                  placeholder="Add any notes about this follow-up..."
                                  rows={3}
                                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              <div className="flex justify-end gap-3">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedFollowup(null);
                                    setCompletionNotes('');
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleCompleteFollowup}
                                  disabled={completingId === followup._id}
                                  className="flex items-center gap-2"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  {completingId === followup._id ? 'Completing...' : 'Mark as Done'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      {followup.isDone && followup.completedBy && (
                        <div className="text-xs text-gray-500">
                          Completed by {followup.completedBy.name}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {followups.length === 0 && (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No follow-ups found</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <span className="flex items-center px-4">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}