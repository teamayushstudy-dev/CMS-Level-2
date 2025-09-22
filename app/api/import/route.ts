import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Lead from '@/models/Lead';
import VendorOrder from '@/models/VendorOrder';
import PaymentRecord from '@/models/PaymentRecord';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';
import { ImportService } from '@/utils/importService';
import { generateUniqueId, generateLeadNumber, generateOrderNumber, generatePaymentId } from '@/utils/idGenerator';
import { logActivity } from '@/utils/activityLogger';

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
    if (!permissions.canImport('leads')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const module = formData.get('module') as string;

    if (!file || !module) {
      return NextResponse.json({ error: 'File and module are required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let data: any[] = [];

    // Process file based on type
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      data = await ImportService.processExcelFile(buffer);
    } else if (file.name.endsWith('.csv')) {
      const csvContent = buffer.toString();
      data = await ImportService.processCSVFile(csvContent);
    } else {
      return NextResponse.json({ error: 'Unsupported file format' }, { status: 400 });
    }

    await connectDB();

    let validData: any[] = [];
    let invalidData: any[] = [];
    let importedCount = 0;

    switch (module) {
      case 'leads':
        const leadValidation = ImportService.validateLeadData(data);
        validData = leadValidation.valid;
        invalidData = leadValidation.invalid;

        for (const item of validData) {
          try {
            const leadData = {
              ...item,
              leadId: generateUniqueId('LEAD_'),
              leadNumber: generateLeadNumber(),
              month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
              assignedAgent: user.id,
              createdBy: user.id,
              updatedBy: user.id,
              history: [{
                action: 'imported',
                changes: item,
                performedBy: user.id,
                timestamp: new Date(),
                notes: 'Lead imported from file'
              }]
            };

            const lead = new Lead(leadData);
            await lead.save();
            importedCount++;
          } catch (error) {
            invalidData.push({ data: item, errors: ['Database save failed'], rowNumber: item.rowNumber });
          }
        }
        break;

      case 'vendor_orders':
        const orderValidation = ImportService.validateVendorOrderData(data);
        validData = orderValidation.valid;
        invalidData = orderValidation.invalid;

        for (const item of validData) {
          try {
            const orderData = {
              ...item,
              orderNo: item.orderNo || generateOrderNumber(),
              vendorId: generateOrderNumber(),
              createdBy: user.id,
              updatedBy: user.id
            };

            const order = new VendorOrder(orderData);
            await order.save();
            importedCount++;
          } catch (error) {
            invalidData.push({ data: item, errors: ['Database save failed'], rowNumber: item.rowNumber });
          }
        }
        break;

      case 'payment_records':
        const paymentValidation = ImportService.validatePaymentData(data);
        validData = paymentValidation.valid;
        invalidData = paymentValidation.invalid;

        for (const item of validData) {
          try {
            const paymentData = {
              ...item,
              paymentId: generatePaymentId(),
              createdBy: user.id,
              updatedBy: user.id
            };

            const payment = new PaymentRecord(paymentData);
            await payment.save();
            importedCount++;
          } catch (error) {
            invalidData.push({ data: item, errors: ['Database save failed'], rowNumber: item.rowNumber });
          }
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid module' }, { status: 400 });
    }

    // Log activity
    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'import',
      module: module as any,
      description: `Imported ${importedCount} ${module} records from ${file.name}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Import completed',
      imported: importedCount,
      failed: invalidData.length,
      errors: invalidData.length > 0 ? invalidData : undefined
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}