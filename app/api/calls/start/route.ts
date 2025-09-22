import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Call from '@/models/Call';
import Lead from '@/models/Lead';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { generateUniqueId } from '@/utils/idGenerator';
import { logActivity } from '@/utils/activityLogger';
import VonageService from '@/utils/vonageService';

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { toNumber, leadId, customerName, recordCall = true } = await request.json();

    if (!toNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    await connectDB();

    // Validate lead if provided
    let lead = null;
    if (leadId) {
      lead = await Lead.findById(leadId);
      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
    }

    const callId = generateUniqueId('CALL_');
    const vonageService = new VonageService();

    // Create call record
    const callData = {
      callId,
      callType: 'outbound',
      fromNumber: process.env.VONAGE_PHONE_NUMBER || '+1234567890',
      toNumber,
      duration: 0,
      status: 'pending',
      startTime: new Date(),
      leadId: leadId || undefined,
      customerName: customerName || lead?.customerName || '',
      userId: user.id,
      isRecorded: recordCall,
      tags: [],
      metadata: {
        userAgent: request.headers.get('user-agent') || 'unknown',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        deviceType: 'web'
      }
    };

    const call = new Call(callData);
    await call.save();

    try {
      // Initiate Vonage call
      const vonageResponse = await vonageService.makeCall({
        to: toNumber,
        from: process.env.VONAGE_PHONE_NUMBER || '+1234567890',
        answerUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/calls/webhooks/answer`,
        eventUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/calls/webhooks/event`,
        recordingUrl: recordCall ? `${process.env.NEXT_PUBLIC_API_URL}/api/calls/webhooks/recording` : undefined
      });

      // Update call with Vonage details
      call.vonageCallId = vonageResponse.uuid;
      call.vonageConversationId = vonageResponse.conversationUuid;
      call.status = 'ringing';
      await call.save();

      // Log activity
      await logActivity({
        userId: user.id,
        userName: user.email,
        userRole: user.role,
        action: 'create',
        module: 'leads',
        description: `Started call to ${toNumber}${customerName ? ` (${customerName})` : ''}`,
        targetId: call._id.toString(),
        targetType: 'Call',
        changes: callData,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });

      return NextResponse.json({
        message: 'Call initiated successfully',
        call: call,
        vonageCallId: vonageResponse.uuid
      });

    } catch (vonageError) {
      // Update call status to failed
      call.status = 'failed';
      call.notes = `Failed to initiate call: ${vonageError}`;
      await call.save();
      
      throw vonageError;
    }

  } catch (error) {
    console.error('Start call error:', error);
    return NextResponse.json(
      { error: 'Failed to start call' },
      { status: 500 }
    );
  }
}