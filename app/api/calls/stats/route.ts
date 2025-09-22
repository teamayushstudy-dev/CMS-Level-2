import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Call from '@/models/Call';
import SMS from '@/models/SMS';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';

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

    let filter: any = {};

    // Role-based filtering
    if (user.role === 'agent') {
      filter.userId = user.id;
    } else if (user.role === 'manager') {
      filter.$or = [
        { userId: user.id },
        { userId: { $in: user.assignedAgents || [] } }
      ];
    }

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayFilter = {
      ...filter,
      startTime: { $gte: today, $lt: tomorrow }
    };

    // Call stats
    const totalCalls = await Call.countDocuments(filter);
    const todayCalls = await Call.countDocuments(todayFilter);
    const completedCalls = await Call.countDocuments({ ...filter, status: 'completed' });
    const missedCalls = await Call.countDocuments({ ...filter, status: 'missed' });
    
    // Calculate total call duration
    const callDurationResult = await Call.aggregate([
      { $match: { ...filter, status: 'completed' } },
      { $group: { _id: null, totalDuration: { $sum: '$duration' } } }
    ]);
    const totalCallDuration = callDurationResult[0]?.totalDuration || 0;

    // SMS stats
    const totalSMS = await SMS.countDocuments(filter);
    const todaySMS = await SMS.countDocuments({
      ...filter,
      sentAt: { $gte: today, $lt: tomorrow }
    });
    const deliveredSMS = await SMS.countDocuments({ ...filter, status: 'delivered' });
    const failedSMS = await SMS.countDocuments({ ...filter, status: 'failed' });

    return NextResponse.json({
      calls: {
        total: totalCalls,
        today: todayCalls,
        completed: completedCalls,
        missed: missedCalls,
        totalDuration: totalCallDuration,
        averageDuration: completedCalls > 0 ? Math.round(totalCallDuration / completedCalls) : 0
      },
      sms: {
        total: totalSMS,
        today: todaySMS,
        delivered: deliveredSMS,
        failed: failedSMS,
        deliveryRate: totalSMS > 0 ? Math.round((deliveredSMS / totalSMS) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Get telecom stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}