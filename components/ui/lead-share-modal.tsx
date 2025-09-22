import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Share, User, Phone, Mail, DollarSign } from 'lucide-react';

interface Lead {
  _id: string;
  leadNumber: string;
  customerName: string;
  customerEmail: string;
  phoneNumber: string;
  status: string;
  salesPrice?: number;
  costPrice?: number;
  totalMargin?: number;
  assignedAgent: {
    name: string;
    email: string;
  };
  products?: Array<{
    productName: string;
    productType: string;
    make?: string;
    model?: string;
    yearOfMfg?: string;
  }>;
}

interface LeadShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (leadData: any) => void;
}

export default function LeadShareModal({ isOpen, onClose, onShare }: LeadShareModalProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadLeads();
    }
  }, [isOpen]);

  useEffect(() => {
    if (search) {
      const filtered = leads.filter(lead =>
        lead.customerName.toLowerCase().includes(search.toLowerCase()) ||
        lead.leadNumber.toLowerCase().includes(search.toLowerCase()) ||
        lead.customerEmail?.toLowerCase().includes(search.toLowerCase()) ||
        lead.phoneNumber.includes(search) ||
        lead.status.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredLeads(filtered);
    } else {
      setFilteredLeads(leads);
    }
  }, [search, leads]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Use the new shareable leads endpoint that respects permissions
      const response = await fetch('/api/leads/shareable?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads);
        setFilteredLeads(data.leads);
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'New': 'bg-blue-100 text-blue-800',
      'Connected': 'bg-green-100 text-green-800',
      'Follow up': 'bg-cyan-100 text-cyan-800',
      'Sale Payment Done': 'bg-emerald-100 text-emerald-800',
      'Product Purchased': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleShare = () => {
    if (!selectedLead) return;

    // Format lead data for sharing in list format
    const shareData = {
      _id: selectedLead._id,
      leadNumber: selectedLead.leadNumber,
      customerName: selectedLead.customerName,
      customerEmail: selectedLead.customerEmail,
      phoneNumber: selectedLead.phoneNumber,
      status: selectedLead.status,
      salesPrice: selectedLead.salesPrice,
      costPrice: selectedLead.costPrice,
      totalMargin: selectedLead.totalMargin,
      assignedAgent: selectedLead.assignedAgent,
      products: selectedLead.products
    };

    onShare(shareData);
    setSelectedLead(null);
    setSearch('');
  };

  const handleClose = () => {
    setSelectedLead(null);
    setSearch('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            Share Lead Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div>
            <Label>Search Leads</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer name, lead number, email, phone, or status..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Lead Selection */}
          <div>
            <Label>Select Lead to Share</Label>
            <div className="mt-1 max-h-60 overflow-y-auto border rounded-md">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading leads...</p>
                </div>
              ) : filteredLeads.length > 0 ? (
                <div className="space-y-1 p-2">
                  {filteredLeads.map(lead => (
                    <div
                      key={lead._id}
                      onClick={() => setSelectedLead(lead)}
                      className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                        selectedLead?._id === lead._id
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{lead.leadNumber}</span>
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                        </div>
                        {lead.salesPrice && (
                          <span className="text-sm font-medium text-green-600">
                            ${lead.salesPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="font-medium">{lead.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>{lead.phoneNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span>{lead.customerEmail}</span>
                        </div>
                        {lead.products && lead.products.length > 0 && (
                          <div className="text-xs text-gray-500">
                            Products: {lead.products.map(p => p.productName).filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No leads found</p>
                </div>
              )}
            </div>
          </div>

          {/* Selected Lead Preview */}
          {selectedLead && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <h4 className="font-medium text-blue-900 mb-3">Selected Lead Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Lead Number:</span>
                  <span className="ml-2">{selectedLead.leadNumber}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Customer:</span>
                  <span className="ml-2">{selectedLead.customerName}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Phone:</span>
                  <span className="ml-2">{selectedLead.phoneNumber}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Email:</span>
                  <span className="ml-2">{selectedLead.customerEmail}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Status:</span>
                  <span className="ml-2">{selectedLead.status}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Agent:</span>
                  <span className="ml-2">{selectedLead.assignedAgent.name}</span>
                </div>
                {selectedLead.salesPrice && (
                  <div>
                    <span className="font-medium text-blue-700">Sales Price:</span>
                    <span className="ml-2">${selectedLead.salesPrice.toLocaleString()}</span>
                  </div>
                )}
                {selectedLead.totalMargin && (
                  <div>
                    <span className="font-medium text-blue-700">Margin:</span>
                    <span className="ml-2">${selectedLead.totalMargin.toLocaleString()}</span>
                  </div>
                )}
                {selectedLead.products && selectedLead.products.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-blue-700">Products:</span>
                    <div className="ml-2 mt-1">
                      {selectedLead.products.map((product, index) => (
                        <div key={index} className="text-xs bg-white rounded px-2 py-1 mb-1 inline-block mr-2">
                          {product.productName} ({product.productType})
                          {product.make && ` - ${product.make}`}
                          {product.model && ` ${product.model}`}
                          {product.yearOfMfg && ` (${product.yearOfMfg})`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleShare}
              disabled={!selectedLead}
              className="flex items-center gap-2"
            >
              <Share className="h-4 w-4" />
              Share Lead Details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}