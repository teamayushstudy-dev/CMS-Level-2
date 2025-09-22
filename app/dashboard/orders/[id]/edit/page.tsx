'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';

interface VendorOrder {
  _id: string;
  shopName: string;
  vendorAddress: string;
  orderNo: string;
  customerName?: string;
  orderStatus: string;
  itemSubtotal?: number;
  shippingHandling?: number;
  taxCollected?: number;
  courierCompany?: string;
  trackingId?: string;
  productType?: string;
  productName?: string;
  pitchedProductPrice?: number;
  productAmount?: number;
  shippingAddress?: string;
  quantity?: number;
  yearOfMfg?: string;
  make?: string;
  model?: string;
  trim?: string;
  engineSize?: string;
  partType?: string;
  partNumber?: string;
  vin?: string;
  modeOfPayment?: string;
  dateOfBooking?: string;
  dateOfDelivery?: string;
  trackingNumber?: string;
  shippingCompany?: string;
  proofOfDelivery?: string;
}

export default function EditVendorOrderPage() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState<Partial<VendorOrder>>({});
  const router = useRouter();
  const params = useParams();

  const statusOptions = [
    'stage1 (engine pull)',
    'stage2 (washing)',
    'stage3 (testing)',
    'stage4 (pack & ready)',
    'stage5 (shipping)',
    'stage6 (delivered)',
  ];

  useEffect(() => {
    if (params.id) {
      loadOrder();
    }
  }, [params.id]);

  const loadOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/vendor-orders/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(data.order);
      } else {
        console.error('Failed to load order');
        router.push('/dashboard/orders');
      }
    } catch (error) {
      console.error('Error loading order:', error);
      router.push('/dashboard/orders');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/vendor-orders/${params.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push(`/dashboard/orders/${params.id}`);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? undefined : value,
    }));
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order data...</p>
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
              onClick={() => router.push(`/dashboard/orders/${params.id}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Order
            </Button>
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Edit Vendor Order
          </h1>
          <p className="text-gray-600">Update vendor order information</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Vendor Information */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="shopName">Name of the Shop/Vendor *</Label>
                  <Input
                    id="shopName"
                    name="shopName"
                    value={formData.shopName || ''}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="vendorAddress">Address *</Label>
                  <Input
                    id="vendorAddress"
                    name="vendorAddress"
                    value={formData.vendorAddress || ''}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="orderNo">Order Number</Label>
                  <Input
                    id="orderNo"
                    name="orderNo"
                    value={formData.orderNo || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="orderStatus">Order Status</Label>
                  <select
                    id="orderStatus"
                    name="orderStatus"
                    value={formData.orderStatus || ''}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    value={formData.customerName || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="shippingAddress">Shipping Address</Label>
                  <Input
                    id="shippingAddress"
                    name="shippingAddress"
                    value={formData.shippingAddress || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <Label htmlFor="productType">Product Type</Label>
                  <select
                    id="productType"
                    name="productType"
                    value={formData.productType || ''}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Type</option>
                    <option value="engine">Engine</option>
                    <option value="transmission">Transmission</option>
                    <option value="part">Part</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    name="productName"
                    value={formData.productName || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="productAmount">Product Price</Label>
                  <Input
                    id="productAmount"
                    name="productAmount"
                    type="number"
                    step="0.01"
                    value={formData.productAmount || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="pitchedProductPrice">Pitched Product Price</Label>
                  <Input
                    id="pitchedProductPrice"
                    name="pitchedProductPrice"
                    type="number"
                    step="0.01"
                    value={formData.pitchedProductPrice || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    value={formData.quantity || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="yearOfMfg">Year of Manufacture</Label>
                  <Input
                    id="yearOfMfg"
                    name="yearOfMfg"
                    value={formData.yearOfMfg || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    name="make"
                    value={formData.make || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    name="model"
                    value={formData.model || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="trim">Trim</Label>
                  <Input
                    id="trim"
                    name="trim"
                    value={formData.trim || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="engineSize">Engine Size</Label>
                  <Input
                    id="engineSize"
                    name="engineSize"
                    value={formData.engineSize || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                {/* Part-specific fields */}
                {formData.productType === 'part' && (
                  <>
                    <div>
                      <Label htmlFor="partType">Part Type</Label>
                      <select
                        id="partType"
                        name="partType"
                        value={formData.partType || ''}
                        onChange={handleChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Type</option>
                        <option value="used">Used</option>
                        <option value="new">New</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="partNumber">Part Number</Label>
                      <Input
                        id="partNumber"
                        name="partNumber"
                        value={formData.partNumber || ''}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="vin">VIN</Label>
                      <Input
                        id="vin"
                        name="vin"
                        value={formData.vin || ''}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <Label htmlFor="itemSubtotal">Item Subtotal</Label>
                  <Input
                    id="itemSubtotal"
                    name="itemSubtotal"
                    type="number"
                    step="0.01"
                    value={formData.itemSubtotal || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="shippingHandling">Shipping & Handling</Label>
                  <Input
                    id="shippingHandling"
                    name="shippingHandling"
                    type="number"
                    step="0.01"
                    value={formData.shippingHandling || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="taxCollected">Tax Collected</Label>
                  <Input
                    id="taxCollected"
                    name="taxCollected"
                    type="number"
                    step="0.01"
                    value={formData.taxCollected || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="modeOfPayment">Mode of Payment</Label>
                  <Input
                    id="modeOfPayment"
                    name="modeOfPayment"
                    value={formData.modeOfPayment || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBooking">Date of Booking</Label>
                  <Input
                    id="dateOfBooking"
                    name="dateOfBooking"
                    type="date"
                    value={formData.dateOfBooking || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfDelivery">Date of Delivery</Label>
                  <Input
                    id="dateOfDelivery"
                    name="dateOfDelivery"
                    type="date"
                    value={formData.dateOfDelivery || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="courierCompany">Courier Company</Label>
                  <Input
                    id="courierCompany"
                    name="courierCompany"
                    value={formData.courierCompany || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="trackingId">Tracking ID</Label>
                  <Input
                    id="trackingId"
                    name="trackingId"
                    value={formData.trackingId || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="trackingNumber">Tracking Number</Label>
                  <Input
                    id="trackingNumber"
                    name="trackingNumber"
                    value={formData.trackingNumber || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="shippingCompany">Shipping Company</Label>
                  <Input
                    id="shippingCompany"
                    name="shippingCompany"
                    value={formData.shippingCompany || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="proofOfDelivery">Proof of Delivery</Label>
                  <Input
                    id="proofOfDelivery"
                    name="proofOfDelivery"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
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
              onClick={() => router.push(`/dashboard/orders/${params.id}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Updating...' : 'Update Order'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
