import mongoose, { Document, Schema } from 'mongoose';

export interface IFollowup extends Document {
  followupId: string;
  leadId: mongoose.Types.ObjectId;
  leadNumber: string;
  customerName: string;
  customerEmail: string;
  phoneNumber: string;
  productName?: string;
  salesPrice?: number;
  status: 'Follow up' | 'Desision Follow up' | 'Payment Follow up';
  assignedAgent: mongoose.Types.ObjectId;
  dateCreated: Date;
  scheduledDate?: Date;
  scheduledTime?: string;
  isDone: boolean;
  completedDate?: Date;
  completedBy?: mongoose.Types.ObjectId;
  notes: string[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
}

const FollowupSchema = new Schema<IFollowup>(
  {
    followupId: { type: String, unique: true, required: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    leadNumber: { type: String, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    productName: String,
    salesPrice: Number,
    status: {
      type: String,
      enum: ['Follow up', 'Desision Follow up', 'Payment Follow up'],
      required: true,
    },
    assignedAgent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dateCreated: { type: Date, default: Date.now },
    scheduledDate: Date,
    scheduledTime: String,
    isDone: { type: Boolean, default: false },
    completedDate: Date,
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: [String],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

FollowupSchema.index({ followupId: 1 });
FollowupSchema.index({ leadId: 1 });
FollowupSchema.index({ assignedAgent: 1 });
FollowupSchema.index({ status: 1 });
FollowupSchema.index({ isDone: 1 });

export default mongoose.models.Followup ||
  mongoose.model<IFollowup>('Followup', FollowupSchema);
