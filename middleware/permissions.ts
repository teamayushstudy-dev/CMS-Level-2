import { AuthUser } from './auth';

export class PermissionManager {
  private user: AuthUser;

  constructor(user: AuthUser) {
    this.user = user;
  }

  canCreate(module: string): boolean {
    switch (this.user.role) {
      case 'admin':
        return true;
      case 'manager':
        return ['leads', 'vendor_orders', 'targets', 'sales', 'payment_records', 'users'].includes(module);
      case 'agent':
        return ['leads', 'vendor_orders', 'payment_records'].includes(module);
      default:
        return false;
    }
  }

  canRead(module: string): boolean {
    switch (this.user.role) {
      case 'admin':
        return true;
      case 'manager':
        return ['leads', 'vendor_orders', 'targets', 'sales', 'followups', 'payment_records', 'users', 'chats', 'calls', 'sms'].includes(module);
      case 'agent':
        return ['leads', 'vendor_orders', 'followups', 'payment_records', 'chats', 'calls', 'sms'].includes(module);
      default:
        return false;
    }
  }

  canUpdate(module: string): boolean {
    switch (this.user.role) {
      case 'admin':
        return true;
      case 'manager':
        return ['leads', 'vendor_orders', 'targets', 'sales', 'followups', 'payment_records', 'users', 'chats'].includes(module);
      case 'agent':
        return ['leads', 'vendor_orders', 'followups', 'payment_records', 'chats'].includes(module);
      default:
        return false;
    }
  }

  canDelete(module: string): boolean {
    // Only admin can delete anything, including chats
    return this.user.role === 'admin';
  }

  canExport(module: string): boolean {
    return this.user.role !== 'agent';
  }

  canImport(module: string): boolean {
    return this.user.role !== 'agent';
  }

  canAccessActivityHistory(): boolean {
    return this.user.role === 'admin';
  }

  getDataFilter(): object {
    switch (this.user.role) {
      case 'admin':
        return {}; // Admin sees all data
      case 'manager':
        // For leads, managers see their own and assigned agents' data
        // For other modules, they see all data they have access to
        return {
          $or: [
            { createdBy: this.user.id },
            { assignedAgent: this.user.id },
            { assignedAgent: { $in: this.user.assignedAgents || [] } },
            { updatedBy: this.user.id },
            { updatedBy: { $in: this.user.assignedAgents || [] } }
          ]
        };
      case 'agent':
        // For leads, agents see only their own data
        // For chats, they can access any chat they're part of
        return {
          $or: [
            { createdBy: this.user.id },
            { assignedAgent: this.user.id },
            { updatedBy: this.user.id }
          ]
        };
      default:
        return { _id: null }; // No access
    }
  }

  // Special method for chat data filtering - more permissive
  getChatDataFilter(): object {
    // For chats, all users can participate in any chat they're added to
    // The actual permission check is done at the chat participant level
    return {};
  }

  // Special method for lead data filtering for sharing
  getLeadSharingFilter(): object {
    switch (this.user.role) {
      case 'admin':
        return {}; // Admin can share any lead
      case 'manager':
        return {
          $or: [
            { createdBy: this.user.id },
            { assignedAgent: this.user.id },
            { assignedAgent: { $in: this.user.assignedAgents || [] } },
            { updatedBy: this.user.id },
            { updatedBy: { $in: this.user.assignedAgents || [] } }
          ]
        };
      case 'agent':
        return {
          $or: [
            { createdBy: this.user.id },
            { assignedAgent: this.user.id },
            { updatedBy: this.user.id }
          ]
        };
      default:
        return { _id: null }; // No access
    }
  }
}