import connectDB from '@/lib/dbConfig';
import ActivityHistory from '@/models/ActivityHistory';
import { generateActivityId } from './idGenerator';

export interface LogActivityParams {
  userId: string;
  userName: string;
  userRole: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'register' | 'import' | 'export';
  module: 'leads' | 'vendor_orders' | 'targets' | 'sales' | 'followups' | 'payment_records' | 'users' | 'auth';
  description: string;
  targetId?: string;
  targetType?: string;
  changes?: object;
  ipAddress?: string;
  userAgent?: string;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await connectDB();
    
    const activity = new ActivityHistory({
      activityId: generateActivityId(),
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      action: params.action,
      module: params.module,
      description: params.description,
      targetId: params.targetId,
      targetType: params.targetType,
      changes: params.changes,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    });

    await activity.save();
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw error to avoid breaking the main operation
  }
}

export function getChangeDescription(action: string, module: string, targetName?: string): string {
  const actionMap = {
    create: 'Created',
    read: 'Viewed',
    update: 'Updated',
    delete: 'Deleted',
    login: 'Logged in',
    logout: 'Logged out',
    register: 'Registered',
    import: 'Imported',
    export: 'Exported'
  };

  const moduleMap = {
    leads: 'Lead',
    vendor_orders: 'Vendor Order',
    targets: 'Target',
    sales: 'Sale',
    followups: 'Follow-up',
    payment_records: 'Payment Record',
    users: 'User',
    auth: 'Authentication',
    chats: 'Chat',
    calls: 'Call',
    sms: 'SMS'
  };

  const actionText = actionMap[action as keyof typeof actionMap] || action;
  const moduleText = moduleMap[module as keyof typeof moduleMap] || module;
  
  if (targetName) {
    return `${actionText} ${moduleText}: ${targetName}`;
  }
  
  return `${actionText} ${moduleText}`;
}