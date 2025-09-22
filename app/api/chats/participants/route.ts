import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Chat from '@/models/Chat';
import User from '@/models/User';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { logActivity } from '@/utils/activityLogger';

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

    const { chatId, userIds, action } = await request.json();

    if (!chatId || !userIds || !Array.isArray(userIds) || !action) {
      return NextResponse.json({ 
        error: 'Chat ID, user IDs array, and action are required' 
      }, { status: 400 });
    }

    await connectDB();

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if user is participant or admin
    if (!chat.participants.includes(user.id as any) && user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only allow modifications to group chats
    if (chat.chatType !== 'group') {
      return NextResponse.json({ error: 'Can only modify group chat participants' }, { status: 400 });
    }

    if (action === 'add') {
      // Add participants
      const validUsers = await User.find({ _id: { $in: userIds }, isActive: true });
      const validUserIds = validUsers.map(u => u._id);
      
      // Add only users not already in the chat
      const newParticipants = validUserIds.filter(id => 
        !chat.participants.some(p => p.toString() === id.toString())
      );
      
      chat.participants.push(...newParticipants);
      
      await logActivity({
        userId: user.id,
        userName: user.email,
        userRole: user.role,
        action: 'update',
        module: 'chats',
        description: `Added ${newParticipants.length} participant(s) to group chat`,
        targetId: chat._id.toString(),
        targetType: 'Chat',
        changes: { action: 'add_participants', userIds: newParticipants },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
      
    } else if (action === 'remove') {
      // Remove participants (but not the creator unless they're removing themselves)
      const usersToRemove = userIds.filter(id => 
        id === user.id || chat.createdBy.toString() === user.id || user.role === 'admin'
      );
      
      chat.participants = chat.participants.filter(p => 
        !usersToRemove.includes(p.toString())
      );
      
      await logActivity({
        userId: user.id,
        userName: user.email,
        userRole: user.role,
        action: 'update',
        module: 'chats',
        description: `Removed ${usersToRemove.length} participant(s) from group chat`,
        targetId: chat._id.toString(),
        targetType: 'Chat',
        changes: { action: 'remove_participants', userIds: usersToRemove },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
    }

    await chat.save();

    const updatedChat = await Chat.findById(chat._id)
      .populate('participants', 'name email role');

    return NextResponse.json({
      message: `Participants ${action}ed successfully`,
      chat: updatedChat
    });

  } catch (error) {
    console.error('Modify participants error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}