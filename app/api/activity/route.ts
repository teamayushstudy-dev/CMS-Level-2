import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import ActivityHistory from '@/models/ActivityHistory';
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

    const permissions = new PermissionManager(user);
    if (!permissions.canAccessActivityHistory()) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const action = searchParams.get('action') || '';
    const module = searchParams.get('module') || '';
    const userId = searchParams.get('userId') || '';

    const skip = (page - 1) * limit;
    const filter: any = {};

    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (action) {
      filter.action = action;
    }

    if (module) {
      filter.module = module;
    }

    if (userId) {
      filter.userId = userId;
    }

    const activities = await ActivityHistory.find(filter)
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ActivityHistory.countDocuments(filter);

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get activity history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}