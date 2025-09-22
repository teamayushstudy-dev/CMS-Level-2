import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Lead from '@/models/Lead';
import VendorOrder from '@/models/VendorOrder';
import PaymentRecord from '@/models/PaymentRecord';
import Sale from '@/models/Sale';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';
import { ExportService } from '@/utils/exportService';
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
    if (!permissions.canExport('leads')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { module, format = 'excel' } = await request.json();

    if (!module) {
      return NextResponse.json({ error: 'Module is required' }, { status: 400 });
    }

    await connectDB();

    let data: any[] = [];
    let filename = '';
    const filter = permissions.getDataFilter();

    switch (module) {
      case 'leads':
        data = await Lead.find(filter)
          .populate('assignedAgent', 'name')
          .lean();
        data = ExportService.formatLeadData(data);
        filename = `leads_export_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'vendor_orders':
        data = await VendorOrder.find(filter).lean();
        data = ExportService.formatVendorOrderData(data);
        filename = `vendor_orders_export_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'payment_records':
        data = await PaymentRecord.find(filter).lean();
        data = ExportService.formatPaymentData(data);
        filename = `payment_records_export_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'sales':
        if (!permissions.canRead('sales')) {
          return NextResponse.json({ error: 'Insufficient permissions for sales' }, { status: 403 });
        }
        data = await Sale.find(filter)
          .populate('assignedAgent', 'name')
          .lean();
        data = ExportService.formatSalesData(data);
        filename = `sales_export_${new Date().toISOString().split('T')[0]}`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid module' }, { status: 400 });
    }

    let fileBuffer: Buffer;
    let contentType: string;
    let fileExtension: string;

    if (format === 'csv') {
      const csvData = await ExportService.exportToCSV(data, Object.keys(data[0] || {}));
      fileBuffer = Buffer.from(csvData);
      contentType = 'text/csv';
      fileExtension = 'csv';
    } else {
      fileBuffer = await ExportService.exportToExcel(data, filename);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileExtension = 'xlsx';
    }

    // Log activity
    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'export',
      module: module as any,
      description: `Exported ${module} data (${format.toUpperCase()})`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}.${fileExtension}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}