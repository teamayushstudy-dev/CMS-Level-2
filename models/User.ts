import mongoose, { Document, Schema } from 'mongoose';
import { toZonedTime } from 'date-fns-tz';

const getFontanaTime = () => {
  const now = new Date(); // This is the server's time (e.g., UTC)
  const fontanaTimeZone = 'America/Los_Angeles';
  // Convert the current time to the specified time zone
  return toZonedTime(now, fontanaTimeZone);
};

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'agent';
  assignedAgents?: string[]; // For managers
  assignedBy?: string; // For agents
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'manager', 'agent'], 
    required: true 
  },
  assignedAgents: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  lastLogin: Date
}, {
  timestamps: true
});

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, isActive: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);