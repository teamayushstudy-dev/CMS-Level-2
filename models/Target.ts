import mongoose, { Document, Schema } from 'mongoose';

export interface ITarget extends Document {
  targetId: string;
  title: string;
  description?: string;
  targetAmount: number;
  achievedAmount: number;
  remainingAmount: number;
  startDate: Date;
  endDate: Date;
  assignedUsers: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
}

const TargetSchema = new Schema<ITarget>(
  {
    targetId: { type: String, unique: true, required: true },
    title: { type: String, required: true },
    description: String,
    targetAmount: { type: Number, required: true },
    achievedAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    assignedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

// Calculate remaining amount automatically
TargetSchema.pre('save', function (next) {
  this.remainingAmount = this.targetAmount - this.achievedAmount;
  next();
});

TargetSchema.index({ targetId: 1 });
TargetSchema.index({ isActive: 1 });
TargetSchema.index({ assignedUsers: 1 });

export default mongoose.models.Target ||
  mongoose.model<ITarget>('Target', TargetSchema);
