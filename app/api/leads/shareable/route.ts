import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Lead from '@/models/Lead';
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

    const permissions = new PermissionManager(user);
    if (!permissions.canRead('leads')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search') || '';

    // Use special lead sharing filter that respects role permissions
    const filter = permissions.getLeadSharingFilter();

    // Add search filter if provided
    if (search) {
      (filter as any).$and = [
        ...((filter as any).$and || []),
        {
          $or: [
            { customerName: { $regex: search, $options: 'i' } },
            { leadNumber: { $regex: search, $options: 'i' } },
            { customerEmail: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } },
            { status: { $regex: search, $options: 'i' } }
          ],
        },
      ];
    }

    const leads = await Lead.find(filter)
      .populate('assignedAgent', 'name email')
      .select('leadNumber customerName customerEmail phoneNumber status salesPrice costPrice totalMargin assignedAgent products')
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json({ leads });

  } catch (error) {
    console.error('Get shareable leads error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}