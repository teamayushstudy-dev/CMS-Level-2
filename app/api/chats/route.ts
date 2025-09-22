import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Chat from '@/models/Chat';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { generateChatId } from '@/utils/idGenerator';
import { logActivity } from '@/utils/activityLogger';

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
    })
    .populate('participants', 'name email role')
    .populate('lastMessage.senderId', 'name')
    .sort({ 'lastMessage.timestamp': -1 });

    return NextResponse.json({ chats });

  } catch (error) {
    console.error('Get chats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const { chatType, participants, chatName } = await request.json();

    if (!chatType || !participants || participants.length === 0) {
      return NextResponse.json({ 
        error: 'Chat type and participants are required' 
      }, { status: 400 });
    }

    await connectDB();

    // For direct chats, check if chat already exists
    if (chatType === 'direct' && participants.length === 1) {
      // Check for existing active direct chat
      const existingChat = await Chat.findOne({
        chatType: 'direct',
        participants: { $all: [user.id, participants[0]], $size: 2 },
        isActive: true
      });

      if (existingChat) {
        return NextResponse.json({ chat: existingChat });
      }
    }

    const chatData = {
      chatId: generateChatId(),
      chatType,
      chatName: chatType === 'group' ? chatName : undefined,
      participants: chatType === 'direct' ? [user.id, participants[0]] : [user.id, ...participants],
      messages: [],
      isActive: true,
      createdBy: user.id
    };

    const chat = new Chat(chatData);
    await chat.save();

    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'create',
      module: 'chats' as any,
      description: `Created ${chatType} chat${chatName ? `: ${chatName}` : ''}`,
      targetId: chat._id.toString(),
      targetType: 'Chat',
      changes: chatData,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    const populatedChat = await Chat.findById(chat._id)
      .populate('participants', 'name email role');

    return NextResponse.json({ 
      message: 'Chat created successfully', 
      chat: populatedChat 
    });

  } catch (error) {
    console.error('Create chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}