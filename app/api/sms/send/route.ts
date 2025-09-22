import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import SMS from '@/models/SMS';
import Lead from '@/models/Lead';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { generateUniqueId } from '@/utils/idGenerator';
import { logActivity } from '@/utils/activityLogger';
import TwilioService from '@/utils/twilioService';

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

    const { toNumber, content, leadId, customerName, mediaUrls } = await request.json();

    if (!toNumber || !content) {
      return NextResponse.json({ 
        error: 'Phone number and message content are required' 
      }, { status: 400 });
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

    const twilioService = new TwilioService();
    const smsId = generateUniqueId('SMS_');

    // Format phone number
    const formattedToNumber = twilioService.formatPhoneNumber(toNumber);

    try {
      // Send SMS via Twilio
      const twilioResponse = await twilioService.sendSMS({
        to: formattedToNumber,
        body: content,
        mediaUrl: mediaUrls,
        statusCallback: `${process.env.NEXT_PUBLIC_API_URL}/api/sms/webhooks/status`
      });

      // Create SMS record
      const smsData = {
        smsId,
        messageType: 'outbound',
        fromNumber: process.env.TWILIO_PHONE_NUMBER || '+18337153810',
        toNumber: formattedToNumber,
        content,
        status: twilioResponse.status,
        sentAt: new Date(),
        leadId: leadId || undefined,
        customerName: customerName || lead?.customerName || '',
        userId: user.id,
        twilioMessageSid: twilioResponse.sid,
        twilioStatus: twilioResponse.status,
        direction: 'outbound-api',
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        mediaUrls: mediaUrls || [],
        numSegments: parseInt(twilioResponse.numSegments),
        tags: [],
        isRead: true // Outbound messages are marked as read
      };

      const sms = new SMS(smsData);
      await sms.save();

      // Log activity
      await logActivity({
        userId: user.id,
        userName: user.email,
        userRole: user.role,
        action: 'create',
        module: 'leads',
        description: `Sent SMS to ${formattedToNumber}${customerName ? ` (${customerName})` : ''}`,
        targetId: sms._id.toString(),
        targetType: 'SMS',
        changes: smsData,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });

      return NextResponse.json({
        message: 'SMS sent successfully',
        sms: sms,
        twilioSid: twilioResponse.sid
      });

    } catch (twilioError: any) {
      // Create failed SMS record
      const smsData = {
        smsId,
        messageType: 'outbound',
        fromNumber: process.env.TWILIO_PHONE_NUMBER || '+18337153810',
        toNumber: formattedToNumber,
        content,
        status: 'failed',
        sentAt: new Date(),
        failureReason: twilioError.message,
        leadId: leadId || undefined,
        customerName: customerName || lead?.customerName || '',
        userId: user.id,
        direction: 'outbound-api',
        tags: [],
        isRead: true
      };

      const sms = new SMS(smsData);
      await sms.save();

      throw twilioError;
    }

  } catch (error: any) {
    console.error('Send SMS error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send SMS' },
      { status: 500 }
    );
  }
}