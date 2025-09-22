import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Chat from '@/models/Chat';
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

    await connectDB();

    // Get all chats where user is a participant
    const chats = await Chat.find({
      participants: user.id,
      isActive: true
    });

    let totalUnreadCount = 0;

    chats.forEach(chat => {
      chat.messages.forEach((message: any) => {
        // Count unread messages from other users
        if (message.senderId && 
            message.senderId.toString() !== user.id && 
            !message.readBy.some((r: any) => r.userId.toString() === user.id)) {
          totalUnreadCount++;
        }
      });
    });

    return NextResponse.json({ unreadCount: totalUnreadCount });

  } catch (error) {
    console.error('Get unread count error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}