import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import VendorOrder from '@/models/VendorOrder';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';
import { validateData, vendorOrderSchema } from '@/utils/validation';
import { generateOrderNumber, generateVendorId } from '@/utils/idGenerator';
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
    if (!permissions.canRead('vendor_orders')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;
    const filter = permissions.getDataFilter();

    if (search) {
      (filter as any).$and = [
        ...((filter as any).$and || []),
        {
          $or: [
            { vendorName: { $regex: search, $options: 'i' } },
            { orderNo: { $regex: search, $options: 'i' } },
            { customerName: { $regex: search, $options: 'i' } },
          ],
        },
      ];
    }

    if (status) {
      (filter as any).orderStatus = status;
    }

    const orders = await VendorOrder.find(filter)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await VendorOrder.countDocuments(filter);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get vendor orders error:', error);
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
    if (!permissions.canCreate('vendor_orders')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = validateData(vendorOrderSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    await connectDB();

    const orderData = {
      ...body,
      orderNo: body.orderNo || generateOrderNumber(),
      vendorId: body.vendorId || generateVendorId(),
      shopName: body.shopName,
      vendorAddress: body.vendorAddress,
      createdBy: user.id,
      updatedBy: user.id,
    };

    const order = new VendorOrder(orderData);
    await order.save();

    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'create',
      module: 'vendor_orders',
      description: getChangeDescription(
        'create',
        'vendor_orders',
        order.orderNo
      ),
      targetId: order._id.toString(),
      targetType: 'VendorOrder',
      changes: orderData,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    const populatedOrder = await VendorOrder.findById(order._id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name');

    return NextResponse.json(
      { message: 'Vendor order created successfully', order: populatedOrder },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create vendor order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
