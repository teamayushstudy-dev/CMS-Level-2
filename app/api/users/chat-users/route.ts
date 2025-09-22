import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import User from '@/models/User';
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

    // For chat system, all users can chat with any other active user
    // regardless of their role or assignment relationships
    const users = await User.find({
      _id: { $ne: user.id }, // Exclude current user
      isActive: true
    })
    .select('name email role')
    .sort({ name: 1 });

    return NextResponse.json({ users });

  } catch (error) {
    console.error('Get chat users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}