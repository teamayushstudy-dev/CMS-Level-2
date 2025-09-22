import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Lead from '@/models/Lead';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';

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
    if (!permissions.canRead('leads')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const dataFilter = permissions.getDataFilter();

    // Get recent notes from leads with proper filtering
    const leadsWithNotes = await Lead.find({
      ...dataFilter,
      'notes.0': { $exists: true }
    })
    .populate('notes.createdBy', 'name email')
    .select('leadNumber customerName notes')
    .sort({ 'notes.createdAt': -1 })
    .limit(10);

    // Extract and flatten notes with lead information
    const recentNotes: any[] = [];
    
    leadsWithNotes.forEach(lead => {
      lead.notes.forEach((note:any) => {
        recentNotes.push({
          _id: note._id,
          content: note.content,
          createdAt: note.createdAt,
          createdBy: note.createdBy,
          leadNumber: lead.leadNumber,
          customerName: lead.customerName,
          leadId: lead._id
        });
      });
    });

    // Sort by creation date and limit to 10 most recent
    recentNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const limitedNotes = recentNotes.slice(0, 10);

    return NextResponse.json({ notes: limitedNotes });

  } catch (error) {
    console.error('Get recent notes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}