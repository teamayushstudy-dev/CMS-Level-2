import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPaymentRecord extends Document {
  paymentId: string;
  leadId?: Types.ObjectId;
  customerId?: Types.ObjectId;
  customerName: string;
  customerPhone?: string;
  alternateNumber?: string;
  customerEmail?: string;
  modeOfPayment: string;
  paymentPortal?: 'EasyPayDirect' | 'Authorize.net';
  cardNumber?: string;
  expiry?: string;
  paymentDate: Date;
  salesPrice: number;
  pendingBalance?: number;
  costPrice?: number;
  totalMargin?: number;
  refunded?: number;
  disputeCategory?: string;
  disputeReason?: string;
  disputeDate?: Date;
  disputeResult?: string;
  refundDate?: Date;
  refundTAT?: string;
  arn?: string;
  refundCredited?: number;
  chargebackAmount?: number;
  vendorPaymentMode?: string;
  vendorPaymentAmount?: number;
  vendorPaymentDate?: Date;
  vendorPaymentStatus?: 'pending' | 'completed' | 'failed';
  vendorName?: string;
  vendorAddress?: string;
  transactionId?: string;
  paymentNotes?: string;
  processingFee?: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' | 'disputed';
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
}

const PaymentRecordSchema = new Schema<IPaymentRecord>(
  {
    paymentId: { type: String, unique: true, required: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    customerId: { type: Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, required: true },
    customerPhone: String,
    alternateNumber: String,
    customerEmail: String,
    modeOfPayment: { type: String, required: true },
    paymentPortal: { 
      type: String, 
      enum: ['EasyPayDirect', 'Authorize.net', ''],
      default: ''
    },
    cardNumber: String,
    expiry: String,
    paymentDate: { type: Date, required: true },
    salesPrice: { type: Number, required: true },
    pendingBalance: Number,
    costPrice: Number,
    totalMargin: Number,
    refunded: Number,
    disputeCategory: String,
    disputeReason: String,
    disputeDate: Date,
    disputeResult: String,
    refundDate: Date,
    refundTAT: String,
    arn: String,
    refundCredited: Number,
    chargebackAmount: Number,
    vendorPaymentMode: String,
    vendorPaymentAmount: Number,
    vendorPaymentDate: Date,
    vendorPaymentStatus: { 
      type: String, 
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    vendorName: String,
    vendorAddress: String,
    transactionId: String,
    paymentNotes: String,
    processingFee: Number,
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'disputed'],
      default: 'pending',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

// Calculate total margin automatically
PaymentRecordSchema.pre('save', function (next) {
  if (this.salesPrice && this.costPrice) {
    this.totalMargin = this.salesPrice - this.costPrice;
  }
  next();
});

PaymentRecordSchema.index({ paymentId: 1 });
PaymentRecordSchema.index({ leadId: 1 });
PaymentRecordSchema.index({ paymentStatus: 1 });
PaymentRecordSchema.index({ paymentDate: -1 });

export default mongoose.models.PaymentRecord ||
  mongoose.model<IPaymentRecord>('PaymentRecord', PaymentRecordSchema);