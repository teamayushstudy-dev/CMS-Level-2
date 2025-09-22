import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';
import { ImportService } from '@/utils/importService';

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

    let validData: any[] = [];
    let invalidData: any[] = [];

    switch (module) {
      case 'leads':
        const leadValidation = ImportService.validateLeadData(data);
        validData = leadValidation.valid;
        invalidData = leadValidation.invalid;
        break;

      case 'vendor_orders':
        const orderValidation = ImportService.validateVendorOrderData(data);
        validData = orderValidation.valid;
        invalidData = orderValidation.invalid;
        break;

      case 'payment_records':
        const paymentValidation = ImportService.validatePaymentData(data);
        validData = paymentValidation.valid;
        invalidData = paymentValidation.invalid;
        break;

      default:
        return NextResponse.json({ error: 'Invalid module' }, { status: 400 });
    }

    return NextResponse.json({
      valid: validData,
      invalid: invalidData,
      total: data.length
    });

  } catch (error) {
    console.error('Import preview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}