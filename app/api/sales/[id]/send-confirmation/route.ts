import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Sale from '@/models/Sale';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';
import { logActivity } from '@/utils/activityLogger';
import EmailService from '@/utils/emailService';

export async function POST(
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
    if (!permissions.canUpdate('sales')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const sale = await Sale.findById(params.id).populate('leadId');
    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    const emailService = new EmailService();
    const emailSent = await emailService.sendOrderConfirmation(
      sale.customerEmail,
      {
        customerName: sale.customerName,
        orderNo: sale.saleId,
        productName: sale.productName,
        salesPrice: sale.salesPrice
      }
    );

    if (emailSent) {
      sale.orderConfirmationSent = true;
      sale.orderConfirmationDate = new Date();
      sale.updatedBy = user.id;
      await sale.save();

      await logActivity({
        userId: user.id,
        userName: user.email,
        userRole: user.role,
        action: 'update',
        module: 'sales',
        description: `Order confirmation email sent for sale: ${sale.saleId}`,
        targetId: sale._id.toString(),
        targetType: 'Sale',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });

      return NextResponse.json({ 
        message: 'Order confirmation email sent successfully',
        redirectUrl: 'https://webmail.infobirth.com'
      });
    } else {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

  } catch (error) {
    console.error('Send confirmation email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}