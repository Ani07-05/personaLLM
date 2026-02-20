import { X, FileText, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Attachment {
  fileId: string;   // base64 data URL for images, extracted text for PDFs/text
  name: string;
  mimeType: string;
}

interface AttachmentBadgeProps {
  attachment: Attachment;
  onRemove: (fileId: string) => void;
}

export function AttachmentBadge({ attachment, onRemove }: AttachmentBadgeProps) {
  const isImage = attachment.mimeType.startsWith('image/');
  const isImagePreviewable = isImage && attachment.fileId.startsWith('data:image/');

  return (
    <div className="relative group flex items-center gap-1.5 rounded-xl bg-muted border border-border/40 overflow-hidden pr-2 py-1.5 pl-1.5 text-sm max-w-[160px]">
      {isImagePreviewable ? (
        <img
          src={attachment.fileId}
          alt={attachment.name}
          className="h-8 w-8 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="h-8 w-8 rounded-lg bg-muted-foreground/10 flex items-center justify-center shrink-0">
          {isImage ? <FileImage className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
        </div>
      )}
      <span className="truncate text-xs text-muted-foreground">{attachment.name}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4 shrink-0 rounded-full hover:bg-muted-foreground/20"
        onClick={() => onRemove(attachment.fileId)}
      >
        <X className="h-2.5 w-2.5" />
      </Button>
    </div>
  );
}
