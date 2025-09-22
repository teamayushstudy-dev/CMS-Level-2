'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, CheckCircle, ExternalLink } from 'lucide-react';

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
  orderConfirmationDate?: string;
  orderStageUpdated: boolean;
  orderStageUpdateDate?: string;
  deliveryConfirmationSent: boolean;
  deliveryConfirmationDate?: string;
  assignedAgent: {
    name: string;
    email: string;
  };
  notes: string[];
  createdAt: string;
}

export default function SaleDetailPage() {
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    if (params.id) {
      loadSale();
    }
  }, [params.id]);

  const loadSale = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/sales/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSale(data.sale);
      } else {
        console.error('Failed to load sale');
        router.push('/dashboard/sales');
      }
    } catch (error) {
      console.error('Error loading sale:', error);
      router.push('/dashboard/sales');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOrderConfirmation = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sales/${params.id}/send-confirmation`, {
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
        loadSale();
      } else {
        alert('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    }
  };

  const handleSendDeliveryConfirmation = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sales/${params.id}/send-delivery`, {
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
        loadSale();
      } else {
        alert('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    }
  };

  const handleUpdateOrderStage = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sales/${params.id}`, {
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
        loadSale();
      } else {
        alert('Failed to update order stage');
      }
    } catch (error) {
      console.error('Error updating order stage:', error);
      alert('Failed to update order stage');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sale details...</p>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Sale not found</p>
          <Button onClick={() => router.push('/dashboard/sales')} className="mt-4">
            Back to Sales
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/sales')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sales
            </Button>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sale Details</h1>
              <p className="text-gray-600">Sale #{sale.saleId}</p>
            </div>
            
            <Button
              onClick={() => window.open('https://webmail.infobirth.com', '_blank')}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <ExternalLink className="h-4 w-4" />
              Open Webmail
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer Name</label>
                    <p className="text-lg font-semibold">{sale.customerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-lg">{sale.customerEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone Number</label>
                    <p className="text-lg">{sale.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(sale.status)}>
                        {sale.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(sale.productName || sale.salesPrice) && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sale.productName && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Product Name</label>
                        <p className="text-lg">{sale.productName}</p>
                      </div>
                    )}
                    {sale.salesPrice && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Sales Price</label>
                        <p className="text-lg font-semibold">${sale.salesPrice.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sales Workflow */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Workflow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Order Confirmation */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      sale.orderConfirmationSent ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {sale.orderConfirmationSent ? <CheckCircle className="h-5 w-5" /> : '1'}
                    </div>
                    <div>
                      <h4 className="font-medium">Send Order Confirmation</h4>
                      <p className="text-sm text-gray-500">
                        {sale.orderConfirmationSent 
                          ? `Sent on ${new Date(sale.orderConfirmationDate!).toLocaleDateString()}`
                          : 'Not sent yet'
                        }
                      </p>
                    </div>
                  </div>
                  {!sale.orderConfirmationSent && (
                    <Button
                      onClick={handleSendOrderConfirmation}
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Send Email
                    </Button>
                  )}
                </div>

                {/* Step 2: Order Stage Update */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      sale.orderStageUpdated ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {sale.orderStageUpdated ? <CheckCircle className="h-5 w-5" /> : '2'}
                    </div>
                    <div>
                      <h4 className="font-medium">Update Order Stage</h4>
                      <p className="text-sm text-gray-500">
                        {sale.orderStageUpdated 
                          ? `Updated on ${new Date(sale.orderStageUpdateDate!).toLocaleDateString()}`
                          : 'Not updated yet'
                        }
                      </p>
                    </div>
                  </div>
                  {!sale.orderStageUpdated && (
                    <Button
                      onClick={handleUpdateOrderStage}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Mark Updated
                    </Button>
                  )}
                </div>

                {/* Step 3: Delivery Confirmation */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      sale.deliveryConfirmationSent ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {sale.deliveryConfirmationSent ? <CheckCircle className="h-5 w-5" /> : '3'}
                    </div>
                    <div>
                      <h4 className="font-medium">Send Delivery Confirmation</h4>
                      <p className="text-sm text-gray-500">
                        {sale.deliveryConfirmationSent 
                          ? `Sent on ${new Date(sale.deliveryConfirmationDate!).toLocaleDateString()}`
                          : 'Not sent yet'
                        }
                      </p>
                    </div>
                  </div>
                  {!sale.deliveryConfirmationSent && (
                    <Button
                      onClick={handleSendDeliveryConfirmation}
                      disabled={!sale.orderStageUpdated}
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Send Email
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sale Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Sale ID</label>
                  <p className="text-sm font-mono">{sale.saleId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created Date</label>
                  <p className="text-sm">{new Date(sale.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned Agent</label>
                  <p className="text-sm">{sale.assignedAgent?.name}</p>
                  <p className="text-xs text-gray-500">{sale.assignedAgent?.email}</p>
                </div>
              </CardContent>
            </Card>

            {sale.notes && sale.notes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sale.notes.map((note, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                        {note}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}