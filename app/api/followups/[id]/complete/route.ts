import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Followup from '@/models/Followup';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { logActivity } from '@/utils/activityLogger';

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

    await connectDB();

    const followup = await Followup.findById(params.id);
    if (!followup) {
      return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });
    }

    // Check if user has permission to complete this follow-up
    const canComplete = user.role === 'admin' || 
                       followup.assignedAgent.toString() === user.id ||
                       (user.role === 'manager' && user.assignedAgents?.includes(followup.assignedAgent.toString()));

    if (!canComplete) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { notes } = await request.json();

    followup.isDone = true;
    followup.completedDate = new Date();
    followup.completedBy = user.id;
    followup.updatedBy = user.id;
    
    if (notes) {
      followup.notes.push(notes);
    }

    await followup.save();

    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'update',
      module: 'leads',
      description: `Completed follow-up for lead: ${followup.leadNumber}`,
      targetId: followup._id.toString(),
      targetType: 'Followup',
      changes: { isDone: true, notes },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Follow-up completed successfully',
      followup
    });

  } catch (error) {
    console.error('Complete followup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}