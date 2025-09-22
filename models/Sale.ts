import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISale extends Document {
  leadId: Types.ObjectId;
  saleId: string;
  customerName: string;
  customerEmail: string;
  phoneNumber: string;
  alternateNumber?: string;
  productName?: string;
  salesPrice?: number;
  costPrice?: number;
  totalMargin?: number;
  modeOfPayment?: string;
  paymentPortal?: string;
  paymentDate?: Date;
  orderConfirmationSent: boolean;
  orderConfirmationDate?: Date;
  orderStageUpdated: boolean;
  orderStageUpdateDate?: Date;
  deliveryConfirmationSent: boolean;
  deliveryConfirmationDate?: Date;
  status: 'pending' | 'in_progress' | 'completed';
  assignedAgent: Types.ObjectId;
  notes: string[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
}

const SaleSchema = new Schema<ISale>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    saleId: { type: String, unique: true, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    alternateNumber: String,
    productName: String,
    salesPrice: Number,
    costPrice: Number,
    totalMargin: Number,
    modeOfPayment: String,
    paymentPortal: String,
    paymentDate: Date,
    orderConfirmationSent: { type: Boolean, default: false },
    orderConfirmationDate: Date,
    orderStageUpdated: { type: Boolean, default: false },
    orderStageUpdateDate: Date,
    deliveryConfirmationSent: { type: Boolean, default: false },
    deliveryConfirmationDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    assignedAgent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: [String],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

// Calculate total margin automatically
SaleSchema.pre('save', function (next) {
  if (this.salesPrice && this.costPrice) {
    this.totalMargin = this.salesPrice - this.costPrice;
  }
  next();
});

SaleSchema.index({ saleId: 1 });
SaleSchema.index({ leadId: 1 });
SaleSchema.index({ status: 1 });
SaleSchema.index({ assignedAgent: 1 });

export default mongoose.models.Sale ||
  mongoose.model<ISale>('Sale', SaleSchema);