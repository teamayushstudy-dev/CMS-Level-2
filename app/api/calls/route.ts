import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Call from '@/models/Call';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';
import { logActivity } from '@/utils/activityLogger';

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
    const type = searchParams.get('type') || '';

    const skip = (page - 1) * limit;
    let filter: any = {};

    // Role-based filtering
    if (user.role === 'agent') {
      filter.userId = user.id;
    } else if (user.role === 'manager') {
      // Managers see their own calls and their assigned agents' calls
      filter.$or = [
        { userId: user.id },
        { userId: { $in: user.assignedAgents || [] } }
      ];
    }
    // Admin sees all calls (no filter)

    if (search) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { fromNumber: { $regex: search, $options: 'i' } },
            { toNumber: { $regex: search, $options: 'i' } },
            { customerName: { $regex: search, $options: 'i' } },
            { callId: { $regex: search, $options: 'i' } },
            { notes: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (type) {
      filter.callType = type;
    }

    const calls = await Call.find(filter)
      .populate('userId', 'name email')
      .populate('leadId', 'leadNumber customerName')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Call.countDocuments(filter);

    return NextResponse.json({
      calls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get calls error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}