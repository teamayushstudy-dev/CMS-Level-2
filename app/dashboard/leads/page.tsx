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
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Save,
  X,
  MessageSquare,
} from 'lucide-react';
import ImportModal from '@/components/ui/import-modal';
import FollowupModal, { FollowupData } from '@/components/ui/followup-modal';
import EnhancedNotesModal from '@/components/ui/enhanced-notes-modal';

import { toast } from 'sonner';
interface Lead {
  _id: string;
  leadId: string;
  leadNumber: string;
  customerName: string;
  description?: string;
  customerEmail: string;
  phoneNumber: string;
  status: string;
  assignedAgent: {
    _id: string;
    name: string;
    email: string;
  };
  products: Array<{
    productName: string;
    productAmount?: number;
    pitchedProductPrice?: number;
    quantity?: number;
  }>;
  salesPrice?: number;
  notes?: Array<{
    _id: string;
    content: string;
    createdAt: string;
    createdBy: {
      name: string;
      email: string;
    };
  }>;
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [editingStatus, setEditingStatus] = useState<{ [key: string]: string }>(
    {}
  );
  const [editingAgent, setEditingAgent] = useState<{ [key: string]: string }>(
    {}
  );
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [selectedLeadForFollowup, setSelectedLeadForFollowup] =
    useState<Lead | null>(null);
  const [selectedFollowupType, setSelectedFollowupType] = useState<string>('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedLeadForNotes, setSelectedLeadForNotes] = useState<Lead | null>(null);
  const router = useRouter();

  const statusOptions = [
    'Follow up',
    'Desision Follow up',
    'Payment Follow up',
    'Wrong Number',
    'Taking Information Only',
    'Not Intrested',
    'Out Of Scope',
    'Incomplete Information',
    'Sourcing',
    'Sale Payment Done',
    'Product Purchased'
  ];

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      New: 'bg-blue-100 text-blue-800',
      Connected: 'bg-green-100 text-green-800',
      Nurturing: 'bg-yellow-100 text-yellow-800',
      'Waiting for respond': 'bg-orange-100 text-orange-800',
      'Customer Waiting for respond': 'bg-purple-100 text-purple-800',
      'Follow up': 'bg-blue-100 text-blue-800',
      'Desision Follow up': 'bg-orange-100 text-orange-800',
      'Payment Follow up': 'bg-purple-100 text-purple-800',
      'Payment Under Process': 'bg-indigo-100 text-indigo-800',
      'Customer making payment': 'bg-pink-100 text-pink-800',
      'Sale Payment Done': 'bg-emerald-100 text-emerald-800',
      'Product Purchased': 'bg-gray-100 text-gray-800',
      'Sourcing': 'bg-cyan-100 text-cyan-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      loadAvailableUsers(user);
    }
    loadLeads();
  }, [currentPage, itemsPerPage, search, statusFilter, agentFilter]);

  const loadAvailableUsers = async (user: User) => {
    try {
      const token = localStorage.getItem('token');

      let url = '/api/users';
      if (user.role === 'manager') {
        url = `/api/users/assignment-options?managerId=${user._id}`;
      } else if (user.role === 'admin') {
        url = '/api/users?role=manager,agent';
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load available users:', error);
    }
  };

  const loadLeads = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(agentFilter && { agent: agentFilter }),
      });

      const response = await fetch(`/api/leads?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads);
        setTotalPages(data.pagination.pages);
      } else {
        console.error('Failed to load leads');
      }
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusEdit = (leadId: string, currentStatus: string) => {
    setEditingStatus({ [leadId]: currentStatus });
  };

  const handleAgentEdit = (leadId: string, currentAgentId: string) => {
    setEditingAgent({ [leadId]: currentAgentId });
  };

  const handleStatusSave = async (leadId: string) => {
    const newStatus = editingStatus[leadId];
    if (!newStatus) return;

    // Check if it's a follow-up status
    const followupStatuses = [
      'Follow up',
      'Desision Follow up',
      'Payment Follow up',
    ];
    if (followupStatuses.includes(newStatus)) {
      const lead = leads.find((l) => l._id === leadId);
      if (lead) {
        setSelectedLeadForFollowup(lead);
        setSelectedFollowupType(newStatus);
        setShowFollowupModal(true);
        return;
      }
    }

    await updateLeadStatus(leadId, newStatus);
  };

  const updateLeadStatus = async (leadId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setEditingStatus({});
        loadLeads();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleFollowupSchedule = async (followupData: FollowupData) => {
    if (!selectedLeadForFollowup) return;

    try {
      const token = localStorage.getItem('token');

      // First update the lead status
      await updateLeadStatus(selectedLeadForFollowup._id, selectedFollowupType);

      // Then schedule the follow-up
      const response = await fetch(
        `/api/leads/${selectedLeadForFollowup._id}/schedule-followup`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            followupType: selectedFollowupType,
            followupDate: followupData.followupDate,
            followupTime: followupData.followupTime,
            notes: followupData.notes,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert(
          `Follow-up scheduled successfully for ${new Date(
            `${followupData.followupDate}T${followupData.followupTime}`
          ).toLocaleString()}`
        );
        loadLeads();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to schedule follow-up');
      }
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      alert('Failed to schedule follow-up');
    }
  };

  const handleAgentSave = async (leadId: string) => {
    const newAgentId = editingAgent[leadId];
    if (!newAgentId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignedAgent: newAgentId }),
      });

      if (response.ok) {
        setEditingAgent({});
        loadLeads();
      } else {
        alert('Failed to update assigned agent');
      }
    } catch (error) {
      console.error('Error updating assigned agent:', error);
      alert('Failed to update assigned agent');
    }
  };

  const handleCancel = (leadId: string, type: 'status' | 'agent') => {
    if (type === 'status') {
      setEditingStatus({});
    } else {
      setEditingAgent({});
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ module: 'leads', format: 'excel' }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads_export_${
          new Date().toISOString().split('T')[0]
        }.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadLeads();
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leads...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">
              Lead Management
            </h1>
            <p className="text-gray-600">
              Manage and track your sales leads with multiple products
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>

            <Button
              onClick={() => router.push('/dashboard/leads/new')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, email, phone, lead number, product, make, model, year, payment mode, state..."
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
              <option value="">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Agents</option>
              {availableUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name}
                </option>
              ))}
            </select>

            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ({leads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Agent</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow 
                    key={lead._id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/dashboard/leads/${lead._id}`)}
                  >
                    <TableCell 
                      className="font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        <span>{lead.leadNumber}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/leads/${lead._id}`)}
                            className="h-6 w-6 p-0"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/leads/${lead._id}/edit`)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {currentUser?.role === 'admin' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(lead._id)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead.customerName}</p>
                        <p className="text-sm text-gray-500">
                          {lead.customerEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{lead.phoneNumber}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {lead.products && lead.products.length > 0 ? (
                          <div>
                            <p className="font-medium">
                              {lead.products.length} product(s)
                            </p>
                            <p className="text-gray-500">
                              {lead.products
                                .slice(0, 2)
                                .map((p) => p.productName)
                                .filter(Boolean)
                                .join(', ')}
                              {lead.products.length > 2 && '...'}
                            </p>
                            {lead.products.some(p => p.pitchedProductPrice) && (
                              <p className="text-xs text-blue-600">
                              Pitched: ${lead.products.reduce((sum, p) => sum + (p.pitchedProductPrice || 0), 0).toLocaleString()}
                            </p>
                            )}
                            {lead.products.some(p => p.productAmount) && (
                              <p className="text-xs text-green-600">
                                Price: ${lead.products.reduce((sum, p) => sum + (p.productAmount || 0), 0).toLocaleString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No products</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.salesPrice
                        ? `$${lead.salesPrice.toLocaleString()}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {editingStatus[lead._id] !== undefined ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editingStatus[lead._id]}
                            onChange={(e) =>
                              setEditingStatus({ [lead._id]: e.target.value })
                            }
                            className="text-xs px-2 py-1 border rounded"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            onClick={() => handleStatusSave(lead._id)}
                            className="h-6 w-6 p-0"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancel(lead._id, 'status')}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Badge
                          className={`${getStatusColor(
                            lead.status
                          )} cursor-pointer hover:opacity-80`}
                          onClick={() =>
                            handleStatusEdit(lead._id, lead.status)
                          }
                        >
                          {lead.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingAgent[lead._id] !== undefined ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editingAgent[lead._id]}
                            onChange={(e) =>
                              setEditingAgent({ [lead._id]: e.target.value })
                            }
                            className="text-xs px-2 py-1 border rounded min-w-[120px]"
                          >
                            <option value={lead.assignedAgent._id}>
                              {lead.assignedAgent.name}
                            </option>
                            {availableUsers
                              .filter(
                                (user) => user._id !== lead.assignedAgent._id
                              )
                              .map((user) => (
                                <option key={user._id} value={user._id}>
                                  {user.name}
                                </option>
                              ))}
                          </select>
                          <Button
                            size="sm"
                            onClick={() => handleAgentSave(lead._id)}
                            className="h-6 w-6 p-0"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancel(lead._id, 'agent')}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-gray-50 p-1 rounded"
                          onClick={() =>
                            handleAgentEdit(lead._id, lead.assignedAgent._id)
                          }
                        >
                          <p className="text-sm font-medium">
                            {lead.assignedAgent?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {lead.assignedAgent?.email}
                          </p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLeadForNotes(lead);
                          setShowNotesModal(true);
                        }}
                        className="flex items-center gap-1"
                      >
                        <MessageSquare className="h-3 w-3" />
                        Notes ({lead.notes?.length || 0})
                      </Button>
                    </TableCell>
                    <TableCell>
                      {/* Actions moved to Lead Number column */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              <span className="flex items-center px-4">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        module="leads"
        onImportComplete={loadLeads}
      />

      <FollowupModal
        isOpen={showFollowupModal}
        onClose={() => {
          setShowFollowupModal(false);
          setSelectedLeadForFollowup(null);
          setSelectedFollowupType('');
        }}
        onSchedule={handleFollowupSchedule}
        leadData={{
          customerName: selectedLeadForFollowup?.customerName || '',
          leadNumber: selectedLeadForFollowup?.leadNumber || '',
        }}
        followupType={selectedFollowupType}
      />

      {/* Notes Modal */}
      <EnhancedNotesModal
        isOpen={showNotesModal}
        onClose={() => {
          setShowNotesModal(false);
          setSelectedLeadForNotes(null);
        }}
        lead={selectedLeadForNotes}
        onUpdate={loadLeads}
      />
    </div>
  );
}