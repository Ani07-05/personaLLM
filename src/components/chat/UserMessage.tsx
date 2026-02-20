'use client';

import { memo, useState, useRef, useEffect, useCallback } from 'react';
import type { UIMessage } from 'ai';
import { FileText, FileImage, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserMessageProps {
  message: UIMessage;
  onEdit?: (messageId: string, newText: string) => void;
}

export const UserMessage = memo(function UserMessage({ message, onEdit }: UserMessageProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const rawText = message.parts
    .filter((p) => p.type === 'text' && !(p as { type: 'text'; text: string }).text.startsWith('<attachment filename='))
    .map((p) => (p as { type: 'text'; text: string }).text)
    .join('');

  const startEdit = useCallback(() => {
    setDraft(rawText);
    setEditing(true);
  }, [rawText]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setDraft('');
  }, []);

  const submitEdit = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === rawText) {
      cancelEdit();
      return;
    }
    onEdit?.(message.id, trimmed);
    setEditing(false);
  }, [draft, rawText, message.id, onEdit, cancelEdit]);

  // Auto-resize textarea and focus on edit start
  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
      const el = textareaRef.current;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [editing]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitEdit();
      }
      if (e.key === 'Escape') {
        cancelEdit();
      }
    },
    [submitEdit, cancelEdit]
  );

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  }, []);

  const fileParts = message.parts.filter((p) => p.type === 'file');

  if (editing) {
    return (
      <div className="flex justify-end animate-in fade-in duration-150">
        <div className="max-w-[80%] w-full">
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              rows={1}
              className="w-full resize-none bg-transparent text-foreground text-sm leading-relaxed outline-none placeholder:text-muted-foreground overflow-hidden"
            />
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-xs text-muted-foreground mr-auto">Enter to submit · Esc to cancel</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit} title="Cancel">
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" className="h-7 w-7" onClick={submitEdit} title="Submit edit">
                <Check className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300 group">
      <div className="flex items-start gap-2">
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={startEdit}
            title="Edit message"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-white/5 dark:bg-white/5 px-4 py-2.5">
          {message.parts.map((part, i) => {
            if (part.type === 'text') {
              // Hide internal attachment content markers (used for API context only)
              if ((part as { type: 'text'; text: string }).text.startsWith('<attachment filename=')) return null;
              return (
                <p key={i} className="whitespace-pre-wrap leading-relaxed text-sm font-[450] text-foreground">
                  {(part as { type: 'text'; text: string }).text}
                </p>
              );
            }
            if (part.type === 'file') {
              const isImage = part.mediaType?.startsWith('image/');
              const isPdf = part.mediaType === 'application/pdf';
              const url = (part as { type: 'file'; url?: string; mediaType?: string; filename?: string }).url;
              const isBase64Image = isImage && url?.startsWith('data:image/');

              if (isBase64Image) {
                return (
                  <div key={i} className="mt-2">
                    <img
                      src={url}
                      alt={part.filename ?? 'Image'}
                      className="max-w-xs max-h-64 rounded-xl object-cover border border-white/10"
                    />
                    <p className="mt-1 text-xs text-foreground/50">{part.filename}</p>
                  </div>
                );
              }

              return (
                <div
                  key={i}
                  className="mt-2 flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground/70"
                >
                  {isPdf ? <FileText className="h-4 w-4 shrink-0 text-red-400/70" /> : <FileImage className="h-4 w-4 shrink-0" />}
                  <span className="truncate max-w-[200px]">{part.filename ?? 'Attached file'}</span>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
});
