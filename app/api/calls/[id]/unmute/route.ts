import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Call from '@/models/Call';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
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

    await connectDB();

    const call = await Call.findById(params.id);
    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Check if user owns this call
    if (call.userId.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!call.vonageCallId) {
      return NextResponse.json({ error: 'No active Vonage call found' }, { status: 400 });
    }

    const vonageService = new VonageService();
    const success = await vonageService.unmuteCall(call.vonageCallId);

    if (success) {
      return NextResponse.json({ message: 'Call unmuted successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to unmute call' }, { status: 500 });
    }

  } catch (error) {
    console.error('Unmute call error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}