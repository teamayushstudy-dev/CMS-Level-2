import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Lead from '@/models/Lead';
import Followup from '@/models/Followup';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';
import { validateData, followupScheduleSchema } from '@/utils/validation';
import { generateFollowupId } from '@/utils/idGenerator';
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
    const validation = validateData(followupScheduleSchema, body);


    await connectDB();

    const lead = await Lead.findById(params.id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Create follow-up record
    const followupData = {
      followupId: generateFollowupId(),
      leadId: lead._id,
      leadNumber: lead.leadNumber,
      customerName: lead.customerName,
      customerEmail: lead.customerEmail,
      phoneNumber: lead.phoneNumber,
      productName: lead.products?.[0]?.productName,
      salesPrice: lead.salesPrice,
      status: validation.data!.followupType,
      assignedAgent: lead.assignedAgent,
      scheduledDate: new Date(`${validation.data!.followupDate}T${validation.data!.followupTime}`),
      scheduledTime: validation.data!.followupTime,
      notes: validation.data!.notes ? [validation.data!.notes] : [],
      createdBy: user.id,
      updatedBy: user.id
    };

    const followup = new Followup(followupData);
    await followup.save();

    // Add to lead's scheduled followups
    lead.scheduledFollowups.push({
      followupType: validation.data!.followupType,
      scheduledDate: new Date(`${validation.data!.followupDate}T${validation.data!.followupTime}`),
      scheduledTime: validation.data!.followupTime,
      notes: validation.data!.notes,
      isCompleted: false,
      createdBy: user.id,
      createdAt: new Date()
    });

    lead.updatedBy = user.id;
    await lead.save();

    // Log activity
    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'create',
      module: 'followups',
      description: `Scheduled ${validation.data!.followupType} for lead: ${lead.customerName}`,
      targetId: followup._id.toString(),
      targetType: 'Followup',
      changes: followupData,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Follow-up scheduled successfully',
      followup
    });

  } catch (error) {
    console.error('Schedule followup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}