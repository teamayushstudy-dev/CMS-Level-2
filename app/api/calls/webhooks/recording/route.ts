import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Call from '@/models/Call';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      conversation_uuid, 
      recording_url, 
      recording_uuid,
      start_time,
      end_time,
      size,
      type
    } = body;

    await connectDB();

    // Find call by conversation UUID
    const call = await Call.findOne({ vonageConversationId: conversation_uuid });
    if (!call) {
      console.error('Call not found for conversation UUID:', conversation_uuid);
      return NextResponse.json({ message: 'Call not found' }, { status: 404 });
    }

    // Update call with recording information
    call.recordingUrl = recording_url;
    call.isRecorded = true;
    
    if (start_time && end_time) {
      const recordingDuration = Math.floor((new Date(end_time).getTime() - new Date(start_time).getTime()) / 1000);
      call.recordingDuration = recordingDuration;
    }

    await call.save();

    console.log('Recording saved for call:', call.callId);

    return NextResponse.json({ message: 'Recording processed successfully' });

  } catch (error) {
    console.error('Recording webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}