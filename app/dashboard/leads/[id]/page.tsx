'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Edit,
  User,
  Calendar,
  Package,
  CreditCard,
} from 'lucide-react';
import NotesSection from '@/components/ui/notes-section';

interface Lead {
  _id: string;
  leadId: string;
  leadNumber: string;
  customerName: string;
  description?: string;
  customerEmail: string;
  phoneNumber: string;
  alternateNumber?: string;
  status: string;
  assignedAgent: {
    _id: string;
    name: string;
    email: string;
  };
  sameShippingInfo?: boolean;
  billingInfo?: {
    firstName?: string;
    lastName?: string;
    fullAddress?: string;
    addressType?: string;
    country?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
  };
  shippingInfo?: {
    firstName?: string;
    lastName?: string;
    fullAddress?: string;
    addressType?: string;
    country?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
  };
  products: Array<{
    productId: string;
    productType: 'engine' | 'transmission' | 'part';
    productName: string;
    pitchedProductPrice?: number;
    productAmount?: number;
    quantity?: number;
    yearOfMfg?: string;
    make?: string;
    model?: string;
    trim?: string;
    engineSize?: string;
    partType?: 'used' | 'new';
    partNumber?: string;
    vin?: string;
    vendorInfo?: {
      shopName?: string;
      address?: string;
      modeOfPayment?: string;
      dateOfBooking?: string;
      dateOfDelivery?: string;
      trackingNumber?: string;
      shippingCompany?: string;
      proofOfDelivery?: string;
    };
  }>;
  // Payment fields
  modeOfPayment?: string;
  paymentPortal?: string;
  cardNumber?: string;
  expiry?: string;
  paymentDate?: string;
  salesPrice?: number;
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
  notes: any[];
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

export default function LeadDetailPage() {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<any[]>([]);
  const router = useRouter();
  const params = useParams();

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      New: 'bg-blue-100 text-blue-800',
      Connected: 'bg-green-100 text-green-800',
      Nurturing: 'bg-yellow-100 text-yellow-800',
      'Waiting for respond': 'bg-orange-100 text-orange-800',
      'Customer Waiting for respond': 'bg-purple-100 text-purple-800',
      'Follow up': 'bg-cyan-100 text-cyan-800',
      'Desision Follow up': 'bg-rose-100 text-rose-800',
      'Payment Follow up': 'bg-fuchsia-100 text-fuchsia-800',
      'Payment Under Process': 'bg-indigo-100 text-indigo-800',
      'Customer making payment': 'bg-pink-100 text-pink-800',
      'Wrong Number': 'bg-red-100 text-red-800',
      'Taking Information Only': 'bg-lime-100 text-lime-800',
      'Not Intrested': 'bg-gray-100 text-gray-800',
      'Out Of Scope': 'bg-slate-100 text-slate-800',
      'Trust Issues': 'bg-zinc-100 text-zinc-800',
      'Voice mail': 'bg-violet-100 text-violet-800',
      'Incomplete Information': 'bg-red-200 text-red-900',
      'Sale Payment Done': 'bg-emerald-100 text-emerald-800',
      'Product Purchased': 'bg-neutral-100 text-neutral-800',
      'Sourcing': 'bg-cyan-100 text-cyan-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    if (params.id) {
      loadLead();
    }
  }, [params.id]);

  const loadLead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/leads/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLead(data.lead);
        setNotes(data.lead.notes || []);
      } else {
        console.error('Failed to load lead');
        router.push('/dashboard/leads');
      }
    } catch (error) {
      console.error('Error loading lead:', error);
      router.push('/dashboard/leads');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Lead not found</p>
          <Button
            onClick={() => router.push('/dashboard/leads')}
            className="mt-4"
          >
            Back to Leads
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
              onClick={() => router.push('/dashboard/leads')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Leads
            </Button>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lead Details</h1>
              <p className="text-gray-600">Lead #{lead.leadNumber}</p>
            </div>

            <Button
              onClick={() => router.push(`/dashboard/leads/${lead._id}/edit`)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Lead
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Customer Name
                    </label>
                    <p className="text-lg font-semibold">{lead.customerName}</p>
                  </div>
                  {lead.description && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">
                        Description
                      </label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {lead.description}
                        </p>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Email
                    </label>
                    <p className="text-lg">{lead.customerEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Phone Number
                    </label>
                    <p className="text-lg">{lead.phoneNumber}</p>
                  </div>
                  {lead.alternateNumber && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Alternate Number
                      </label>
                      <p className="text-lg">{lead.alternateNumber}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Status
                    </label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Assigned Agent
                    </label>
                    <p className="text-lg">{lead.assignedAgent?.name}</p>
                    <p className="text-sm text-gray-500">
                      {lead.assignedAgent?.email}
                    </p>
                  </div>
                  {lead.alternateNumber && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Alternate Number
                      </label>
                      <p className="text-lg">{lead.alternateNumber}</p>
                    </div>
                  )}
                </div>

                {/* Billing Information */}
                {lead.billingInfo && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-lg font-medium mb-4">
                      Billing Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {lead.billingInfo.firstName && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            First Name
                          </label>
                          <p className="text-sm">
                            {lead.billingInfo.firstName}
                          </p>
                        </div>
                      )}
                      {lead.billingInfo.lastName && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Last Name
                          </label>
                          <p className="text-sm">{lead.billingInfo.lastName}</p>
                        </div>
                      )}
                      {lead.billingInfo.fullAddress && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Full Address
                          </label>
                          <p className="text-sm">
                            {lead.billingInfo.fullAddress}
                          </p>
                        </div>
                      )}
                      {lead.billingInfo.addressType && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Address Type
                          </label>
                          <p className="text-sm capitalize">
                            {lead.billingInfo.addressType}
                          </p>
                        </div>
                      )}
                      {lead.billingInfo.country && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Country
                          </label>
                          <p className="text-sm">{lead.billingInfo.country}</p>
                        </div>
                      )}
                      {lead.billingInfo.state && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            State
                          </label>
                          <p className="text-sm">{lead.billingInfo.state}</p>
                        </div>
                      )}
                      {lead.billingInfo.zipCode && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Zip Code
                          </label>
                          <p className="text-sm">{lead.billingInfo.zipCode}</p>
                        </div>
                      )}
                      {lead.billingInfo.phone && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Phone
                          </label>
                          <p className="text-sm">{lead.billingInfo.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Shipping Information */}
                {lead.shippingInfo && !lead.sameShippingInfo && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-lg font-medium mb-4">
                      Shipping Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {lead.shippingInfo.firstName && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            First Name
                          </label>
                          <p className="text-sm">
                            {lead.shippingInfo.firstName}
                          </p>
                        </div>
                      )}
                      {lead.shippingInfo.lastName && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Last Name
                          </label>
                          <p className="text-sm">
                            {lead.shippingInfo.lastName}
                          </p>
                        </div>
                      )}
                      {lead.shippingInfo.fullAddress && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Full Address
                          </label>
                          <p className="text-sm">
                            {lead.shippingInfo.fullAddress}
                          </p>
                        </div>
                      )}
                      {lead.shippingInfo.addressType && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Address Type
                          </label>
                          <p className="text-sm capitalize">
                            {lead.shippingInfo.addressType}
                          </p>
                        </div>
                      )}
                      {lead.shippingInfo.country && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Country
                          </label>
                          <p className="text-sm">{lead.shippingInfo.country}</p>
                        </div>
                      )}
                      {lead.shippingInfo.state && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            State
                          </label>
                          <p className="text-sm">{lead.shippingInfo.state}</p>
                        </div>
                      )}
                      {lead.shippingInfo.zipCode && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Zip Code
                          </label>
                          <p className="text-sm">{lead.shippingInfo.zipCode}</p>
                        </div>
                      )}
                      {lead.shippingInfo.phone && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Phone
                          </label>
                          <p className="text-sm">{lead.shippingInfo.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {lead.sameShippingInfo && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Note:</strong> Shipping information is same as
                        billing information
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes Section */}
            <NotesSection
              leadId={lead._id}
              notes={notes}
              onNoteAdded={(note) => setNotes((prev) => [...prev, note])}
            />

            {/* Products Information */}
            {lead.products && lead.products.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Products ({lead.products.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lead.products.map((product, index) => (
                    <div
                      key={product.productId}
                      className="border rounded-lg p-4"
                    >
                      <h4 className="font-semibold mb-3">
                        Product {index + 1}
                        {product.productName ? `: ${product.productName}` : ''}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Product Type
                          </label>
                          <p className="text-sm capitalize">
                            {product.productType}
                          </p>
                        </div>
                        {product.pitchedProductPrice && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Pitched Product Price
                            </label>
                            <p className="text-sm">
                              ${product.pitchedProductPrice.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {product.productAmount && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Product Price
                            </label>
                            <p className="text-sm">
                              ${product.productAmount.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {product.quantity && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Quantity
                            </label>
                            <p className="text-sm">{product.quantity}</p>
                          </div>
                        )}
                        {product.yearOfMfg && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Year
                            </label>
                            <p className="text-sm">{product.yearOfMfg}</p>
                          </div>
                        )}
                        {product.make && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Make
                            </label>
                            <p className="text-sm">{product.make}</p>
                          </div>
                        )}
                        {product.model && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Model
                            </label>
                            <p className="text-sm">{product.model}</p>
                          </div>
                        )}
                        {product.trim && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Trim
                            </label>
                            <p className="text-sm">{product.trim}</p>
                          </div>
                        )}
                        {product.engineSize && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Engine Size
                            </label>
                            <p className="text-sm">{product.engineSize}</p>
                          </div>
                        )}
                        {product.partType && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Part Type
                            </label>
                            <p className="text-sm capitalize">
                              {product.partType}
                            </p>
                          </div>
                        )}
                        {product.partNumber && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Part Number
                            </label>
                            <p className="text-sm">{product.partNumber}</p>
                          </div>
                        )}
                        {product.vin && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              VIN
                            </label>
                            <p className="text-sm font-mono">{product.vin}</p>
                          </div>
                        )}
                      </div>

                      {/* Vendor Information */}
                      {product.vendorInfo &&
                        (product.vendorInfo.shopName ||
                          product.vendorInfo.address) && (
                          <div className="mt-4 pt-4 border-t">
                            <h5 className="font-medium mb-2 text-gray-700">
                              Vendor Information
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {product.vendorInfo.shopName && (
                                <div>
                                  <label className="text-xs font-medium text-gray-500">
                                    Shop/Vendor Name
                                  </label>
                                  <p className="text-sm">
                                    {product.vendorInfo.shopName}
                                  </p>
                                </div>
                              )}
                              {product.vendorInfo.address && (
                                <div>
                                  <label className="text-xs font-medium text-gray-500">
                                    Address
                                  </label>
                                  <p className="text-sm">
                                    {product.vendorInfo.address}
                                  </p>
                                </div>
                              )}
                              {product.vendorInfo.modeOfPayment && (
                                <div>
                                  <label className="text-xs font-medium text-gray-500">
                                    Mode of Payment
                                  </label>
                                  <p className="text-sm">
                                    {product.vendorInfo.modeOfPayment}
                                  </p>
                                </div>
                              )}
                              {product.vendorInfo.shippingCompany && (
                                <div>
                                  <label className="text-xs font-medium text-gray-500">
                                    Shipping Company
                                  </label>
                                  <p className="text-sm">
                                    {product.vendorInfo.shippingCompany}
                                  </p>
                                </div>
                              )}
                              {product.vendorInfo.trackingNumber && (
                                <div>
                                  <label className="text-xs font-medium text-gray-500">
                                    Tracking Number
                                  </label>
                                  <p className="text-sm font-mono">
                                    {product.vendorInfo.trackingNumber}
                                  </p>
                                </div>
                              )}
                              {product.vendorInfo.proofOfDelivery && (
                                <div>
                                  <label className="text-xs font-medium text-gray-500">
                                    Proof of Delivery
                                  </label>
                                  <p className="text-sm font-mono">
                                    {product.vendorInfo.proofOfDelivery}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Payment Information */}
            {(lead.modeOfPayment || lead.salesPrice || lead.costPrice) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {lead.salesPrice && (
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          ${lead.salesPrice.toLocaleString()}
                        </div>
                        <div className="text-sm text-green-600">
                          Sales Price
                        </div>
                      </div>
                    )}
                    {lead.costPrice && (
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          ${lead.costPrice.toLocaleString()}
                        </div>
                        <div className="text-sm text-blue-600">Cost Price</div>
                      </div>
                    )}
                    {lead.totalMargin && (
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          ${lead.totalMargin.toLocaleString()}
                        </div>
                        <div className="text-sm text-purple-600">
                          Total Margin
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {lead.modeOfPayment && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Mode of Payment
                        </label>
                        <p className="text-sm">{lead.modeOfPayment}</p>
                      </div>
                    )}
                    {lead.paymentPortal && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Payment Portal
                        </label>
                        <p className="text-sm">{lead.paymentPortal}</p>
                      </div>
                    )}
                    {lead.paymentDate && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Payment Date
                        </label>
                        <p className="text-sm">
                          {new Date(lead.paymentDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {lead.pendingBalance && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Pending Balance
                        </label>
                        <p className="text-sm text-orange-600">
                          ${lead.pendingBalance.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {lead.refunded && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Refunded
                        </label>
                        <p className="text-sm text-red-600">
                          ${lead.refunded.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {lead.refundCredited && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Refund Credited
                        </label>
                        <p className="text-sm text-blue-600">
                          ${lead.refundCredited.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {lead.chargebackAmount && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Chargeback Amount
                        </label>
                        <p className="text-sm text-red-600">
                          ${lead.chargebackAmount.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {lead.cardNumber && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Card Number
                        </label>
                        <p className="text-sm font-mono">
                          ****-****-****-{lead.cardNumber.slice(-4)}
                        </p>
                      </div>
                    )}
                    {lead.expiry && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Card Expiry
                        </label>
                        <p className="text-sm">{lead.expiry}</p>
                      </div>
                    )}
                  </div>

                  {/* Dispute Information */}
                  {(lead.disputeCategory || lead.disputeReason) && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="text-lg font-medium mb-4">
                        Dispute Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {lead.disputeCategory && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Dispute Category
                            </label>
                            <p className="text-sm">{lead.disputeCategory}</p>
                          </div>
                        )}
                        {lead.disputeReason && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Dispute Reason
                            </label>
                            <p className="text-sm">{lead.disputeReason}</p>
                          </div>
                        )}
                        {lead.disputeDate && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Dispute Date
                            </label>
                            <p className="text-sm">
                              {new Date(lead.disputeDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {lead.disputeResult && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Dispute Result
                            </label>
                            <p className="text-sm">{lead.disputeResult}</p>
                          </div>
                        )}
                        {lead.refundDate && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Refund Date
                            </label>
                            <p className="text-sm">
                              {new Date(lead.refundDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {lead.refundTAT && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Refund TAT
                            </label>
                            <p className="text-sm">{lead.refundTAT}</p>
                          </div>
                        )}
                        {lead.arn && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              ARN
                            </label>
                            <p className="text-sm font-mono">{lead.arn}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lead Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Lead ID
                  </label>
                  <p className="text-sm font-mono">{lead.leadId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Lead Number
                  </label>
                  <p className="text-sm font-mono">{lead.leadNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Created Date
                  </label>
                  <p className="text-sm">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Created By
                  </label>
                  <p className="text-sm">{lead.createdBy?.name}</p>
                  <p className="text-xs text-gray-500">
                    {lead.createdBy?.email}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
