'use client';

import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import type { Attachment } from '@/components/chat/input/AttachmentBadge';

export function useFileUpload() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(async (file: File): Promise<Attachment | null> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();

      const attachment: Attachment = {
        fileId: data.content, // content is base64 or extracted text
        name: file.name,
        mimeType: file.type,
      };

      setAttachments((prev) => [...prev, attachment]);
      return attachment;
    } catch (err) {
      console.error('File upload error:', err);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const removeAttachment = useCallback((fileId: string) => {
    setAttachments((prev) => prev.filter((a) => a.fileId !== fileId));
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  return { attachments, uploading, uploadFile, removeAttachment, clearAttachments };
}
