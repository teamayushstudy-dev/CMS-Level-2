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

    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    
    if (!since) {
      return NextResponse.json({ newMessages: [] });
    }

    const sinceDate = new Date(since);

    await connectDB();

    // Find chats where user is participant and has new messages since the timestamp
    const chats = await Chat.find({
      participants: user.id,
      isActive: true,
      'messages.timestamp': { $gt: sinceDate }
    })
    .populate('messages.senderId', 'name email')
    .populate('participants', 'name email role');

    const newMessages: any[] = [];

    chats.forEach(chat => {
      chat.messages.forEach((message: any) => {
        // Only include messages from other users that are newer than the timestamp
        if (message.senderId && message.senderId._id && 
            message.senderId._id.toString() !== user.id && 
            new Date(message.timestamp) > sinceDate &&
            !message.readBy.some((r: any) => r.userId.toString() === user.id)) {
          
          const chatName = chat.chatType === 'group' 
            ? chat.chatName || 'Group Chat'
            : chat.participants.find((p: any) => p._id.toString() !== user.id)?.name || 'Unknown User';

          newMessages.push({
            chatId: chat._id,
            chatName,
            chatType: chat.chatType,
            senderName: message.senderId.name,
            content: message.content,
            messageType: message.messageType,
            timestamp: message.timestamp
          });
        }
      });
    });

    // Sort by timestamp (newest first)
    newMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ newMessages });

  } catch (error) {
    console.error('Get new messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}