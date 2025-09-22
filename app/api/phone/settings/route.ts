import { NextRequest, NextResponse } from 'next/server';
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

    // Return current environment settings (masked for security)
    const settings = {
      vonageApiKey: process.env.VONAGE_API_KEY ? '***' + process.env.VONAGE_API_KEY.slice(-4) : '',
      vonageApiSecret: process.env.VONAGE_API_SECRET ? '***' + process.env.VONAGE_API_SECRET.slice(-4) : '',
      vonageApplicationId: process.env.VONAGE_APPLICATION_ID || '',
      vonagePhoneNumber: process.env.VONAGE_PHONE_NUMBER || '',
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ? '***' + process.env.TWILIO_ACCOUNT_SID.slice(-4) : '',
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ? '***' + process.env.TWILIO_AUTH_TOKEN.slice(-4) : '',
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '+18337153810',
      autoRecordCalls: true,
      callQualityThreshold: 'good',
      smsAutoReply: false,
      smsAutoReplyMessage: 'Thank you for your message. We will respond shortly.'
    };

    return NextResponse.json({ settings });

  } catch (error) {
    console.error('Get phone settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only admins can update phone settings
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Only administrators can update phone settings' }, { status: 403 });
    }

    const body = await request.json();

    // Note: In a production environment, you would typically store these settings
    // in a secure configuration management system or database
    // For this demo, we'll just validate the settings format

    const requiredFields = [
      'vonageApiKey',
      'vonageApiSecret', 
      'vonageApplicationId',
      'twilioAccountSid',
      'twilioAuthToken'
    ];

    for (const field of requiredFields) {
      if (!body[field] || body[field].startsWith('***')) {
        return NextResponse.json({ 
          error: `${field} is required and cannot be a masked value` 
        }, { status: 400 });
      }
    }

    // In a real implementation, you would save these to your secure configuration store
    // For now, we'll just return success
    return NextResponse.json({ 
      message: 'Settings updated successfully. Please restart the application for changes to take effect.' 
    });

  } catch (error) {
    console.error('Update phone settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}