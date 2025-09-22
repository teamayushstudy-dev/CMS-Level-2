'use client';

import { Download, FileText, Image, Video, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatFilePreviewProps {
  fileUrl: string;
  fileName: string;
  messageType: 'file' | 'image' | 'video';
  isOwn: boolean;
}

export default function ChatFilePreview({ fileUrl, fileName, messageType, isOwn }: ChatFilePreviewProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = () => {
    window.open(fileUrl, '_blank');
  };

  return (
    <div className={`border rounded p-2 ${isOwn ? 'border-blue-300' : 'border-gray-300'}`}>
      <div className="flex items-center gap-2 mb-2">
        {messageType === 'image' && <Image className="h-4 w-4" />}
        {messageType === 'video' && <Video className="h-4 w-4" />}
        {messageType === 'file' && <FileText className="h-4 w-4" />}
        <span className="text-xs font-medium truncate flex-1" title={fileName}>
          {fileName}
        </span>
      </div>

      {messageType === 'image' && (
        <div className="mb-2">
          <img
            src={fileUrl}
            alt={fileName}
            className="max-w-full h-auto max-h-40 rounded cursor-pointer"
            onClick={handleView}
          />
        </div>
      )}

      {messageType === 'video' && (
        <div className="mb-2">
          <video
            src={fileUrl}
            controls
            className="max-w-full h-auto max-h-40 rounded"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      <div className="flex gap-1">
        <Button
          size="sm"
          variant={isOwn ? "secondary" : "outline"}
          onClick={handleView}
          className="h-6 px-2 text-xs flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          View
        </Button>
        <Button
          size="sm"
          variant={isOwn ? "secondary" : "outline"}
          onClick={handleDownload}
          className="h-6 px-2 text-xs flex items-center gap-1"
        >
          <Download className="h-3 w-3" />
          Download
        </Button>
      </div>
    </div>
  );
}