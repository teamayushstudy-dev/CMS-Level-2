import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Target from '@/models/Target';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';
import { validateData, targetSchema } from '@/utils/validation';
import { generateTargetId } from '@/utils/idGenerator';
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

    const permissions = new PermissionManager(user);
    if (!permissions.canRead('targets')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const active = searchParams.get('active');

    const skip = (page - 1) * limit;
    const filter: any = {};

    if (active === 'true') {
      filter.isActive = true;
    }

    // For agents, only show targets they are assigned to
    if (user.role === 'agent') {
      filter.assignedUsers = user.id;
    }

    const targets = await Target.find(filter)
      .populate('assignedUsers', 'name email')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Target.countDocuments(filter);

    return NextResponse.json({
      targets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get targets error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const permissions = new PermissionManager(user);
    if (!permissions.canCreate('targets')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validation = validateData(targetSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    await connectDB();

    const targetData = {
      ...validation.data!,
      targetId: generateTargetId(),
      remainingAmount: validation.data!.targetAmount,
      createdBy: user.id,
      updatedBy: user.id
    };

    const target = new Target(targetData);
    await target.save();

    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'create',
      module: 'targets',
      description: getChangeDescription('create', 'targets', target.title),
      targetId: target._id.toString(),
      targetType: 'Target',
      changes: targetData,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    const populatedTarget = await Target.findById(target._id)
      .populate('assignedUsers', 'name email')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    return NextResponse.json(
      { message: 'Target created successfully', target: populatedTarget },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create target error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}