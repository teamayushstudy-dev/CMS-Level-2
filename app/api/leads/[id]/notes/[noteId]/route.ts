import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Lead from '@/models/Lead';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';
import { validateData, noteSchema } from '@/utils/validation';
import { logActivity } from '@/utils/activityLogger';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
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

    // Find and update the specific note
    const noteIndex = lead.notes.findIndex((note:any) => note._id.toString() === params.noteId);
    if (noteIndex === -1) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const oldContent = lead.notes[noteIndex].content;
    lead.notes[noteIndex].content = validation.data!.content;

    // Add to history
    lead.history.push({
      action: 'note_updated',
      changes: { 
        noteId: params.noteId,
        oldContent,
        newContent: validation.data!.content 
      },
      performedBy: user.id,
      timestamp: new Date(),
      notes: 'Note content updated'
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
      description: `Updated note for lead: ${lead.customerName}`,
      targetId: lead._id.toString(),
      targetType: 'Lead',
      changes: { noteId: params.noteId, oldContent, newContent: validation.data!.content },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Note updated successfully'
    });

  } catch (error) {
    console.error('Update note error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}