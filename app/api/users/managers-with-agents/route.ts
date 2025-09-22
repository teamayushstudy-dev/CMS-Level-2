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

    // Only admins can view this data
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can view manager-agent relationships' }, { status: 403 });
    }

    await connectDB();

    // Get all managers with their assigned agents
    const managers = await User.find({ 
      role: 'manager', 
      isActive: true 
    })
    .populate('assignedAgents', 'name email')
    .select('-password');

    return NextResponse.json({ managers });

  } catch (error) {
    console.error('Get managers with agents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}