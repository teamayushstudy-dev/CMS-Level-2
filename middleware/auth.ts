import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'agent';
  assignedAgents?: string[];
  assignedBy?: string;
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      assignedAgents: decoded.assignedAgents,
      assignedBy: decoded.assignedBy
    };
  } catch (error) {
    return null;
  }
}

export function extractTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export function checkPermission(userRole: string, action: string, targetUserId?: string, userId?: string): boolean {
  switch (userRole) {
    case 'admin':
      return true; // Admin has all permissions
    
    case 'manager':
      if (action === 'delete') return false; // Managers cannot delete
      if (targetUserId && userId) {
        // Managers can only access their own data and their assigned agents' data
        return targetUserId === userId; // This would need more complex logic for assigned agents
      }
      return true;
    
    case 'agent':
      if (action === 'delete') return false; // Agents cannot delete
      if (targetUserId && userId) {
        return targetUserId === userId; // Agents can only access their own data
      }
      return true;
    
    default:
      return false;
  }
}

export function hasModuleAccess(userRole: string, module: string): boolean {
  const moduleAccess = {
    admin: ['leads', 'vendor_orders', 'targets', 'sales', 'payment_records', 'users', 'activity_history'],
    manager: ['leads', 'vendor_orders', 'targets', 'sales', 'payment_records', 'users'],
    agent: ['leads', 'vendor_orders', 'payment_records']
  };

  return moduleAccess[userRole as keyof typeof moduleAccess]?.includes(module) || false;
}