import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/dbConfig';
import User from '@/models/User';
import { validateData, loginSchema } from '@/utils/validation';
import { logActivity } from '@/utils/activityLogger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateData(loginSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const { email, password } = validation.data!;

    await connectDB();

    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        assignedAgents: user.assignedAgents,
        assignedBy: user.assignedBy
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log activity
    await logActivity({
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      action: 'login',
      module: 'auth',
      description: `User logged in: ${user.name}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedAgents: user.assignedAgents,
        assignedBy: user.assignedBy
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}