import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import PaymentRecord from '@/models/PaymentRecord';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';
import { validateData, paymentRecordSchema } from '@/utils/validation';
import { generatePaymentId } from '@/utils/idGenerator';
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
    if (!permissions.canRead('payment_records')) {
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
            { paymentId: { $regex: search, $options: 'i' } },
            { modeOfPayment: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    if (status) {
      (filter as any).paymentStatus = status;
    }

    const payments = await PaymentRecord.find(filter)
      .populate('leadId', 'leadNumber customerName')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PaymentRecord.countDocuments(filter);

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get payment records error:', error);
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
    if (!permissions.canCreate('payment_records')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validation = validateData(paymentRecordSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    await connectDB();

    const paymentData = {
      ...body,
      paymentId: generatePaymentId(),
      createdBy: user.id,
      updatedBy: user.id
    };

    const payment = new PaymentRecord(paymentData);
    await payment.save();

    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'create',
      module: 'payment_records',
      description: getChangeDescription('create', 'payment_records', payment.paymentId),
      targetId: payment._id.toString(),
      targetType: 'PaymentRecord',
      changes: paymentData,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    const populatedPayment = await PaymentRecord.findById(payment._id)
      .populate('leadId', 'leadNumber customerName')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name');

    return NextResponse.json(
      { message: 'Payment record created successfully', payment: populatedPayment },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create payment record error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}