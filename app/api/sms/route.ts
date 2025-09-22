import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import SMS from '@/models/SMS';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';

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

    const skip = (page - 1) * limit;
    let filter: any = {};

    // Role-based filtering
    if (user.role === 'agent') {
      filter.userId = user.id;
    } else if (user.role === 'manager') {
      // Managers see their own SMS and their assigned agents' SMS
      filter.$or = [
        { userId: user.id },
        { userId: { $in: user.assignedAgents || [] } }
      ];
    }
    // Admin sees all SMS (no filter)

    if (search) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { fromNumber: { $regex: search, $options: 'i' } },
            { toNumber: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
            { customerName: { $regex: search, $options: 'i' } },
            { smsId: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    if (status) {
      filter.status = status;
    }

    const messages = await SMS.find(filter)
      .populate('userId', 'name email')
      .populate('leadId', 'leadNumber customerName')
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SMS.countDocuments(filter);

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get SMS messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}