import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMessage {
  messageId: string;
  senderId: Types.ObjectId;
  content: string;
  messageType: 'text' | 'file' | 'image' | 'video' | 'lead_share';
  fileUrl?: string;
  fileName?: string;
  leadData?: any;
  isRead: boolean;
  readBy: Array<{
    userId: Types.ObjectId;
    readAt: Date;
  }>;
  timestamp: Date;
}

export interface IChat extends Document {
  chatId: string;
  chatType: 'direct' | 'group';
  chatName?: string; // For group chats
  participants: Types.ObjectId[];
  messages: IMessage[];
  lastMessage?: {
    content: string;
    senderId: Types.ObjectId;
    timestamp: Date;
  };
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  messageId: { type: String, required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  messageType: { 
    type: String, 
    enum: ['text', 'file', 'image', 'video', 'lead_share'],
    default: 'text'
  },
  fileUrl: String,
  fileName: String,
  leadData: Schema.Types.Mixed,
  isRead: { type: Boolean, default: false },
  readBy: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  timestamp: { type: Date, default: Date.now }
});

const ChatSchema = new Schema<IChat>(
  {
    chatId: { type: String, unique: true, required: true },
    chatType: { 
      type: String, 
      enum: ['direct', 'group'],
      required: true 
    },
    chatName: String, // For group chats
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    messages: [MessageSchema],
    lastMessage: {
      content: String,
      senderId: { type: Schema.Types.ObjectId, ref: 'User' },
      timestamp: Date
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

// ChatSchema.index({ chatId: 1 });
// ChatSchema.index({ participants: 1 });
// ChatSchema.index({ chatType: 1 });
// ChatSchema.index({ 'lastMessage.timestamp': -1 });

export default mongoose.models.Chat ||
  mongoose.model<IChat>('Chat', ChatSchema);