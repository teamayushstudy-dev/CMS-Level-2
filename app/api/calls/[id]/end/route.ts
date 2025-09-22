import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Call from '@/models/Call';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { logActivity } from '@/utils/activityLogger';
import VonageService from '@/utils/vonageService';

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

    const { notes, tags } = await request.json();

    await connectDB();

    const call = await Call.findById(params.id);
    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Check if user owns this call
    if (call.userId.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const vonageService = new VonageService();

    // End call in Vonage if still active
    if (call.vonageCallId && call.status !== 'completed') {
      try {
        await vonageService.hangupCall(call.vonageCallId);
      } catch (error) {
        console.error('Error hanging up Vonage call:', error);
      }
    }

    // Update call record
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - call.startTime.getTime()) / 1000);

    call.endTime = endTime;
    call.duration = duration;
    call.status = call.status === 'pending' || call.status === 'ringing' ? 'completed' : call.status;
    call.notes = notes || call.notes;
    call.tags = tags || call.tags;

    await call.save();

    // Log activity
    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'update',
      module: 'leads',
      description: `Ended call to ${call.toNumber} (Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`,
      targetId: call._id.toString(),
      targetType: 'Call',
      changes: { endTime, duration, notes, tags },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Call ended successfully',
      call
    });

  } catch (error) {
    console.error('End call error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}