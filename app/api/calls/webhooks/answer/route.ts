import { NextRequest, NextResponse } from 'next/server';
import VonageService from '@/utils/vonageService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uuid = searchParams.get('uuid');
    const conversation_uuid = searchParams.get('conversation_uuid');

    const vonageService = new VonageService();
    
    // Generate NCCO for call handling
    const ncco = vonageService.generateNCCO({
      recordCall: true,
      recordingEventUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/calls/webhooks/recording`,
      message: 'Hello, you are connected to MotorTiger CMS. Please hold while we connect you.'
    });

    return NextResponse.json(ncco);

  } catch (error) {
    console.error('Answer webhook error:', error);
    return NextResponse.json([
      {
        action: 'talk',
        text: 'Sorry, there was an error processing your call. Please try again later.'
      }
    ]);
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}