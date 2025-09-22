import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Lead from '@/models/Lead';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';
import { validateData, noteSchema } from '@/utils/validation';
import { logActivity } from '@/utils/activityLogger';

export async function POST(
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

    const permissions = new PermissionManager(user);
    if (!permissions.canUpdate('leads')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validation = validateData(noteSchema, body);


    await connectDB();

    const lead = await Lead.findById(params.id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Add note to lead
    lead.notes.push({
      content: validation.data!.content,
      createdBy: user.id,
      createdAt: new Date()
    });

    // Add to history
    lead.history.push({
      action: 'note_added',
      changes: { note: validation.data!.content },
      performedBy: user.id,
      timestamp: new Date(),
      notes: 'Note added to lead'
    });

    lead.updatedBy = user.id;
    await lead.save();

    // Log activity
    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'update',
      module: 'leads',
      description: `Added note to lead: ${lead.customerName}`,
      targetId: lead._id.toString(),
      targetType: 'Lead',
      changes: { note: validation.data!.content },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    const updatedLead = await Lead.findById(lead._id)
      .populate('notes.createdBy', 'name email');

    return NextResponse.json({
      message: 'Note added successfully',
      notes: updatedLead?.notes || []
    });

  } catch (error) {
    console.error('Add note error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}