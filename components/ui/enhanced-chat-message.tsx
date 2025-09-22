'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Image, 
  Video, 
  Download, 
  Eye, 
  Share,
  User,
  Phone,
  Mail,
  DollarSign
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Message {
  messageId: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
  };
  content: string;
  messageType: 'text' | 'file' | 'image' | 'video' | 'lead_share';
  fileUrl?: string;
  fileName?: string;
  leadData?: any;
  isRead: boolean;
  timestamp: string;
}

interface EnhancedChatMessageProps {
  message: Message;
  isOwn: boolean;
  showSenderName: boolean;
  onViewLead?: (leadId: string) => void;
}

export default function EnhancedChatMessage({ 
  message, 
  isOwn, 
  showSenderName, 
  onViewLead 
}: EnhancedChatMessageProps) {
  const [showLeadDetails, setShowLeadDetails] = useState(false);

  const getFileIcon = (messageType: string) => {
    switch (messageType) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'New': 'bg-blue-100 text-blue-800',
      'Connected': 'bg-green-100 text-green-800',
      'Follow up': 'bg-cyan-100 text-cyan-800',
      'Sale Payment Done': 'bg-emerald-100 text-emerald-800',
      'Product Purchased': 'bg-neutral-100 text-neutral-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
      }`}>
        {showSenderName && (
          <p className="text-xs font-medium mb-1 opacity-75">
            {message.senderId.name}
          </p>
        )}
        
        {message.messageType === 'text' && (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        )}
        
        {(message.messageType === 'file' || message.messageType === 'image' || message.messageType === 'video') && (
          <div className="space-y-2">
            <p className="text-sm">{message.content}</p>
            {message.fileUrl && (
              <div className="flex items-center gap-2">
                {getFileIcon(message.messageType)}
                <a
                  href={message.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline hover:no-underline flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  {message.fileName || 'Download'}
                </a>
                {message.messageType === 'image' && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant={isOwn ? "secondary" : "outline"}
                        className="h-6 px-2 text-xs"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>{message.fileName}</DialogTitle>
                      </DialogHeader>
                      <div className="flex justify-center">
                        <img 
                          src={message.fileUrl} 
                          alt={message.fileName}
                          className="max-w-full max-h-96 object-contain"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}
          </div>
        )}
        
        {message.messageType === 'lead_share' && message.leadData && (
          <div className="space-y-2">
            <p className="text-sm">{message.content}</p>
            <div className={`p-3 rounded border ${isOwn ? 'border-blue-300 bg-blue-500' : 'border-gray-300 bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-medium text-sm ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                  Lead Details
                </h4>
                <div className="flex gap-1">
                  <Dialog open={showLeadDetails} onOpenChange={setShowLeadDetails}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant={isOwn ? "secondary" : "outline"}
                        className="h-6 px-2 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Complete Lead Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* Customer Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Customer Information
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div><strong>Name:</strong> {message.leadData.customerName}</div>
                              <div><strong>Email:</strong> {message.leadData.customerEmail}</div>
                              <div><strong>Phone:</strong> {message.leadData.phoneNumber}</div>
                              {message.leadData.alternateNumber && (
                                <div><strong>Alternate:</strong> {message.leadData.alternateNumber}</div>
                              )}
                              <div><strong>Lead Number:</strong> {message.leadData.leadNumber}</div>
                              <div>
                                <strong>Status:</strong> 
                                <Badge className={`ml-2 ${getStatusColor(message.leadData.status)}`}>
                                  {message.leadData.status}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Financial Information */}
                          {(message.leadData.salesPrice || message.leadData.costPrice || message.leadData.totalMargin) && (
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Financial Information
                              </h4>
                              <div className="space-y-2 text-sm">
                                {message.leadData.salesPrice && (
                                  <div><strong>Sales Price:</strong> ${message.leadData.salesPrice.toLocaleString()}</div>
                                )}
                                {message.leadData.costPrice && (
                                  <div><strong>Cost Price:</strong> ${message.leadData.costPrice.toLocaleString()}</div>
                                )}
                                {message.leadData.totalMargin && (
                                  <div><strong>Total Margin:</strong> ${message.leadData.totalMargin.toLocaleString()}</div>
                                )}
                                {message.leadData.modeOfPayment && (
                                  <div><strong>Payment Mode:</strong> {message.leadData.modeOfPayment}</div>
                                )}
                                {message.leadData.paymentPortal && (
                                  <div><strong>Payment Portal:</strong> {message.leadData.paymentPortal}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Products Information */}
                        {message.leadData.products && message.leadData.products.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-3">Products ({message.leadData.products.length})</h4>
                            <div className="space-y-3">
                              {message.leadData.products.map((product: any, index: number) => (
                                <div key={index} className="border rounded-lg p-3 bg-gray-50">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                    <div><strong>Name:</strong> {product.productName}</div>
                                    <div><strong>Type:</strong> {product.productType}</div>
                                    {product.productAmount && (
                                      <div><strong>Price:</strong> ${product.productAmount.toLocaleString()}</div>
                                    )}
                                    {product.pitchedProductPrice && (
                                      <div><strong>Pitched Price:</strong> ${product.pitchedProductPrice.toLocaleString()}</div>
                                    )}
                                    {product.make && <div><strong>Make:</strong> {product.make}</div>}
                                    {product.model && <div><strong>Model:</strong> {product.model}</div>}
                                    {product.yearOfMfg && <div><strong>Year:</strong> {product.yearOfMfg}</div>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Address Information */}
                        {(message.leadData.billingInfo || message.leadData.shippingInfo) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {message.leadData.billingInfo && (
                              <div>
                                <h4 className="font-semibold mb-3">Billing Address</h4>
                                <div className="space-y-1 text-sm">
                                  {message.leadData.billingInfo.fullAddress && (
                                    <div>{message.leadData.billingInfo.fullAddress}</div>
                                  )}
                                  {message.leadData.billingInfo.state && (
                                    <div>{message.leadData.billingInfo.state}</div>
                                  )}
                                  {message.leadData.billingInfo.zipCode && (
                                    <div>{message.leadData.billingInfo.zipCode}</div>
                                  )}
                                </div>
                              </div>
                            )}

                            {message.leadData.shippingInfo && !message.leadData.sameShippingInfo && (
                              <div>
                                <h4 className="font-semibold mb-3">Shipping Address</h4>
                                <div className="space-y-1 text-sm">
                                  {message.leadData.shippingInfo.fullAddress && (
                                    <div>{message.leadData.shippingInfo.fullAddress}</div>
                                  )}
                                  {message.leadData.shippingInfo.state && (
                                    <div>{message.leadData.shippingInfo.state}</div>
                                  )}
                                  {message.leadData.shippingInfo.zipCode && (
                                    <div>{message.leadData.shippingInfo.zipCode}</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex justify-end">
                          <Button
                            onClick={() => onViewLead && onViewLead(message.leadData._id)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Full Lead
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {onViewLead && (
                    <Button
                      size="sm"
                      variant={isOwn ? "secondary" : "outline"}
                      onClick={() => onViewLead(message.leadData._id)}
                      className="h-6 px-2 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  )}
                </div>
              </div>
              <div className={`text-xs space-y-1 ${isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
                <p><strong>Customer:</strong> {message.leadData.customerName}</p>
                <p><strong>Phone:</strong> {message.leadData.phoneNumber}</p>
                <p><strong>Status:</strong> {message.leadData.status}</p>
                {message.leadData.salesPrice && (
                  <p><strong>Sales Price:</strong> ${message.leadData.salesPrice.toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        <p className={`text-xs mt-1 ${
          isOwn ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}