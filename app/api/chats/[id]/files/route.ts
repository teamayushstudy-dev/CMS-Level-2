import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Chat from '@/models/Chat';
import FileUpload from '@/models/FileUpload';
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

    const chat = await Chat.findById(params.id);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if user is participant
    if (!chat.participants.includes(user.id as any)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all files shared in this chat
    const files = await FileUpload.find({
      module: 'chats',
      targetId: params.id,
      isActive: true
    })
    .populate('uploadedBy', 'name email')
    .sort({ createdAt: -1 });

    return NextResponse.json({ files });

  } catch (error) {
    console.error('Get chat files error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}