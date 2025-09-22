import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import User from '@/models/User';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';
import { validateData, userRegistrationSchema } from '@/utils/validation';
import { logActivity, getChangeDescription } from '@/utils/activityLogger';
import bcrypt from 'bcryptjs';

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

    const permissions = new PermissionManager(user);
    if (!permissions.canRead('users')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const assignedBy = searchParams.get('assignedBy') || '';

    const skip = (page - 1) * limit;
    let filter: any = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      // Handle multiple roles separated by comma
      const roles = role.split(',');
      if (roles.length > 1) {
        filter.role = { $in: roles };
      } else {
        filter.role = role;
      }
    }

    if (assignedBy) {
      filter.assignedBy = assignedBy;
    }

    // Managers can only see their assigned agents and themselves
    if (user.role === 'manager') {
      filter.$or = [
        { _id: user.id },
        { assignedBy: user.id }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('assignedBy', 'name email')
      .populate('assignedAgents', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
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

    const permissions = new PermissionManager(user);
    if (!permissions.canCreate('users')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const body = await request.json();
    const validation = validateData(userRegistrationSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Role restrictions based on user role
    if (user.role === 'manager' && !['agent'].includes(body.role)) {
      return NextResponse.json(
        { error: 'Managers can only create agent accounts' },
        { status: 403 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: validation.data!.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(validation.data!.password, saltRounds);

    const userData = {
      ...validation.data!,
      password: hashedPassword,
      assignedBy: body.role === 'agent' ? (user.role === 'manager' ? user.id : body.assignedTo) : undefined
    };

    const newUser = new User(userData);
    await newUser.save();

    // If creating an agent and user is manager, add to manager's assigned agents
    if (body.role === 'agent' && user.role === 'manager') {
      await User.findByIdAndUpdate(
        user.id,
        { $addToSet: { assignedAgents: newUser._id } }
      );
    }

    // If admin is creating an agent and assignedTo is provided
    if (body.role === 'agent' && user.role === 'admin' && body.assignedTo) {
      await User.findByIdAndUpdate(
        body.assignedTo,
        { $addToSet: { assignedAgents: newUser._id } }
      );
    }

    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'create',
      module: 'users',
      description: getChangeDescription('create', 'users', newUser.name),
      targetId: newUser._id.toString(),
      targetType: 'User',
      changes: { ...userData, password: '[HIDDEN]' },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    const populatedUser = await User.findById(newUser._id)
      .select('-password')
      .populate('assignedBy', 'name email')
      .populate('assignedAgents', 'name email');

    return NextResponse.json(
      { message: 'User created successfully', user: populatedUser },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}