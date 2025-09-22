import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Chat from '@/models/Chat';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const chat = await Chat.findById(params.id)
      .populate('participants', 'name email role')
      .populate('messages.senderId', 'name email');

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if user is participant
    if (!chat.participants.some((p: any) => p._id.toString() === user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ chat });

  } catch (error) {
    console.error('Get chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const chat = await Chat.findById(params.id);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Only admin can delete any chat
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Only administrators can delete chats' }, { status: 403 });
    }

    // Hard delete the chat and all its messages
    await Chat.findByIdAndDelete(params.id);

    // Log the deletion activity
    const { logActivity } = await import('@/utils/activityLogger');
    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'delete',
      module: 'chats',
      description: `Permanently deleted chat: ${chat.chatType === 'group' ? chat.chatName || 'Group Chat' : 'Direct Chat'}`,
      targetId: chat._id.toString(),
      targetType: 'Chat',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({ message: 'Chat permanently deleted successfully' });

  } catch (error) {
    console.error('Delete chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}