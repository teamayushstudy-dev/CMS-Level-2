import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Followup from '@/models/Followup';
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

    await connectDB();

    let filter: any = { isDone: false };

    // Role-based filtering for active follow-ups
    if (user.role === 'agent') {
      filter.assignedAgent = user.id;
    } else if (user.role === 'manager') {
      // Managers see their own and their assigned agents' active follow-ups
      filter.$or = [
        { assignedAgent: user.id },
        { assignedAgent: { $in: user.assignedAgents || [] } }
      ];
    }
    // Admin sees all active follow-ups (no additional filter)

    const activeFollowups = await Followup.find(filter)
      .populate('assignedAgent', 'name email')
      .populate('leadId', 'leadNumber')
      .sort({ dateCreated: -1 });

    return NextResponse.json({
      activeFollowups,
      count: activeFollowups.length
    });

  } catch (error) {
    console.error('Get active followups error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}