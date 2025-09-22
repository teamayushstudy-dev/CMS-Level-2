'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Plus, Trash2, Upload } from 'lucide-react';
import { generateProductId } from '@/utils/idGenerator';
import { US_STATES, COUNTRIES, YEARS, POPULAR_MAKES, PRODUCT_TYPES, PART_TYPES, ADDRESS_TYPES } from '@/utils/constants';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Product {
  productId: string;
  productType: 'engine' | 'transmission' | 'part';
  productName: string;
  productAmount: string;
  pitchedProductPrice: string;
  quantity: string;
  yearOfMfg: string;
  make: string;
  model: string;
  trim: string;
  engineSize: string;
  partType: string;
  partNumber: string;
  vin: string;
  vendorInfo: {
    shopName: string;
    address: string;
    paymentAmount: string;
    modeOfPayment: string;
    dateOfBooking: string;
    dateOfDelivery: string;
    trackingNumber: string;
    shippingCompany: string;
    proofOfDelivery: string;
    contactPerson: string;
    phone: string;
    email: string;
  };
}

export default function NewLeadPage() {
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('sales');
  const [formData, setFormData] = useState({
    customerName: '',
    description: '',
    customerEmail: '',
    phoneNumber: '',
    alternateNumber: '',
    assignedAgent: '',
    status: 'Follow up',
    sameShippingInfo: false,
  });

  const [billingInfo, setBillingInfo] = useState({
    firstName: '',
    lastName: '',
    fullAddress: '',
    addressType: 'residential',
    country: 'US',
    state: '',
    zipCode: '',
    phone: '',
  });

  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    fullAddress: '',
    addressType: 'residential',
    country: 'US',
    state: '',
    zipCode: '',
    phone: '',
  });

  const [paymentData, setPaymentData] = useState({
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
    chargebackAmount: ''
  });

  const [products, setProducts] = useState<Product[]>([{
    productId: generateProductId(),
    productType: 'engine',
    productName: '',
    productAmount: '',
    pitchedProductPrice: '',
    quantity: '1',
    yearOfMfg: '',
    make: '',
    model: '',
    trim: '',
    engineSize: '',
    partType: '',
    partNumber: '',
    vin: '',
    vendorInfo: {
      shopName: '',
      address: '',
      modeOfPayment: '',
      paymentAmount: '',
      dateOfBooking: '',
      dateOfDelivery: '',
      trackingNumber: '',
      shippingCompany: '',
      proofOfDelivery: '',
      contactPerson: '',
      phone: '',
      email: '',
    }
  }]);

  const [followupDateTime, setFollowupDateTime] = useState({ date: '', time: '' });

  const followupStatuses = [
    'Follow up',
    'Desision Follow up',
    'Payment Follow up',
  ];
  const isFollowupStatus = followupStatuses.includes(formData.status);

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

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      loadAvailableUsers(user);
    }
  }, []);

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
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load available users:', error);
    }
  };

  const addProduct = () => {
    setProducts([...products, {
      productId: generateProductId(),
      productType: 'engine',
      productName: '',
      productAmount: '',
      pitchedProductPrice: '',
      quantity: '1',
      yearOfMfg: '',
      make: '',
      model: '',
      trim: '',
      engineSize: '',
      partType: '',
      partNumber: '',
      vin: '',
      vendorInfo: {
        shopName: '',
        address: '',
        modeOfPayment: '',
        paymentAmount: '',
        dateOfBooking: '',
        dateOfDelivery: '',
        trackingNumber: '',
        shippingCompany: '',
        proofOfDelivery: '',
        contactPerson: '',
        phone: '',
        email: '',
    }}]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const updateProduct = (index: number, field: string, value: string) => {
    const updatedProducts = [...products];
    if (field.startsWith('vendorInfo.')) {
      const vendorField = field.replace('vendorInfo.', '');
      updatedProducts[index] = {
        ...updatedProducts[index],
        vendorInfo: {
          ...updatedProducts[index].vendorInfo,
          [vendorField]: value,
        },
      };
    } else {
      updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    }
    setProducts(updatedProducts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isFollowupStatus && (!followupDateTime.date || !followupDateTime.time)) {
      alert('Please select follow-up date and time for follow-up status');
      return;
    }
    
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const productsData = products.map(product => ({
        productId: product.productId,
        productType: product.productType,
        productName: product.productName,
        productAmount: product.productAmount ? parseFloat(product.productAmount) : undefined,
        pitchedProductPrice: product.pitchedProductPrice ? parseFloat(product.pitchedProductPrice) : undefined,
        quantity: product.quantity ? parseInt(product.quantity) : 1,
        yearOfMfg: product.yearOfMfg || undefined,
        make: product.make || undefined,
        model: product.model || undefined,
        trim: product.trim || undefined,
        engineSize: product.engineSize || undefined,
        partType: product.partType || undefined,
        partNumber: product.partNumber || undefined,
        vin: product.vin || undefined,
        vendorInfo: {
          shopName: product.vendorInfo.shopName || undefined,
          address: product.vendorInfo.address || undefined,
          modeOfPayment: product.vendorInfo.modeOfPayment || undefined,
          paymentAmount: product.vendorInfo.paymentAmount ? parseFloat(product.vendorInfo.paymentAmount) : undefined,
          dateOfBooking: product.vendorInfo.dateOfBooking || undefined,
          dateOfDelivery: product.vendorInfo.dateOfDelivery || undefined,
          trackingNumber: product.vendorInfo.trackingNumber || undefined,
          shippingCompany: product.vendorInfo.shippingCompany || undefined,
          proofOfDelivery: product.vendorInfo.proofOfDelivery || undefined,
          contactPerson: product.vendorInfo.contactPerson || undefined,
          phone: product.vendorInfo.phone || undefined,
          email: product.vendorInfo.email || undefined,
        }
      }));
      
      const submitData = {
        ...formData,
        billingInfo,
        shippingInfo: formData.sameShippingInfo ? billingInfo : shippingInfo,
        ...paymentData,
        salesPrice: paymentData.salesPrice ? parseFloat(paymentData.salesPrice) : undefined,
        pendingBalance: paymentData.pendingBalance ? parseFloat(paymentData.pendingBalance) : undefined,
        costPrice: paymentData.costPrice ? parseFloat(paymentData.costPrice) : undefined,
        refunded: paymentData.refunded ? parseFloat(paymentData.refunded) : undefined,
        refundCredited: paymentData.refundCredited ? parseFloat(paymentData.refundCredited) : undefined,
        chargebackAmount: paymentData.chargebackAmount ? parseFloat(paymentData.chargebackAmount) : undefined,
        paymentDate: paymentData.paymentDate ? new Date(paymentData.paymentDate) : undefined,
        disputeDate: paymentData.disputeDate ? new Date(paymentData.disputeDate) : undefined,
        refundDate: paymentData.refundDate ? new Date(paymentData.refundDate) : undefined,
        products: productsData,
        assignedAgent: formData.assignedAgent || undefined,
        ...(isFollowupStatus && {
          followupDate: followupDateTime.date,
          followupTime: followupDateTime.time
        })
      };
      
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        router.push('/dashboard/leads');
      } else {
        const data = await response.json();
        console.error('Validation errors:', data.details);
        alert(data.error || 'Failed to create lead. Please check all required fields.');
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setBillingInfo(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setShippingInfo(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPaymentData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="flex flex-col h-screen">
      
      {/* Fixed Header with Tabs */}
      <div className="fixed top-0 left-64 right-0 z-10 bg-white shadow-md p-2">
        <div className="max-w-6xl mx-auto">
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
          
          <h1 className="text-3xl font-bold text-gray-900">Create New Lead</h1>
          <p className="text-gray-600">Add a new lead with multiple products to the system</p>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sales">Sales (product + customer)</TabsTrigger>
              <TabsTrigger value="customerPayment">Customer Payment</TabsTrigger>
              <TabsTrigger value="sourcing">Purchasing (vendor)</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      {/* Scrollable Content Area */}
      <div className="flex-grow overflow-y-auto mt-[200px] mb-[80px] p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-100'>
          <TabsContent value="sales" className="space-y-8">
            {/* Products Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Products</CardTitle>
                  <Button
                    type="button"
                    onClick={addProduct}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {products.map((product, index) => (
                    <div key={product.productId} className="border rounded-lg p-6 relative">
                      {products.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeProduct(index)}
                          className="absolute top-4 right-4 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <h4 className="text-lg font-semibold mb-4">Product {index + 1}</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                          <Label>Product Type *</Label>
                          <select
                            value={product.productType}
                            onChange={(e) => updateProduct(index, 'productType', e.target.value)}
                            required
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {PRODUCT_TYPES.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Product Name *</Label>
                          <Input value={product.productName} onChange={(e) => updateProduct(index, 'productName', e.target.value)} required className="mt-1" />
                        </div>
                        <div>
                          <Label>Year of Manufacture</Label>
                          <select
                            value={product.yearOfMfg}
                            onChange={(e) => updateProduct(index, 'yearOfMfg', e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Year</option>
                            {YEARS.map(year => (
                              <option key={year.value} value={year.value}>{year.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Make</Label>
                          <Input list={`makes-${index}`} value={product.make} onChange={(e) => updateProduct(index, 'make', e.target.value)} className="mt-1" placeholder="Type or select make" />
                          <datalist id={`makes-${index}`}>
                            {POPULAR_MAKES.map(make => (
                              <option key={make} value={make} />
                            ))}
                          </datalist>
                        </div>
                        <div>
                          <Label>Model</Label>
                          <Input value={product.model} onChange={(e) => updateProduct(index, 'model', e.target.value)} className="mt-1" placeholder="Enter model" />
                        </div>
                        <div>
                          <Label>Trim</Label>
                          <Input value={product.trim} onChange={(e) => updateProduct(index, 'trim', e.target.value)} className="mt-1" placeholder="Enter trim" />
                        </div>
                        <div>
                          <Label>Product Price</Label>
                          <Input type="number" step="0.01" value={product.productAmount} onChange={(e) => updateProduct(index, 'productAmount', e.target.value)} className="mt-1" />
                        </div>
                        <div>
                          <Label>Pitched Product Price</Label>
                          <Input type="number" step="0.01" value={product.pitchedProductPrice} onChange={(e) => updateProduct(index, 'pitchedProductPrice', e.target.value)} className="mt-1" />
                        </div>
                        <div>
                          <Label>Quantity</Label>
                          <Input type="number" value={product.quantity} onChange={(e) => updateProduct(index, 'quantity', e.target.value)} className="mt-1" />
                        </div>
                        <div>
                          <Label>Engine Size</Label>
                          <Input value={product.engineSize} onChange={(e) => updateProduct(index, 'engineSize', e.target.value)} className="mt-1" placeholder="e.g., 2.0L, V6" />
                        </div>
                          <div>
                            <Label>VIN Number</Label>
                            <Input value={product.vin} onChange={(e) => updateProduct(index, 'vin', e.target.value)} className="mt-1" />
                          </div>
                        {product.productType === 'part' && (
                          <>
                            <div>
                              <Label>Part Type</Label>
                              <select
                                value={product.partType}
                                onChange={(e) => updateProduct(index, 'partType', e.target.value)}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Type</option>
                                {PART_TYPES.map(type => (
                                  <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label>Part Number</Label>
                              <Input value={product.partNumber} onChange={(e) => updateProduct(index, 'partNumber', e.target.value)} className="mt-1" />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="customerName">Customer Name *</Label>
                    <Input
                      id="customerName"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
  
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerEmail">Customer Email</Label>
                    <Input
                      id="customerEmail"
                      name="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  
                  {isFollowupStatus && (
                      <>
                        <div>
                          <Label htmlFor="followupDate">Follow-up Date *</Label>
                          <Input
                            id="followupDate"
                            type="date"
                            value={followupDateTime.date}
                            onChange={e => setFollowupDateTime(dt => ({ ...dt, date: e.target.value }))}
                            required
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="followupTime">Follow-up Time *</Label>
                          <Input
                            id="followupTime"
                            type="time"
                            value={followupDateTime.time}
                            onChange={e => setFollowupDateTime(dt => ({ ...dt, time: e.target.value }))}
                            required
                            className="mt-1"
                          />
                        </div>
                      </>
                  )}
  
                  <div>
                    <Label htmlFor="assignedAgent">Assigned Agent</Label>
                    <select
                      id="assignedAgent"
                      name="assignedAgent"
                      value={formData.assignedAgent}
                      onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Assign to me</option>
                      {availableUsers.map(user => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email}) - {user.role}
                        </option>
                      ))}
                    </select>
                    {currentUser?.role === 'agent' && (
                      <p className="text-xs text-gray-500 mt-1">
                        As an agent, leads will be assigned to you automatically
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Enter customer description or additional notes..."
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="customerPayment" className="space-y-8">
            {/* Payment Section */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="modeOfPayment">Mode of Payment</Label>
                    <select
                      id="modeOfPayment"
                      name="modeOfPayment"
                      value={paymentData.modeOfPayment}
                      onChange={handlePaymentChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Mode</option>
                      <option value="card">Card</option>
                      <option value="zelle">Zelle</option>
                      <option value="wire">Wire</option>
                      <option value="cashapp">CashApp</option>
                      <option value="check">Check</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="paymentPortal">Payment Portal</Label>
                    <Input
                      id="paymentPortal"
                      name="paymentPortal"
                      value={paymentData.paymentPortal}
                      onChange={handlePaymentChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardNumber">Card Number (Last 4 digits)</Label>
                    <Input
                      id="cardNumber"
                      name="cardNumber"
                      value={paymentData.cardNumber}
                      onChange={handlePaymentChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiry">Expiry</Label>
                    <Input
                      id="expiry"
                      name="expiry"
                      value={paymentData.expiry}
                      onChange={handlePaymentChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentDate">Payment Date</Label>
                    <Input
                      id="paymentDate"
                      name="paymentDate"
                      type="date"
                      value={paymentData.paymentDate}
                      onChange={handlePaymentChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="salesPrice">Sales Price</Label>
                    <Input
                      id="salesPrice"
                      name="salesPrice"
                      type="number"
                      step="0.01"
                      value={paymentData.salesPrice}
                      onChange={handlePaymentChange}
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
                      value={paymentData.pendingBalance}
                      onChange={handlePaymentChange}
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
                      value={paymentData.costPrice}
                      onChange={handlePaymentChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="refunded">Refunded Amount</Label>
                    <Input
                      id="refunded"
                      name="refunded"
                      type="number"
                      step="0.01"
                      value={paymentData.refunded}
                      onChange={handlePaymentChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="disputeCategory">Dispute Category</Label>
                    <Input
                      id="disputeCategory"
                      name="disputeCategory"
                      value={paymentData.disputeCategory}
                      onChange={handlePaymentChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="disputeReason">Dispute Reason</Label>
                    <Input
                      id="disputeReason"
                      name="disputeReason"
                      value={paymentData.disputeReason}
                      onChange={handlePaymentChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="disputeDate">Dispute Date</Label>
                    <Input
                      id="disputeDate"
                      name="disputeDate"
                      type="date"
                      value={paymentData.disputeDate}
                      onChange={handlePaymentChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="disputeResult">Dispute Result</Label>
                    <Input
                      id="disputeResult"
                      name="disputeResult"
                      value={paymentData.disputeResult}
                      onChange={handlePaymentChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="refundDate">Refund Date</Label>
                    <Input
                      id="refundDate"
                      name="refundDate"
                      type="date"
                      value={paymentData.refundDate}
                      onChange={handlePaymentChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="refundTAT">Refund TAT</Label>
                    <Input
                      id="refundTAT"
                      name="refundTAT"
                      value={paymentData.refundTAT}
                      onChange={handlePaymentChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="arn">ARN</Label>
                    <Input
                      id="arn"
                      name="arn"
                      value={paymentData.arn}
                      onChange={handlePaymentChange}
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
                      value={paymentData.refundCredited}
                      onChange={handlePaymentChange}
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
                      value={paymentData.chargebackAmount}
                      onChange={handlePaymentChange}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing Information */}
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="billingFirstName">First Name</Label>
                    <Input
                      id="billingFirstName"
                      name="firstName"
                      value={billingInfo.firstName}
                      onChange={handleBillingChange}
                      className="mt-1"
                    />
                  </div>
  
                  <div>
                    <Label htmlFor="billingLastName">Last Name</Label>
                    <Input
                      id="billingLastName"
                      name="lastName"
                      value={billingInfo.lastName}
                      onChange={handleBillingChange}
                      className="mt-1"
                    />
                  </div>
  
                  <div>
                    <Label htmlFor="billingFullAddress">Full Address</Label>
                    <Input
                      id="billingFullAddress"
                      name="fullAddress"
                      value={billingInfo.fullAddress}
                      onChange={handleBillingChange}
                      className="mt-1"
                    />
                  </div>
  
                  <div>
                    <Label htmlFor="billingAddressType">Address Type</Label>
                    <select
                      id="billingAddressType"
                      name="addressType"
                      value={billingInfo.addressType}
                      onChange={handleBillingChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ADDRESS_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
  
                  <div>
                    <Label htmlFor="billingCountry">Country</Label>
                    <select
                      id="billingCountry"
                      name="country"
                      value={billingInfo.country}
                      onChange={handleBillingChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {COUNTRIES.map(country => (
                        <option key={country.value} value={country.value}>{country.label}</option>
                      ))}
                    </select>
                  </div>
  
                  <div>
                    <Label htmlFor="billingState">State</Label>
                    <select
                      id="billingState"
                      name="state"
                      value={billingInfo.state}
                      onChange={handleBillingChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select State</option>
                      {US_STATES.map(state => (
                        <option key={state.value} value={state.value}>{state.label}</option>
                      ))}
                    </select>
                  </div>
  
                  <div>
                    <Label htmlFor="billingZipCode">Zip Code</Label>
                    <Input
                      id="billingZipCode"
                      name="zipCode"
                      value={billingInfo.zipCode}
                      onChange={handleBillingChange}
                      className="mt-1"
                    />
                  </div>
  
                  <div>
                    <Label htmlFor="billingPhone">Phone</Label>
                    <Input
                      id="billingPhone"
                      name="phone"
                      value={billingInfo.phone}
                      onChange={handleBillingChange}
                      className="mt-1"
                    />
                  </div>
                </div>
  
                <div className="mt-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sameShippingInfo"
                      checked={formData.sameShippingInfo}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, sameShippingInfo: checked as boolean }))
                      }
                    />
                    <Label htmlFor="sameShippingInfo">Same as shipping information</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
  
            {/* Shipping Information */}
            {!formData.sameShippingInfo && (
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="shippingFirstName">First Name</Label>
                      <Input
                        id="shippingFirstName"
                        name="firstName"
                        value={shippingInfo.firstName}
                        onChange={handleShippingChange}
                        className="mt-1"
                      />
                    </div>
  
                    <div>
                      <Label htmlFor="shippingLastName">Last Name</Label>
                      <Input
                        id="shippingLastName"
                        name="lastName"
                        value={shippingInfo.lastName}
                        onChange={handleShippingChange}
                        className="mt-1"
                      />
                    </div>
  
                    <div>
                      <Label htmlFor="shippingFullAddress">Full Address</Label>
                      <Input
                        id="shippingFullAddress"
                        name="fullAddress"
                        value={shippingInfo.fullAddress}
                        onChange={handleShippingChange}
                        className="mt-1"
                      />
                    </div>
  
                    <div>
                      <Label htmlFor="shippingAddressType">Address Type</Label>
                      <select
                        id="shippingAddressType"
                        name="addressType"
                        value={shippingInfo.addressType}
                        onChange={handleShippingChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {ADDRESS_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
  
                    <div>
                      <Label htmlFor="shippingCountry">Country</Label>
                      <select
                        id="shippingCountry"
                        name="country"
                        value={shippingInfo.country}
                        onChange={handleShippingChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {COUNTRIES.map(country => (
                          <option key={country.value} value={country.value}>{country.label}</option>
                        ))}
                      </select>
                    </div>
  
                    <div>
                      <Label htmlFor="shippingState">State</Label>
                      <select
                        id="shippingState"
                        name="state"
                        value={shippingInfo.state}
                        onChange={handleShippingChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select State</option>
                        {US_STATES.map(state => (
                          <option key={state.value} value={state.value}>{state.label}</option>
                        ))}
                      </select>
                    </div>
  
                    <div>
                      <Label htmlFor="shippingZipCode">Zip Code</Label>
                      <Input
                        id="shippingZipCode"
                        name="zipCode"
                        value={shippingInfo.zipCode}
                        onChange={handleShippingChange}
                        className="mt-1"
                      />
                    </div>
  
                    <div>
                      <Label htmlFor="shippingPhone">Phone</Label>
                      <Input
                        id="shippingPhone"
                        name="phone"
                        value={shippingInfo.phone}
                        onChange={handleShippingChange}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
  
          </TabsContent>
          
          <TabsContent value="sourcing" className="space-y-8">
            {products.map((product, index) => (
              <Card key={product.productId}>
                <CardHeader>
                  <CardTitle>Sourcing & Vendor Information for Product {index + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">Product Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Product Name</Label>
                          <Input value={product.productName} disabled className="mt-1" />
                        </div>
                        <div>
                          <Label>Pitched Product Price</Label>
                          <Input value={product.pitchedProductPrice} disabled className="mt-1" />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Vendor Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Name of the Shop/Vendor</Label>
                          <Input
                            value={product.vendorInfo.shopName}
                            onChange={(e) => updateProduct(index, 'vendorInfo.shopName', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Address</Label>
                          <Input
                            value={product.vendorInfo.address}
                            onChange={(e) => updateProduct(index, 'vendorInfo.address', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Contact Person</Label>
                          <Input
                            value={product.vendorInfo.contactPerson}
                            onChange={(e) => updateProduct(index, 'vendorInfo.contactPerson', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input
                            value={product.vendorInfo.phone}
                            onChange={(e) => updateProduct(index, 'vendorInfo.phone', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={product.vendorInfo.email}
                            onChange={(e) => updateProduct(index, 'vendorInfo.email', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Mode of Payment</Label>
                          <select
                            value={product.vendorInfo.modeOfPayment}
                            onChange={(e) => updateProduct(index, 'vendorInfo.modeOfPayment', e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Mode</option>
                            <option value="zelle">Zelle</option>
                            <option value="wire">Wire</option>
                            <option value="card">Card</option>
                            <option value="cashapp">CashApp</option>
                            <option value="check">Check</option>
                          </select>
                        </div>
                        <div>
                          <Label>Payment Amount</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={product.vendorInfo.paymentAmount}
                            onChange={(e) => updateProduct(index, 'vendorInfo.paymentAmount', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Date of Booking</Label>
                          <Input
                            type="date"
                            value={product.vendorInfo.dateOfBooking}
                            onChange={(e) => updateProduct(index, 'vendorInfo.dateOfBooking', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Date of Delivery</Label>
                          <Input
                            type="date"
                            value={product.vendorInfo.dateOfDelivery}
                            onChange={(e) => updateProduct(index, 'vendorInfo.dateOfDelivery', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Tracking Number</Label>
                          <Input
                            value={product.vendorInfo.trackingNumber}
                            onChange={(e) => updateProduct(index, 'vendorInfo.trackingNumber', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Shipping Company</Label>
                          <Input
                            value={product.vendorInfo.shippingCompany}
                            onChange={(e) => updateProduct(index, 'vendorInfo.shippingCompany', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Proof of Delivery</Label>
                          <Input
                            id={`proofOfDelivery-${index}`}
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                updateProduct(index, 'vendorInfo.proofOfDelivery', file.name);
                              }
                            }}
                          />
                          <Label
                            htmlFor={`proofOfDelivery-${index}`}
                            className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-50"
                          >
                            <Upload className="h-4 w-4" />
                            {product.vendorInfo.proofOfDelivery || 'Upload file'}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Fixed Form Submission Buttons */}
      <div className="fixed bottom-0 left-64 right-0 z-10 bg-white p-2 shadow-[0_-4px_6px_-1px_rgb(0_0_0_/_0.1),_0_-2px_4px_-2px_rgb(0_0_0_/_0.1)]">
        <div className="flex justify-end gap-4 max-w-6xl mx-auto">
                  
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/leads')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Creating...' : 'Create Lead'}
          </Button>
        </div>
      </div>
    </div>
  );
}