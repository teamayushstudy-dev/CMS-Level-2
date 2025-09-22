import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICall extends Document {
  callId: string;
  callType: 'inbound' | 'outbound';
  fromNumber: string;
  toNumber: string;
  duration: number; // in seconds
  status: 'completed' | 'missed' | 'busy' | 'failed' | 'no-answer';
  startTime: Date;
  endTime?: Date;
  recordingUrl?: string;
  recordingDuration?: number;
  cost?: number;
  leadId?: Types.ObjectId;
  customerId?: string;
  customerName?: string;
  notes?: string;
  tags: string[];
  userId: Types.ObjectId; // User who made/received the call
  vonageCallId?: string;
  vonageConversationId?: string;
  isRecorded: boolean;
  callQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  transferredTo?: string;
  transferredFrom?: string;
  conferenceId?: string;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    deviceType?: string;
  };
}

const CallSchema = new Schema<ICall>(
  {
    callId: { type: String, unique: true, required: true },
    callType: { 
      type: String, 
      enum: ['inbound', 'outbound'], 
      required: true 
    },
    fromNumber: { type: String, required: true },
    toNumber: { type: String, required: true },
    duration: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['completed', 'missed', 'busy', 'failed', 'no-answer'],
      required: true
    },
    startTime: { type: Date, required: true },
    endTime: Date,
    recordingUrl: String,
    recordingDuration: Number,
    cost: Number,
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    customerId: String,
    customerName: String,
    notes: String,
    tags: [String],
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vonageCallId: String,
    vonageConversationId: String,
    isRecorded: { type: Boolean, default: false },
    callQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    },
    transferredTo: String,
    transferredFrom: String,
    conferenceId: String,
    metadata: {
      userAgent: String,
      ipAddress: String,
      deviceType: String
    }
  },
  {
    timestamps: true,
  }
);

CallSchema.index({ callId: 1 });
CallSchema.index({ userId: 1 });
CallSchema.index({ callType: 1 });
CallSchema.index({ status: 1 });
CallSchema.index({ startTime: -1 });
CallSchema.index({ fromNumber: 1 });
CallSchema.index({ toNumber: 1 });
CallSchema.index({ leadId: 1 });

export default mongoose.models.Call ||
  mongoose.model<ICall>('Call', CallSchema);