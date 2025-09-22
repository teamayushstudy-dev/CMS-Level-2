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
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return NextResponse.json({ results: [] });
    }

    await connectDB();

    // Search in chat messages
    const chats = await Chat.find({
      participants: user.id,
      isActive: true,
      $or: [
        { 'messages.content': { $regex: query, $options: 'i' } },
        { chatName: { $regex: query, $options: 'i' } }
      ]
    })
    .populate('messages.senderId', 'name email')
    .populate('participants', 'name email role')
    .limit(20);

    const results: any[] = [];

    chats.forEach(chat => {
      // Find matching messages
      const matchingMessages = chat.messages.filter((message: any) =>
        message.content.toLowerCase().includes(query.toLowerCase())
      );

      matchingMessages.forEach((message: any) => {
        const chatName = chat.chatType === 'group' 
          ? chat.chatName || 'Group Chat'
          : chat.participants.find((p: any) => p._id.toString() !== user.id)?.name || 'Unknown User';

        results.push({
          chatId: chat._id,
          chatName,
          chatType: chat.chatType,
          messageId: message.messageId,
          content: message.content,
          senderName: message.senderId.name,
          timestamp: message.timestamp,
          messageType: message.messageType
        });
      });
    });

    // Sort by timestamp (newest first)
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ results: results.slice(0, 50) });

  } catch (error) {
    console.error('Chat search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}