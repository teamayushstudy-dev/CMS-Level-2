import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Sale from '@/models/Sale';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';
import { logActivity, getChangeDescription } from '@/utils/activityLogger';
import EmailService from '@/utils/emailService';

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
    if (!permissions.canRead('sales')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
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
        ...(((filter as any).$and || [])),
        {
          $or: [
            { customerName: { $regex: search, $options: 'i' } },
            { customerEmail: { $regex: search, $options: 'i' } },
            { saleId: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    if (status) {
      (filter as any).status = status;
    }

    const sales = await Sale.find(filter)
      .populate('leadId', 'leadNumber customerName')
      .populate('assignedAgent', 'name email')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Sale.countDocuments(filter);

    return NextResponse.json({
      sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get sales error:', error);
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
    if (!permissions.canCreate('sales')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();

    await connectDB();

    const saleData = {
      ...body,
      createdBy: user.id,
      updatedBy: user.id
    };

    const sale = new Sale(saleData);
    await sale.save();

    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'create',
      module: 'sales',
      description: getChangeDescription('create', 'sales', sale.saleId),
      targetId: sale._id.toString(),
      targetType: 'Sale',
      changes: saleData,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    const populatedSale = await Sale.findById(sale._id)
      .populate('leadId', 'leadNumber customerName')
      .populate('assignedAgent', 'name email')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    return NextResponse.json(
      { message: 'Sale created successfully', sale: populatedSale },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create sale error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}