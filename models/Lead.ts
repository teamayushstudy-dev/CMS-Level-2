import mongoose, { Document, Schema } from 'mongoose';

export type LeadStatus =
  | 'New'
  | 'Connected'
  | 'Nurturing'
  | 'Waiting for respond'
  | 'Customer Waiting for respond'
  | 'Follow up'
  | 'Desision Follow up'
  | 'Payment Follow up'
  | 'Payment Under Process'
  | 'Customer making payment'
  | 'Wrong Number'
  | 'Taking Information Only'
  | 'Not Intrested'
  | 'Out Of Scope'
  | 'Trust Issues'
  | 'Voice mail'
  | 'Incomplete Information'
  | 'Sourcing'
  | 'Sale Payment Done'
  | 'Product Purchased';

export interface IBillingInfo {
  firstName?: string;
  lastName?: string;
  fullAddress?: string;
  addressType?: 'residential' | 'commercial';
  country?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
}

export interface IShippingInfo {
  firstName?: string;
  lastName?: string;
  fullAddress?: string;
  addressType?: 'residential' | 'commercial';
  country?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
}

export interface ILeadProduct {
  productId: string;
  productType: 'engine' | 'transmission' | 'part';
  productName: string;
  productAmount?: number;
  pitchedProductPrice?: number;
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
    vendorId?: string;
    shopName?: string;
    address?: string;
    modeOfPayment?: string;
    paymentAmount?: number;
    dateOfBooking?: Date;
    dateOfDelivery?: Date;
    trackingNumber?: string;
    shippingCompany?: string;
    proofOfDelivery?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
  };
}

export interface ILead {
  leadId: string;
  leadNumber: string;
  date: Date;
  month: string;
  invoiceNo?: string;
  orderNo?: string;
  customerId?: string;
  customerName: string;
  description?: string;
  phoneNumber: string;
  alternateNumber?: string;
  customerEmail?: string;
  status: LeadStatus;
  orderStatus?: string;
  assignedAgent: string | mongoose.Types.ObjectId;
  sameShippingInfo?: boolean;
  billingInfo?: IBillingInfo;
  shippingInfo?: IShippingInfo;
  products: ILeadProduct[];
  // Payment Information
  modeOfPayment?: string;
  paymentPortal?: string;
  cardNumber?: string;
  expiry?: string;
  paymentDate?: Date;
  salesPrice?: number;
  pendingBalance?: number;
  costPrice?: number;
  totalMargin?: number;
  refunded?: number;
  tentativeQuotedPrice?: number;
  tentativeCostPrice?: number;
  tentativeMargin?: number;
  disputeCategory?: string;
  disputeReason?: string;
  disputeDate?: Date;
  disputeResult?: string;
  refundDate?: Date;
  refundTAT?: string;
  arn?: string;
  refundCredited?: number;
  chargebackAmount?: number;
  createdBy: string | mongoose.Types.ObjectId;
  updatedBy: string | mongoose.Types.ObjectId;
  history: Array<{
    action: string;
    changes: object;
    performedBy: string;
    timestamp: Date;
    notes?: string;
  }>;
  notes: Array<{
    content: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
  }>;
  scheduledFollowups: Array<{
    followupType: string;
    scheduledDate: Date;
    scheduledTime: string;
    notes?: string;
    isCompleted: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
  }>;
}

const BillingInfoSchema = new Schema<IBillingInfo>({
  firstName: String,
  lastName: String,
  fullAddress: String,
  addressType: { type: String, enum: ['residential', 'commercial'] },
  country: String,
  state: String,
  zipCode: String,
  phone: String,
});

const ShippingInfoSchema = new Schema<IShippingInfo>({
  firstName: String,
  lastName: String,
  fullAddress: String,
  addressType: { type: String, enum: ['residential', 'commercial'] },
  country: String,
  state: String,
  zipCode: String,
  phone: String,
});

