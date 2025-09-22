import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/dbConfig';
import User from '@/models/User';
import { validateData, userRegistrationSchema } from '@/utils/validation';
import { logActivity } from '@/utils/activityLogger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateData(userRegistrationSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const { name, email, password, role } = validation.data!;

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      isActive: true
    });

    await user.save();

    // Log activity
    await logActivity({
      userId: user._id.toString(),
      userName: name,
      userRole: role,
      action: 'register',
      module: 'auth',
      description: `New user registered: ${name} (${role})`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json(
      { 
        message: 'User registered successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}