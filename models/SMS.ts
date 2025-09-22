import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISMS extends Document {
  smsId: string;
  messageType: 'outbound' | 'inbound';
  fromNumber: string;
  toNumber: string;
  content: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending' | 'received';
  sentAt: Date;
  deliveredAt?: Date;
  failureReason?: string;
  cost?: number;
  leadId?: Types.ObjectId;
  customerId?: string;
  customerName?: string;
  userId: Types.ObjectId; // User who sent the SMS
  twilioMessageSid?: string;
  twilioStatus?: string;
  twilioErrorCode?: string;
  twilioErrorMessage?: string;
  mediaUrls?: string[]; // For MMS
  numSegments?: number;
  direction: 'inbound' | 'outbound-api' | 'outbound-call' | 'outbound-reply';
  accountSid?: string;
  messagingServiceSid?: string;
  tags: string[];
  isRead: boolean;
  readAt?: Date;
}

const SMSSchema = new Schema<ISMS>(
  {
    smsId: { type: String, unique: true, required: true },
    messageType: { 
      type: String, 
      enum: ['outbound', 'inbound'], 
      required: true 
    },
    fromNumber: { type: String, required: true },
    toNumber: { type: String, required: true },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed', 'pending', 'received'],
      required: true
    },
    sentAt: { type: Date, required: true },
    deliveredAt: Date,
    failureReason: String,
    cost: Number,
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    customerId: String,
    customerName: String,
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    twilioMessageSid: String,
    twilioStatus: String,
    twilioErrorCode: String,
    twilioErrorMessage: String,
    mediaUrls: [String],
    numSegments: Number,
    direction: {
      type: String,
      enum: ['inbound', 'outbound-api', 'outbound-call', 'outbound-reply'],
      required: true
    },
    accountSid: String,
    messagingServiceSid: String,
    tags: [String],
    isRead: { type: Boolean, default: false },
    readAt: Date
  },
  {
    timestamps: true,
  }
);

SMSSchema.index({ smsId: 1 });
SMSSchema.index({ userId: 1 });
SMSSchema.index({ messageType: 1 });
SMSSchema.index({ status: 1 });
SMSSchema.index({ sentAt: -1 });
SMSSchema.index({ fromNumber: 1 });
SMSSchema.index({ toNumber: 1 });
SMSSchema.index({ leadId: 1 });
SMSSchema.index({ twilioMessageSid: 1 });

export default mongoose.models.SMS ||
  mongoose.model<ISMS>('SMS', SMSSchema);