const LeadProductSchema = new Schema<ILeadProduct>({
  productId: { type: String, required: true },
  productType: {
    type: String,
    enum: ['engine', 'transmission', 'part'],
    required: true,
  },
  productName: { type: String, required: true },
  productAmount: Number,
  pitchedProductPrice: Number,
  quantity: Number,
  yearOfMfg: String,
  make: String,
  model: String,
  trim: String,
  engineSize: String,
  partType: { type: String, enum: ['used', 'new'] },
  partNumber: String,
  vin: String,
  vendorInfo: {
    vendorId: String,
    shopName: String,
    address: String,
    modeOfPayment: String,
    paymentAmount: Number,
    dateOfBooking: Date,
    dateOfDelivery: Date,
    trackingNumber: String,
    shippingCompany: String,
    proofOfDelivery: String,
    contactPerson: String,
    phone: String,
    email: String,
  },
});

const LeadSchema = new Schema(
  {
    leadId: { type: String, unique: true, required: true },
    leadNumber: { type: String, unique: true, required: true },
    date: { type: Date, default: Date.now },
    month: { type: String, required: true },
    invoiceNo: String,
    orderNo: { type: String, ref: 'VendorOrder' },
    customerId: { type: String, ref: 'User' },
    customerName: { type: String, required: true },
    description: { type: String },
    phoneNumber: { type: String, required: true },
    alternateNumber: String,
    customerEmail: {
      type: String,
      validate: {
        validator: function (v: string) {
          if (!v) return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format',
      },
    },
    status: {
      type: String,
      enum: [
        'New',
        'Connected',
        'Nurturing',
        'Waiting for respond',
        'Customer Waiting for respond',
        'Follow up',
        'Desision Follow up',
        'Payment Follow up',
        'Payment Under Process',
        'Customer making payment',
        'Wrong Number',
        'Taking Information Only',
        'Not Intrested',
        'Out Of Scope',
        'Trust Issues',
        'Voice mail',
        'Incomplete Information',
        'Sourcing',
        'Sale Payment Done',
        'Product Purchased',
      ],
      default: 'Follow up',
    },
    orderStatus: String,
    assignedAgent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sameShippingInfo: { type: Boolean, default: false },
    billingInfo: BillingInfoSchema,
    shippingInfo: ShippingInfoSchema,
    products: [LeadProductSchema],
    modeOfPayment: String,
    paymentPortal: { 
      type: String, 
      enum: ['EasyPayDirect', 'Authorize.net', ''],
      default: ''
    },
    cardNumber: String,
    expiry: String,
    paymentDate: Date,
    salesPrice: Number,
    pendingBalance: Number,
    costPrice: Number,
    totalMargin: { type: Number, default: 0 },
    refunded: Number,
    tentativeQuotedPrice: Number,
    tentativeCostPrice: Number,
    tentativeMargin: { type: Number, default: 0 },
    disputeCategory: String,
    disputeReason: String,
    disputeDate: Date,
    disputeResult: String,
    refundDate: Date,
    refundTAT: String,
    arn: String,
    refundCredited: Number,
    chargebackAmount: Number,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    history: [
      {
        action: String,
        changes: Schema.Types.Mixed,
        performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        notes: String,
      },
    ],
    notes: [
      {
        content: { type: String, required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    scheduledFollowups: [
      {
        followupType: { type: String, required: true },
        scheduledDate: { type: Date, required: true },
        scheduledTime: { type: String, required: true },
        notes: String,
        isCompleted: { type: Boolean, default: false },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Calculate total margin and sales price automatically
LeadSchema.pre('save', function (next) {
  if (this.salesPrice && this.costPrice) {
    this.totalMargin = this.salesPrice - this.costPrice;
  }
  if (this.tentativeQuotedPrice && this.tentativeCostPrice) {
    this.tentativeMargin = this.tentativeQuotedPrice - this.tentativeCostPrice;
  }
  next();
});

LeadSchema.index({ leadId: 1 });
LeadSchema.index({ leadNumber: 1 });
LeadSchema.index({ status: 1 });
LeadSchema.index({ assignedAgent: 1 });
LeadSchema.index({ customerEmail: 1 });
LeadSchema.index({ createdAt: -1 });

export default mongoose.models.Lead ||
  mongoose.model<ILead>('Lead', LeadSchema);