import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Target from '@/models/Target';
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

    let filter: any = { isActive: true };

    // For agents, only show targets they are assigned to
    if (user.role === 'agent') {
      filter.assignedUsers = user.id;
    }

    const targets = await Target.find(filter);

    const totalTarget = targets.reduce((sum, target) => sum + target.targetAmount, 0);
    const achievedTarget = targets.reduce((sum, target) => sum + target.achievedAmount, 0);

    return NextResponse.json({
      totalTarget,
      achievedTarget,
      remainingTarget: totalTarget - achievedTarget,
      progressPercentage: totalTarget > 0 ? (achievedTarget / totalTarget) * 100 : 0
    });

  } catch (error) {
    console.error('Get target summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}