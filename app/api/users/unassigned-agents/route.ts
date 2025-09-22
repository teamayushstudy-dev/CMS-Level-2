import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import User from '@/models/User';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only admins can view unassigned agents
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can view unassigned agents' }, { status: 403 });
    }

    await connectDB();

    // Find agents that are not assigned to any manager
    const unassignedAgents = await User.find({
      role: 'agent',
      isActive: true,
      $or: [
        { assignedBy: { $exists: false } },
        { assignedBy: null }
      ]
    }).select('-password');

    return NextResponse.json({ agents: unassignedAgents });

  } catch (error) {
    console.error('Get unassigned agents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}