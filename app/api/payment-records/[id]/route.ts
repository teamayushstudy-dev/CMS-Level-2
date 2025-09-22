import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import PaymentRecord from '@/models/PaymentRecord';
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
    if (!permissions.canRead('payment_records')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const payment = await PaymentRecord.findById(params.id)
      .populate('leadId', 'leadNumber customerName')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name');

    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    return NextResponse.json({ payment });

  } catch (error) {
    console.error('Get payment record error:', error);
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
    if (!permissions.canUpdate('payment_records')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const payment = await PaymentRecord.findById(params.id);
    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    const body = await request.json();
    const oldValues = payment.toObject();

    Object.assign(payment, body);
    payment.updatedBy = user.id;

    await payment.save();

    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'update',
      module: 'payment_records',
      description: getChangeDescription('update', 'payment_records', payment.paymentId),
      targetId: payment._id.toString(),
      targetType: 'PaymentRecord',
      changes: { oldValues, newValues: body },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    const updatedPayment = await PaymentRecord.findById(payment._id)
      .populate('leadId', 'leadNumber customerName')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name');

    return NextResponse.json({
      message: 'Payment record updated successfully',
      payment: updatedPayment
    });

  } catch (error) {
    console.error('Update payment record error:', error);
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
    if (!permissions.canDelete('payment_records')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const payment = await PaymentRecord.findById(params.id);
    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    await PaymentRecord.findByIdAndDelete(params.id);

    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'delete',
      module: 'payment_records',
      description: getChangeDescription('delete', 'payment_records', payment.paymentId),
      targetId: payment._id.toString(),
      targetType: 'PaymentRecord',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({ message: 'Payment record deleted successfully' });

  } catch (error) {
    console.error('Delete payment record error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}