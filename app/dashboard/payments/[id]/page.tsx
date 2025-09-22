'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, CreditCard } from 'lucide-react';

interface PaymentRecord {
  _id: string;
  paymentId: string;
  customerName: string;
  modeOfPayment: string;
  paymentPortal?: string;
  cardNumber?: string;
  expiry?: string;
  paymentDate: string;
  salesPrice: number;
  pendingBalance?: number;
  costPrice?: number;
  totalMargin?: number;
  refunded?: number;
  disputeCategory?: string;
  disputeReason?: string;
  disputeDate?: string;
  disputeResult?: string;
  refundDate?: string;
  refundTAT?: string;
  arn?: string;
  refundCredited?: number;
  chargebackAmount?: number;
  paymentStatus: string;
  leadId?: {
    leadNumber: string;
    customerName: string;
  };
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

export default function PaymentDetailPage() {
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();

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
    if (params.id) {
      loadPayment();
    }
  }, [params.id]);

  const loadPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/payment-records/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPayment(data.payment);
      } else {
        console.error('Failed to load payment');
        router.push('/dashboard/payments');
      }
    } catch (error) {
      console.error('Error loading payment:', error);
      router.push('/dashboard/payments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Payment record not found</p>
          <Button onClick={() => router.push('/dashboard/payments')} className="mt-4">
            Back to Payment Records
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
              onClick={() => router.push('/dashboard/payments')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Payment Records
            </Button>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Record Details</h1>
              <p className="text-gray-600">Payment #{payment.paymentId}</p>
            </div>
            
            <Button
              onClick={() => router.push(`/dashboard/payments/${payment._id}/edit`)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Payment
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer Name</label>
                    <p className="text-lg font-semibold">{payment.customerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(payment.paymentStatus)}>
                        {payment.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mode of Payment</label>
                    <p className="text-lg">{payment.modeOfPayment}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Date</label>
                    <p className="text-lg">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                  </div>
                  {payment.paymentPortal && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Payment Portal</label>
                      <p className="text-lg">{payment.paymentPortal}</p>
                    </div>
                  )}
                  {payment.cardNumber && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Card Number</label>
                      <p className="text-lg font-mono">****-****-****-{payment.cardNumber.slice(-4)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ${payment.salesPrice.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-600">Sales Price</div>
                  </div>
                  {payment.costPrice && (
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        ${payment.costPrice.toLocaleString()}
                      </div>
                      <div className="text-sm text-blue-600">Cost Price</div>
                    </div>
                  )}
                  {payment.totalMargin && (
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        ${payment.totalMargin.toLocaleString()}
                      </div>
                      <div className="text-sm text-purple-600">Total Margin</div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {payment.pendingBalance && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Pending Balance</label>
                      <p className="text-lg font-semibold text-orange-600">
                        ${payment.pendingBalance.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {payment.refunded && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Refunded Amount</label>
                      <p className="text-lg font-semibold text-red-600">
                        ${payment.refunded.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {(payment.disputeCategory || payment.disputeReason) && (
              <Card>
                <CardHeader>
                  <CardTitle>Dispute Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {payment.disputeCategory && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Dispute Category</label>
                        <p className="text-lg">{payment.disputeCategory}</p>
                      </div>
                    )}
                    {payment.disputeReason && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Dispute Reason</label>
                        <p className="text-lg">{payment.disputeReason}</p>
                      </div>
                    )}
                    {payment.disputeDate && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Dispute Date</label>
                        <p className="text-lg">{new Date(payment.disputeDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {payment.disputeResult && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Dispute Result</label>
                        <p className="text-lg">{payment.disputeResult}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment ID</label>
                  <p className="text-sm font-mono">{payment.paymentId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created Date</label>
                  <p className="text-sm">{new Date(payment.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created By</label>
                  <p className="text-sm">{payment.createdBy?.name}</p>
                  <p className="text-xs text-gray-500">{payment.createdBy?.email}</p>
                </div>
                {payment.leadId && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Related Lead</label>
                    <p className="text-sm">{payment.leadId.leadNumber}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {(payment.refundDate || payment.arn || payment.refundCredited) && (
              <Card>
                <CardHeader>
                  <CardTitle>Refund Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {payment.refundDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Refund Date</label>
                      <p className="text-sm">{new Date(payment.refundDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {payment.refundTAT && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Refund TAT</label>
                      <p className="text-sm">{payment.refundTAT}</p>
                    </div>
                  )}
                  {payment.arn && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">ARN</label>
                      <p className="text-sm font-mono">{payment.arn}</p>
                    </div>
                  )}
                  {payment.refundCredited && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Refund Credited</label>
                      <p className="text-sm font-semibold">${payment.refundCredited.toLocaleString()}</p>
                    </div>
                  )}
                  {payment.chargebackAmount && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Chargeback Amount</label>
                      <p className="text-sm font-semibold text-red-600">${payment.chargebackAmount.toLocaleString()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}