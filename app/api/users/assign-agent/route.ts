import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import User from '@/models/User';
import mongoose from 'mongoose';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { logActivity, getChangeDescription } from '@/utils/activityLogger';

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

    // Only admins can assign agents to managers
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can assign agents to managers' }, { status: 403 });
    }

    const { managerId, agentId } = await request.json();

    if (!managerId || !agentId) {
      return NextResponse.json({ error: 'Manager ID and Agent ID are required' }, { status: 400 });
    }

    await connectDB();

    // Verify manager exists and is a manager
    const manager = await User.findById(managerId);
    if (!manager || manager.role !== 'manager') {
      return NextResponse.json({ error: 'Invalid manager' }, { status: 400 });
    }

    // Verify agent exists and is an agent
    const agent = await User.findById(agentId);
    if (!agent || agent.role !== 'agent') {
      return NextResponse.json({ error: 'Invalid agent' }, { status: 400 });
    }

    // Remove agent from previous manager if assigned
    if (agent.assignedBy) {
      await User.findByIdAndUpdate(
        agent.assignedBy,
        { $pull: { assignedAgents: agentId } }
      );
    }

    // Assign agent to new manager
    agent.assignedBy = new mongoose.Types.ObjectId(managerId);
    await agent.save();

    // Add agent to manager's assigned agents
    await User.findByIdAndUpdate(
      managerId,
      { $addToSet: { assignedAgents: new mongoose.Types.ObjectId(agentId) } }
    );

    // Log activity
    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'update',
      module: 'users',
      description: `Assigned agent ${agent.name} to manager ${manager.name}`,
      targetId: agentId,
      targetType: 'User',
      changes: { managerId, agentId },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Agent assigned successfully',
      assignment: {
        agent: { id: agent._id, name: agent.name, email: agent.email },
        manager: { id: manager._id, name: manager.name, email: manager.email }
      }
    });

  } catch (error) {
    console.error('Assign agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}