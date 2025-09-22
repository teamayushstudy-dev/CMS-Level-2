import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import VonageService from '@/utils/vonageService';

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

    // Test Vonage connection
    try {
      const vonageService = new VonageService();
      
      // Try to get account balance or make a test API call
      // This is a simple test to verify credentials work
      const testResult = await fetch('https://rest.nexmo.com/account/get-balance', {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.VONAGE_API_KEY}:${process.env.VONAGE_API_SECRET}`).toString('base64')}`
        }
      });

      if (testResult.ok) {
        const balance = await testResult.json();
        return NextResponse.json({ 
          status: 'connected',
          message: 'Vonage connection successful',
          balance: balance.value
        });
      } else {
        return NextResponse.json({ 
          status: 'error',
          message: 'Vonage connection failed - Invalid credentials'
        }, { status: 400 });
      }
    } catch (error: any) {
      return NextResponse.json({ 
        status: 'error',
        message: `Vonage connection failed: ${error.message}`
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Test Vonage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}