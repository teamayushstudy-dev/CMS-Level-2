import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Lead from '@/models/Lead';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';
import { ExportService } from '@/utils/exportService';
import { logActivity } from '@/utils/activityLogger';

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
    if (!permissions.canRead('leads')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();
    const userIds = searchParams.get('userIds')?.split(',') || [];
    const format = searchParams.get('format') || 'excel';

    const dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    let baseFilter: Record<string, any> = { ...dateFilter };
    const dataFilter = permissions.getDataFilter();
    
    if (Object.keys(dataFilter).length > 0) {
      baseFilter = { $and: [dateFilter, dataFilter] };
    }

    if (userIds.length > 0) {
      const userFilter = { assignedAgent: { $in: userIds } };
      baseFilter = baseFilter.$and 
        ? { $and: [...baseFilter.$and, userFilter] }
        : { $and: [baseFilter, userFilter] };
    }

    // Get detailed analytics data
    const leads = await Lead.find(baseFilter)
      .populate('assignedAgent', 'name email')
      .lean();

    // Format data for export
    const analyticsData = leads.map(lead => ({
      'Lead Number': lead.leadNumber,
      'Customer Name': lead.customerName,
      'Description': lead.description || '',
      'Phone Number': lead.phoneNumber,
      'Email': lead.customerEmail || '',
      'Status': lead.status,
      'Assigned Agent': lead.assignedAgent?.name || '',
      'Sales Price': lead.salesPrice || 0,
      'Cost Price': lead.costPrice || 0,
      'Total Margin': lead.totalMargin || 0,
      'Tentative Margin': lead.tentativeMargin || 0,
      'Payment Mode': lead.modeOfPayment || '',
      'Payment Portal': lead.paymentPortal || '',
      'Payment Date': lead.paymentDate ? new Date(lead.paymentDate).toLocaleDateString() : '',
      'Billing State': lead.billingInfo?.state || '',
      'Shipping State': lead.shippingInfo?.state || '',
      'Product Count': lead.products?.length || 0,
      'Primary Product': lead.products?.[0]?.productName || '',
      'Product Type': lead.products?.[0]?.productType || '',
      'Make': lead.products?.[0]?.make || '',
      'Model': lead.products?.[0]?.model || '',
      'Year': lead.products?.[0]?.yearOfMfg || '',
      'Created Date': new Date(lead.createdAt).toLocaleDateString(),
      'Notes Count': lead.notes?.length || 0
    }));

    let fileBuffer: Buffer;
    let contentType: string;
    let fileExtension: string;

    if (format === 'excel') {
      fileBuffer = await ExportService.exportToExcel(analyticsData, 'analytics_report');
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileExtension = 'xlsx';
    } else {
      const csvData = await ExportService.exportToCSV(analyticsData, Object.keys(analyticsData[0] || {}));
      fileBuffer = Buffer.from(csvData);
      contentType = 'text/csv';
      fileExtension = 'csv';
    }

    // Log activity
    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'export',
      module: 'leads',
      description: `Downloaded analytics report (${format.toUpperCase()})`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="analytics_report_${new Date().toISOString().split('T')[0]}.${fileExtension}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Analytics download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}