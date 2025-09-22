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

    // Get current time and check for overdue follow-ups
    const now = new Date();
    let filter: any = { 
      isDone: false,
      $or: [
        { scheduledDate: { $lte: now } }, // Overdue
        { scheduledDate: { $exists: false } } // No scheduled date
      ]
    };

    // Role-based filtering for pending follow-ups
    if (user.role === 'agent') {
      filter.assignedAgent = user.id;
    } else if (user.role === 'manager') {
      // Managers see their own and their assigned agents' pending follow-ups
      filter.$or = [
        { assignedAgent: user.id },
        { assignedAgent: { $in: user.assignedAgents || [] } }
      ];
    }
    // Admin sees all pending follow-ups (no additional filter)

    const count = await Followup.countDocuments(filter);

    return NextResponse.json({ count });

  } catch (error) {
    console.error('Get pending followups count error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}