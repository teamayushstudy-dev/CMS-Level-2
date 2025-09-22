import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { generateFileId } from './idGenerator';

export interface UploadedFile {
  fileId: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}

export async function handleFileUpload(
  request: NextRequest,
  module: string,
  targetId?: string
): Promise<UploadedFile[]> {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads', module);
    await mkdir(uploadDir, { recursive: true });

    const uploadedFiles: UploadedFile[] = [];

    for (const file of files) {
      if (!file || file.size === 0) continue;

      const fileId = generateFileId();
      const fileName = `${fileId}_${file.name}`;
      const filePath = join(uploadDir, fileName);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uint8Array = new Uint8Array(
        buffer.buffer,
        buffer.byteOffset,
        buffer.byteLength
      );

      await writeFile(filePath, uint8Array);

      uploadedFiles.push({
        fileId,
        originalName: file.name,
        fileName,
        filePath: `/uploads/${module}/${fileName}`,
        fileSize: file.size,
        mimeType: file.type,
      });
    }

    return uploadedFiles;
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('File upload failed');
  }
}

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/wmv',
  'video/flv',
  'video/webm',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed'
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for chat files

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 50MB limit' };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  // Additional validation for empty files
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }
  return { valid: true };
}
