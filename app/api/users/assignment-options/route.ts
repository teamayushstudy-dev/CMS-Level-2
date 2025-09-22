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

    const { searchParams } = new URL(request.url);
    const managerId = searchParams.get('managerId');

    if (!managerId) {
      return NextResponse.json({ error: 'Manager ID is required' }, { status: 400 });
    }

    // Get the manager and their assigned agents
    const manager = await User.findById(managerId)
      .populate('assignedAgents', 'name email role')
      .select('name email role assignedAgents');

    if (!manager) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    // Return manager + their assigned agents
    const users = [
      {
        _id: manager._id,
        name: manager.name,
        email: manager.email,
        role: manager.role
      },
      ...(manager.assignedAgents || [])
    ];

    return NextResponse.json({ users });

  } catch (error) {
    console.error('Get assignment options error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}