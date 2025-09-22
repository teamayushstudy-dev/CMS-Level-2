import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import User from '@/models/User';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { logActivity } from '@/utils/activityLogger';

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only admins can unassign agents
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can unassign agents' }, { status: 403 });
    }

    const { agentId } = await request.json();

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    await connectDB();

    // Verify agent exists
    const agent = await User.findById(agentId);
    if (!agent || agent.role !== 'agent') {
      return NextResponse.json({ error: 'Invalid agent' }, { status: 400 });
    }

    const previousManagerId = agent.assignedBy;

    // Remove agent from manager's assigned agents
    if (previousManagerId) {
      await User.findByIdAndUpdate(
        previousManagerId,
        { $pull: { assignedAgents: agentId } }
      );
    }

    // Unassign agent
    agent.assignedBy = null;
    await agent.save();

    // Log activity
    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'update',
      module: 'users',
      description: `Unassigned agent ${agent.name} from manager`,
      targetId: agentId,
      targetType: 'User',
      changes: { previousManagerId, agentId },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Agent unassigned successfully',
      agent: { id: agent._id, name: agent.name, email: agent.email }
    });

  } catch (error) {
    console.error('Unassign agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}