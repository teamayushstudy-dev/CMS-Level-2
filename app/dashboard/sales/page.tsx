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
  Download, 
  Eye,
  Mail,
  CheckCircle,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';

interface Sale {
  _id: string;
  saleId: string;
  customerName: string;
  customerEmail: string;
  phoneNumber: string;
  productName?: string;
  salesPrice?: number;
  status: string;
  orderConfirmationSent: boolean;
  orderStageUpdated: boolean;
  deliveryConfirmationSent: boolean;
  assignedAgent: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  const statusOptions = ['pending', 'in_progress', 'completed'];

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    loadSales();
  }, [currentPage, search, statusFilter]);

  const loadSales = async () => {
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

      const response = await fetch(`/api/sales?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSales(data.sales);
        setTotalPages(data.pagination.pages);
      } else {
        console.error('Failed to load sales');
      }
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOrderConfirmation = async (saleId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sales/${saleId}/send-confirmation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert('Order confirmation email sent successfully!');
        if (data.redirectUrl) {
          window.open(data.redirectUrl, '_blank');
        }
        loadSales();
      } else {
        alert('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    }
  };

  const handleSendDeliveryConfirmation = async (saleId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sales/${saleId}/send-delivery`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert('Delivery confirmation email sent successfully!');
        if (data.redirectUrl) {
          window.open(data.redirectUrl, '_blank');
        }
        loadSales();
      } else {
        alert('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    }
  };

  const handleUpdateOrderStage = async (saleId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sales/${saleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderStageUpdated: true,
          orderStageUpdateDate: new Date(),
          status: 'in_progress'
        })
      });

      if (response.ok) {
        alert('Order stage updated successfully!');
        loadSales();
      } else {
        alert('Failed to update order stage');
      }
    } catch (error) {
      console.error('Error updating order stage:', error);
      alert('Failed to update order stage');
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
        body: JSON.stringify({ module: 'sales', format: 'excel' })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sales...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Sales Management</h1>
              <p className="text-gray-600">Manage sales workflow and customer communications</p>
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
                onClick={() => window.open('https://webmail.infobirth.com', '_blank')}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <ExternalLink className="h-4 w-4" />
                Open Webmail
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
                    placeholder="Search sales..."
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

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sales ({sales.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead>Payment Info</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order Confirmation</TableHead>
                    <TableHead>Stage Updated</TableHead>
                    <TableHead>Delivery Confirmation</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale._id}>
                      <TableCell className="font-medium">{sale.saleId}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sale.customerName}</p>
                          <p className="text-sm text-gray-500">{sale.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{sale.phoneNumber}</p>
                          {sale.alternateNumber && (
                            <p className="text-xs text-gray-500">{sale.alternateNumber}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{sale.productName || 'N/A'}</TableCell>
                      <TableCell>
                        {sale.salesPrice ? `$${sale.salesPrice.toLocaleString()}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {sale.totalMargin ? (
                          <span className={sale.totalMargin >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ${sale.totalMargin.toLocaleString()}
                          </span>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {sale.modeOfPayment && (
                            <p>{sale.modeOfPayment}</p>
                          )}
                          {sale.paymentPortal && (
                            <p className="text-gray-500">{sale.paymentPortal}</p>
                          )}
                          {sale.paymentDate && (
                            <p className="text-xs text-gray-500">
                              {new Date(sale.paymentDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(sale.status)}>
                          {sale.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sale.orderConfirmationSent ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Sent
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleSendOrderConfirmation(sale._id)}
                            className="flex items-center gap-1"
                          >
                            <Mail className="h-3 w-3" />
                            Send
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        {sale.orderStageUpdated ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Updated
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateOrderStage(sale._id)}
                            className="flex items-center gap-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Update
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        {sale.deliveryConfirmationSent ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Sent
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleSendDeliveryConfirmation(sale._id)}
                            className="flex items-center gap-1"
                            disabled={!sale.orderStageUpdated}
                          >
                            <Mail className="h-3 w-3" />
                            Send
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/sales/${sale._id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
    </div>
  );
}