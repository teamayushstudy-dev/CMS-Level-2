import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import SMS from '@/models/SMS';
import Lead from '@/models/Lead';
import { generateUniqueId } from '@/utils/idGenerator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const messageSid = body.get('MessageSid') as string;
    const from = body.get('From') as string;
    const to = body.get('To') as string;
    const messageBody = body.get('Body') as string;
    const numSegments = body.get('NumSegments') as string;
    const accountSid = body.get('AccountSid') as string;

    await connectDB();

    // Check if we already processed this message
    const existingSms = await SMS.findOne({ twilioMessageSid: messageSid });
    if (existingSms) {
      return NextResponse.json({ message: 'Message already processed' });
    }

    // Try to find related lead by phone number
    const lead = await Lead.findOne({
      $or: [
        { phoneNumber: from },
        { alternateNumber: from }
      ]
    });

    // Create SMS record
    const smsData = {
      smsId: generateUniqueId('SMS_'),
      messageType: 'inbound',
      fromNumber: from,
      toNumber: to,
      content: messageBody,
      status: 'received',
      sentAt: new Date(),
      leadId: lead?._id,
      customerName: lead?.customerName || '',
      userId: lead?.assignedAgent || null, // Assign to lead's agent if available
      twilioMessageSid: messageSid,
      twilioStatus: 'received',
      direction: 'inbound',
      accountSid,
      numSegments: parseInt(numSegments) || 1,
      tags: [],
      isRead: false
    };

    const sms = new SMS(smsData);
    await sms.save();

    console.log('Incoming SMS processed:', { from, to, messageSid });

    // Respond with TwiML to acknowledge receipt
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Message>Thank you for your message. We have received it and will respond shortly.</Message>
    </Response>`;

    return new NextResponse(twimlResponse, {
      headers: {
        'Content-Type': 'text/xml'
      }
    });

  } catch (error) {
    console.error('Incoming SMS webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}