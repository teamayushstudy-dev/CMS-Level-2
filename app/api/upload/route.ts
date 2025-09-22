import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import FileUpload from '@/models/FileUpload';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { handleFileUpload, validateFile } from '@/utils/fileUpload';
import { logActivity } from '@/utils/activityLogger';

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

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const module = formData.get('module') as string;
    const targetId = formData.get('targetId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (!module) {
      return NextResponse.json({ error: 'Module is required' }, { status: 400 });
    }

    // Validate files
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    const uploadedFiles = await handleFileUpload(request, module, targetId);

    await connectDB();

    // Save file records to database
    const fileRecords = [];
    for (const uploadedFile of uploadedFiles) {
      const fileRecord = new FileUpload({
        ...uploadedFile,
        uploadedBy: user.id,
        module,
        targetId
      });
      await fileRecord.save();
      fileRecords.push(fileRecord);
    }

    // Log activity
    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'create',
      module: module as any,
      description: `Uploaded ${files.length} file(s) to ${module}`,
      targetId,
      targetType: 'FileUpload',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Files uploaded successfully',
      files: fileRecords
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'File upload failed' },
      { status: 500 }
    );
  }
}

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
    const module = searchParams.get('module');
    const targetId = searchParams.get('targetId');

    const filter: any = { isActive: true };
    if (module) filter.module = module;
    if (targetId) filter.targetId = targetId;

    const files = await FileUpload.find(filter)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ files });

  } catch (error) {
    console.error('Get files error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}