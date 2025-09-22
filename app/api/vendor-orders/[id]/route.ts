import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import VendorOrder from '@/models/VendorOrder';
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
    if (!permissions.canRead('vendor_orders')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const order = await VendorOrder.findById(params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name');

    if (!order) {
      return NextResponse.json(
        { error: 'Vendor order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Get vendor order error:', error);
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
    if (!permissions.canUpdate('vendor_orders')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const order = await VendorOrder.findById(params.id);
    if (!order) {
      return NextResponse.json(
        { error: 'Vendor order not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const oldValues = order.toObject();

    Object.assign(order, body);
    order.updatedBy = user.id;

    await order.save();

    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'update',
      module: 'vendor_orders',
      description: getChangeDescription(
        'update',
        'vendor_orders',
        order.orderNo
      ),
      targetId: order._id.toString(),
      targetType: 'VendorOrder',
      changes: { oldValues, newValues: body },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    const updatedOrder = await VendorOrder.findById(order._id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name');

    return NextResponse.json({
      message: 'Vendor order updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Update vendor order error:', error);
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
    if (!permissions.canDelete('vendor_orders')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const order = await VendorOrder.findById(params.id);
    if (!order) {
      return NextResponse.json(
        { error: 'Vendor order not found' },
        { status: 404 }
      );
    }

    await VendorOrder.findByIdAndDelete(params.id);

    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'delete',
      module: 'vendor_orders',
      description: getChangeDescription(
        'delete',
        'vendor_orders',
        order.orderNo
      ),
      targetId: order._id.toString(),
      targetType: 'VendorOrder',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({ message: 'Vendor order deleted successfully' });
  } catch (error) {
    console.error('Delete vendor order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
