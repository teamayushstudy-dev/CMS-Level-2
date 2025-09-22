'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';

interface PaymentRecord {
  _id: string;
  customerName: string;
  modeOfPayment: string;
  paymentPortal?: string;
  cardNumber?: string;
  expiry?: string;
  paymentDate: string;
  salesPrice: number;
  pendingBalance?: number;
  costPrice?: number;
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
}

export default function EditPaymentRecordPage() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState<Partial<PaymentRecord>>({});
  const router = useRouter();
  const params = useParams();

  const paymentPortalOptions = ['EasyPayDirect', 'Authorize.net'];
  const statusOptions = ['pending', 'completed', 'failed', 'refunded', 'disputed'];

  useEffect(() => {
    if (params.id) {
      loadPayment();
    }
  }, [params.id]);

  const loadPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/payment-records/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...data.payment,
          paymentDate: new Date(data.payment.paymentDate).toISOString().split('T')[0],
          disputeDate: data.payment.disputeDate ? new Date(data.payment.disputeDate).toISOString().split('T')[0] : '',
          refundDate: data.payment.refundDate ? new Date(data.payment.refundDate).toISOString().split('T')[0] : ''
        });
      } else {
        console.error('Failed to load payment');
        router.push('/dashboard/payments');
      }
    } catch (error) {
      console.error('Error loading payment:', error);
      router.push('/dashboard/payments');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/payment-records/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        router.push(`/dashboard/payments/${params.id}`);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update payment record');
      }
    } catch (error) {
      console.error('Error updating payment record:', error);
      alert('Failed to update payment record');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : value
    }));
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment data...</p>
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
              onClick={() => router.push(`/dashboard/payments/${params.id}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Payment
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">Edit Payment Record</h1>
          <p className="text-gray-600">Update payment record information</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    value={formData.customerName || ''}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="modeOfPayment">Mode of Payment *</Label>
                  <Input
                    id="modeOfPayment"
                    name="modeOfPayment"
                    value={formData.modeOfPayment || ''}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <select
                    id="paymentStatus"
                    name="paymentStatus"
                    value={formData.paymentStatus || ''}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="paymentPortal">Payment Portal</Label>
                  <select
                    id="paymentPortal"
                    name="paymentPortal"
                    value={formData.paymentPortal || ''}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Portal</option>
                    {paymentPortalOptions.map(portal => (
                      <option key={portal} value={portal}>{portal}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    value={formData.cardNumber || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="expiry">Expiry</Label>
                  <Input
                    id="expiry"
                    name="expiry"
                    value={formData.expiry || ''}
                    onChange={handleChange}
                    placeholder="MM/YY"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="paymentDate">Payment Date *</Label>
                  <Input
                    id="paymentDate"
                    name="paymentDate"
                    type="date"
                    value={formData.paymentDate || ''}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="salesPrice">Sales Price *</Label>
                  <Input
                    id="salesPrice"
                    name="salesPrice"
                    type="number"
                    step="0.01"
                    value={formData.salesPrice || ''}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="costPrice">Cost Price</Label>
                  <Input
                    id="costPrice"
                    name="costPrice"
                    type="number"
                    step="0.01"
                    value={formData.costPrice || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="pendingBalance">Pending Balance</Label>
                  <Input
                    id="pendingBalance"
                    name="pendingBalance"
                    type="number"
                    step="0.01"
                    value={formData.pendingBalance || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="refunded">Refunded</Label>
                  <Input
                    id="refunded"
                    name="refunded"
                    type="number"
                    step="0.01"
                    value={formData.refunded || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="refundCredited">Refund Credited</Label>
                  <Input
                    id="refundCredited"
                    name="refundCredited"
                    type="number"
                    step="0.01"
                    value={formData.refundCredited || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="chargebackAmount">Chargeback Amount</Label>
                  <Input
                    id="chargebackAmount"
                    name="chargebackAmount"
                    type="number"
                    step="0.01"
                    value={formData.chargebackAmount || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dispute Information */}
          <Card>
            <CardHeader>
              <CardTitle>Dispute Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="disputeCategory">Dispute Category</Label>
                  <Input
                    id="disputeCategory"
                    name="disputeCategory"
                    value={formData.disputeCategory || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="disputeReason">Dispute Reason</Label>
                  <Input
                    id="disputeReason"
                    name="disputeReason"
                    value={formData.disputeReason || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="disputeDate">Dispute Date</Label>
                  <Input
                    id="disputeDate"
                    name="disputeDate"
                    type="date"
                    value={formData.disputeDate || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="disputeResult">Dispute Result</Label>
                  <Input
                    id="disputeResult"
                    name="disputeResult"
                    value={formData.disputeResult || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="refundDate">Refund Date</Label>
                  <Input
                    id="refundDate"
                    name="refundDate"
                    type="date"
                    value={formData.refundDate || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="refundTAT">Refund TAT</Label>
                  <Input
                    id="refundTAT"
                    name="refundTAT"
                    value={formData.refundTAT || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="arn">ARN</Label>
                  <Input
                    id="arn"
                    name="arn"
                    value={formData.arn || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/payments/${params.id}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Updating...' : 'Update Payment Record'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}