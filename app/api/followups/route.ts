import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Followup from '@/models/Followup';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';
import { logActivity, getChangeDescription } from '@/utils/activityLogger';

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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const isDone = searchParams.get('isDone');

    const skip = (page - 1) * limit;
    let filter: any = {};

    // Role-based filtering
    if (user.role === 'agent') {
      filter.assignedAgent = user.id;
    } else if (user.role === 'manager') {
      // Managers see their own and their assigned agents' follow-ups
      filter.$or = [
        { assignedAgent: user.id },
        { assignedAgent: { $in: user.assignedAgents || [] } }
      ];
    }
    // Admin sees all follow-ups (no filter)

    if (search) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { customerName: { $regex: search, $options: 'i' } },
            { customerEmail: { $regex: search, $options: 'i' } },
            { leadNumber: { $regex: search, $options: 'i' } },
            { followupId: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (isDone !== null && isDone !== undefined) {
      filter.isDone = isDone === 'true';
    }

    const followups = await Followup.find(filter)
      .populate('assignedAgent', 'name email')
      .populate('leadId', 'leadNumber')
      .populate('createdBy', 'name')
      .populate('completedBy', 'name')
      .sort({ dateCreated: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Followup.countDocuments(filter);

    return NextResponse.json({
      followups,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get followups error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}