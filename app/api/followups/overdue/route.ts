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

    // Get current time
    const now = new Date();

    let filter: any = { 
      isDone: false,
      scheduledDate: { $lte: now }
    };

    // Role-based filtering for overdue follow-ups
    if (user.role === 'agent') {
      filter.assignedAgent = user.id;
    } else if (user.role === 'manager') {
      // Managers see their own and their assigned agents' overdue follow-ups
      filter.$or = [
        { assignedAgent: user.id },
        { assignedAgent: { $in: user.assignedAgents || [] } }
      ];
    }
    // Admin sees all overdue follow-ups (no additional filter)

    const overdueFollowups = await Followup.find(filter)
      .populate('assignedAgent', 'name email')
      .populate('leadId', 'leadNumber')
      .sort({ scheduledDate: 1 });

    return NextResponse.json({
      overdueFollowups,
      count: overdueFollowups.length
    });

  } catch (error) {
    console.error('Get overdue followups error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}