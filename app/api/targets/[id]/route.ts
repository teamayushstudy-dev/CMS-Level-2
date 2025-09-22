import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Target from '@/models/Target';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';
import { logActivity, getChangeDescription } from '@/utils/activityLogger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const target = await Target.findById(params.id)
      .populate('assignedUsers', 'name email')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    if (!target) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 });
    }

    return NextResponse.json({ target });

  } catch (error) {
    console.error('Get target error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    if (!permissions.canUpdate('targets')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const target = await Target.findById(params.id);
    if (!target) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 });
    }

    const body = await request.json();
    const oldValues = target.toObject();

    Object.assign(target, body);
    target.updatedBy = user.id;

    await target.save();

    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'update',
      module: 'targets',
      description: getChangeDescription('update', 'targets', target.title),
      targetId: target._id.toString(),
      targetType: 'Target',
      changes: { oldValues, newValues: body },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    const updatedTarget = await Target.findById(target._id)
      .populate('assignedUsers', 'name email')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    return NextResponse.json({
      message: 'Target updated successfully',
      target: updatedTarget
    });

  } catch (error) {
    console.error('Update target error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    if (!permissions.canDelete('targets')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const target = await Target.findById(params.id);
    if (!target) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 });
    }

    await Target.findByIdAndDelete(params.id);

    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'delete',
      module: 'targets',
      description: getChangeDescription('delete', 'targets', target.title),
      targetId: target._id.toString(),
      targetType: 'Target',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({ message: 'Target deleted successfully' });

  } catch (error) {
    console.error('Delete target error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}