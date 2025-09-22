import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';
import { ExportService } from '@/utils/exportService';

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
    if (!permissions.canImport('leads')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const module = searchParams.get('module');

    if (!module) {
      return NextResponse.json(
        { error: 'Module is required' },
        { status: 400 }
      );
    }

    let sampleData: any[] = [];
    let filename = '';

    switch (module) {
      case 'leads':
        sampleData = [
          {
            'Customer Name': 'John Doe',
            Email: 'john.doe@example.com',
            'Phone Number': '+1234567890',
            'Alternate Number': '+1234567891',
            Status: 'New',
          },
          {
            'Customer Name': 'Jane Smith',
            Email: 'jane.smith@example.com',
            'Phone Number': '+1234567892',
            'Alternate Number': '',
            Status: 'Connected',
          },
        ];
        filename = 'leads_sample';
        break;

      case 'vendor_orders':
        sampleData = [
          {
            'Shop/Vendor Name': 'ABC Auto Parts',
            'Vendor Address': 'New York',
            'Order Number': 'ORD001',
            'Customer Name': 'John Doe',
            'Product Name': 'Engine Block',
            'Order Status': 'stage1 (engine pull)',
          },
        ];
        filename = 'vendor_orders_sample';
        break;

      case 'payment_records':
        sampleData = [
          {
            'Customer Name': 'John Doe',
            'Mode of Payment': 'Credit Card',
            'Sales Price': '1500.00',
            'Payment Date': '2024-01-15',
          },
        ];
        filename = 'payment_records_sample';
        break;

      default:
        return NextResponse.json({ error: 'Invalid module' }, { status: 400 });
    }

    const fileBuffer = await ExportService.exportToExcel(sampleData, filename);

    // Convert Buffer to Uint8Array for NextResponse
    const fileArray = new Uint8Array(fileBuffer);

    return new NextResponse(fileArray, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        'Content-Length': fileArray.length.toString(),
      },
    });
  } catch (error) {
    console.error('Sample download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
