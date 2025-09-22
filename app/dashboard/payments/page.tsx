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
  Download, 
  Upload,
  Eye,
  Edit,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import ImportModal from '@/components/ui/import-modal';

interface PaymentRecord {
  _id: string;
  paymentId: string;
  customerName: string;
  customerPhone?: string;
  alternateNumber?: string;
  customerEmail?: string;
  modeOfPayment: string;
  paymentPortal?: string;
  paymentDate: string;
  salesPrice: number;
  paymentStatus: string;
  totalMargin?: number;
  pendingBalance?: number;
  refunded?: number;
  refundCredited?: number;
  chargebackAmount?: number;
  createdAt: string;
}

export default function PaymentRecordsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  const statusOptions = ['pending', 'completed', 'failed', 'refunded', 'disputed'];

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'refunded': 'bg-blue-100 text-blue-800',
      'disputed': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    loadPayments();
  }, [currentPage, search, statusFilter]);

  const loadPayments = async () => {
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
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/payment-records?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments);
        setTotalPages(data.pagination.pages);
      } else {
        console.error('Failed to load payments');
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ module: 'payment_records', format: 'excel' })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment_records_export_${new Date().toISOString().split('T')[0]}.xlsx`;
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
    if (!confirm('Are you sure you want to delete this payment record?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/payment-records/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        loadPayments();
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
          <p className="text-gray-600">Loading payment records...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Payment Record Management</h1>
              <p className="text-gray-600">Manage payment records and track transactions</p>
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
                onClick={() => router.push('/dashboard/payments/new')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Payment
              </Button>
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
                    placeholder="Search payments..."
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
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Records ({payments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead>Portal</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Refunded</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell className="font-medium">{payment.paymentId}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.customerName}</p>
                          {payment.customerEmail && (
                            <p className="text-sm text-gray-500">{payment.customerEmail}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {payment.customerPhone && (
                            <p className="text-sm">{payment.customerPhone}</p>
                          )}
                          {payment.alternateNumber && (
                            <p className="text-xs text-gray-500">{payment.alternateNumber}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{payment.modeOfPayment}</TableCell>
                      <TableCell>{payment.paymentPortal || 'N/A'}</TableCell>
                      <TableCell>${payment.salesPrice.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.paymentStatus)}>
                          {payment.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.totalMargin ? (
                          <span className={payment.totalMargin >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ${payment.totalMargin.toLocaleString()}
                          </span>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {payment.pendingBalance ? (
                          <span className="text-orange-600">
                            ${payment.pendingBalance.toLocaleString()}
                          </span>
                        ) : '$0'}
                      </TableCell>
                      <TableCell>
                        <div>
                          {payment.refunded ? (
                            <p className="text-red-600">${payment.refunded.toLocaleString()}</p>
                          ) : (
                            <p>$0</p>
                          )}
                          {payment.refundCredited && (
                            <p className="text-xs text-blue-600">
                              Credited: ${payment.refundCredited.toLocaleString()}
                            </p>
                          )}
                          {payment.chargebackAmount && (
                            <p className="text-xs text-red-600">
                              Chargeback: ${payment.chargebackAmount.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/payments/${payment._id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/payments/${payment._id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(payment._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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

        <ImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          module="payment_records"
          onImportComplete={loadPayments}
        />
    </div>
  );
}