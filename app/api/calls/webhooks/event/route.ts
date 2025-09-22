import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Call from '@/models/Call';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uuid, status, direction, timestamp, conversation_uuid, from, to, duration } = body;

    await connectDB();

    // Find call by Vonage UUID
    const call = await Call.findOne({ vonageCallId: uuid });
    if (!call) {
      console.error('Call not found for UUID:', uuid);
      return NextResponse.json({ message: 'Call not found' }, { status: 404 });
    }

    // Update call status based on Vonage event
    switch (status) {
      case 'started':
        call.status = 'ringing';
        break;
      case 'ringing':
        call.status = 'ringing';
        break;
      case 'answered':
        call.status = 'in-progress';
        break;
      case 'completed':
        call.status = 'completed';
        call.endTime = new Date(timestamp);
        if (duration) {
          call.duration = parseInt(duration);
        }
        break;
      case 'busy':
        call.status = 'busy';
        call.endTime = new Date(timestamp);
        break;
      case 'failed':
        call.status = 'failed';
        call.endTime = new Date(timestamp);
        break;
      case 'unanswered':
        call.status = 'no-answer';
        call.endTime = new Date(timestamp);
        break;
      case 'cancelled':
        call.status = 'failed';
        call.endTime = new Date(timestamp);
        break;
    }

    await call.save();

    return NextResponse.json({ message: 'Event processed successfully' });

  } catch (error) {
    console.error('Event webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}