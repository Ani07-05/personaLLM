'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, FileText, Image, File } from 'lucide-react';

interface Props {
  projectId: Id<'projects'>;
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
  if (mimeType === 'application/pdf' || mimeType.includes('text')) return <FileText className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ProjectFilePanel({ projectId }: Props) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  type ProjectFile = { _id: Id<'files'>; name: string; mimeType: string; size: number };
  const files = useQuery(api.files.getForProject, { projectId }) as ProjectFile[] | undefined;
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const addToProject = useMutation(api.files.addToProject);
  const removeFile = useMutation(api.files.remove);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const { storageId } = await res.json();

      // For text files, also read content for inline injection
      let content: string | undefined;
      if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        content = await file.text();
        if (content.length > 50000) content = content.slice(0, 50000) + '\n[truncated]';
      }

      await addToProject({
        projectId,
        storageId,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        content,
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full border-r border-border/40">
      <div className="flex items-center justify-between p-3 border-b border-border/40">
        <h3 className="text-sm font-medium">Files</h3>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 text-xs"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleUpload}
          accept="*/*"
        />
      </div>

      <div className="flex-1 overflow-auto p-2 space-y-1">
        {(files ?? []).length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            <File className="mx-auto mb-2 h-8 w-8 opacity-30" />
            <p>No files yet</p>
            <p className="mt-1">Upload files to use in chats</p>
          </div>
        )}
        {(files ?? []).map((file) => (
          <div
            key={file._id}
            className="group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted/40 transition-colors"
          >
            <span className="text-muted-foreground shrink-0">{fileIcon(file.mimeType)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
            </div>
            <button
              onClick={() => removeFile({ id: file._id })}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
