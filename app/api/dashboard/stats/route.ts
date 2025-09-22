import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Lead from '@/models/Lead';
import VendorOrder from '@/models/VendorOrder';
import Sale from '@/models/Sale';
import PaymentRecord from '@/models/PaymentRecord';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';

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

    await connectDB();

    const permissions = new PermissionManager(user);
    const dataFilter = permissions.getDataFilter();

    // Get leads stats
    const totalLeads = await Lead.countDocuments(dataFilter);
    const activeLeads = await Lead.countDocuments({
      ...dataFilter,
      status: { $nin: ['Product Purchased'] }
    });

    // Get sales stats
    let totalSales = await Lead.countDocuments({
      ...dataFilter,
      status: 'Product Purchased'
    });

    let totalRevenue = 0;
    if (permissions.canRead('sales')) {
      totalSales = await Sale.countDocuments(dataFilter);
      const salesData = await Sale.find(dataFilter).select('salesPrice');
      totalRevenue = salesData.reduce((sum, sale) => sum + (sale.salesPrice || 0), 0);
    }

    // Get orders stats
    const totalOrders = await VendorOrder.countDocuments(dataFilter);
    const pendingOrders = await VendorOrder.countDocuments({
      ...dataFilter,
      orderStatus: { $nin: ['stage6 (delivered)'] }
    });
    const completedOrders = await VendorOrder.countDocuments({
      ...dataFilter,
      orderStatus: 'stage6 (delivered)'
    });

    // Get payment stats
    const totalPayments = await PaymentRecord.countDocuments(dataFilter);
    const completedPayments = await PaymentRecord.countDocuments({
      ...dataFilter,
      paymentStatus: 'completed'
    });

    return NextResponse.json({
      totalLeads,
      activeLeads,
      totalSales,
      totalRevenue,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalPayments,
      completedPayments
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}