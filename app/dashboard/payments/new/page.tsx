'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';

interface Lead {
  _id: string;
  customerName: string;
  customerEmail: string;
  phoneNumber: string;
  salesPrice?: number;
}

export default function NewPaymentRecordPage() {
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    leadId: '',
    customerName: '',
    modeOfPayment: '',
    paymentPortal: '',
    cardNumber: '',
    expiry: '',
    paymentDate: '',
    salesPrice: '',
    pendingBalance: '',
    costPrice: '',
    refunded: '',
    disputeCategory: '',
    disputeReason: '',
    disputeDate: '',
    disputeResult: '',
    refundDate: '',
    refundTAT: '',
    arn: '',
    refundCredited: '',
    chargebackAmount: '',
    paymentStatus: 'pending'
  });
  const router = useRouter();

  const paymentPortalOptions = ['EasyPayDirect', 'Authorize.net'];
  const statusOptions = ['pending', 'completed', 'failed', 'refunded', 'disputed'];

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/leads', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads);
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
    }
  };

  const handleLeadSelect = (leadId: string) => {
    const lead = leads.find(l => l._id === leadId);
    if (lead) {
      setSelectedLead(lead);
      setFormData(prev => ({
        ...prev,
        leadId: lead._id,
        customerName: lead.customerName,
        salesPrice: lead.salesPrice?.toString() || ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payment-records', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          salesPrice: formData.salesPrice ? parseFloat(formData.salesPrice) : undefined,
          pendingBalance: formData.pendingBalance ? parseFloat(formData.pendingBalance) : undefined,
          costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
          refunded: formData.refunded ? parseFloat(formData.refunded) : undefined,
          refundCredited: formData.refundCredited ? parseFloat(formData.refundCredited) : undefined,
          chargebackAmount: formData.chargebackAmount ? parseFloat(formData.chargebackAmount) : undefined
        })
      });

      if (response.ok) {
        router.push('/dashboard/payments');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create payment record');
      }
    } catch (error) {
      console.error('Error creating payment record:', error);
      alert('Failed to create payment record');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

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
          
          <h1 className="text-3xl font-bold text-gray-900">Create New Payment Record</h1>
          <p className="text-gray-600">Add a new payment record to the system</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="leadSelect">Select Customer (from Leads)</Label>
                  <select
                    id="leadSelect"
                    onChange={(e) => handleLeadSelect(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a customer...</option>
                    {leads.map(lead => (
                      <option key={lead._id} value={lead._id}>
                        {lead.customerName} - {lead.customerEmail}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    required
                    className="mt-1"
                    readOnly={!!selectedLead}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="modeOfPayment">Mode of Payment *</Label>
                  <Input
                    id="modeOfPayment"
                    name="modeOfPayment"
                    value={formData.modeOfPayment}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="paymentPortal">Payment Portal</Label>
                  <select
                    id="paymentPortal"
                    name="paymentPortal"
                    value={formData.paymentPortal}
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
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <select
                    id="paymentStatus"
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="expiry">Expiry</Label>
                  <Input
                    id="expiry"
                    name="expiry"
                    value={formData.expiry}
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
                    value={formData.paymentDate}
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
                    value={formData.salesPrice}
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
                    value={formData.costPrice}
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
                    value={formData.pendingBalance}
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
                    value={formData.refunded}
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
                    value={formData.refundCredited}
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
                    value={formData.chargebackAmount}
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
                    value={formData.disputeCategory}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="disputeReason">Dispute Reason</Label>
                  <Input
                    id="disputeReason"
                    name="disputeReason"
                    value={formData.disputeReason}
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
                    value={formData.disputeDate}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="disputeResult">Dispute Result</Label>
                  <Input
                    id="disputeResult"
                    name="disputeResult"
                    value={formData.disputeResult}
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
                    value={formData.refundDate}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="refundTAT">Refund TAT</Label>
                  <Input
                    id="refundTAT"
                    name="refundTAT"
                    value={formData.refundTAT}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="arn">ARN</Label>
                  <Input
                    id="arn"
                    name="arn"
                    value={formData.arn}
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
              onClick={() => router.push('/dashboard/payments')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Creating...' : 'Create Payment Record'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}