import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import TwilioService from '@/utils/twilioService';

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

    // Test Twilio connection
    try {
      const twilioService = new TwilioService();
      const accountInfo = await twilioService.getAccountInfo();
      
      return NextResponse.json({ 
        status: 'connected',
        message: 'Twilio connection successful',
        account: {
          sid: accountInfo.sid,
          friendlyName: accountInfo.friendlyName,
          status: accountInfo.status
        }
      });
    } catch (error: any) {
      return NextResponse.json({ 
        status: 'error',
        message: `Twilio connection failed: ${error.message}`
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Test Twilio error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}