'use client';

import { useCallback } from 'react';
import { ArrowUp, Square, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageTextarea } from './MessageTextarea';
import { ToolToggleBar } from './ToolToggleBar';
import { ModelSelector } from './ModelSelector';
import { FileDropzone } from './FileDropzone';
import { AttachmentBadge } from './AttachmentBadge';
import { useChatStore } from '@/store/chatStore';
import { useFileUpload } from '@/hooks/useFileUpload';

interface ChatInputProps {
  input: string;
  setInput: (v: string) => void;
  onSubmit: (text: string, attachments?: Array<{ fileId: string; mimeType: string; name: string }>) => void;
  onStop: () => void;
  isLoading: boolean;
}

export function ChatInput({ input, setInput, onSubmit, onStop, isLoading }: ChatInputProps) {
  const thinkingEnabled = useChatStore((s) => s.thinkingEnabled);
  const setThinkingEnabled = useChatStore((s) => s.setThinkingEnabled);
  const { attachments, uploading, uploadFile, removeAttachment, clearAttachments } = useFileUpload();

  const handleSubmit = useCallback(() => {
    if (!input.trim() && attachments.length === 0) return;
    onSubmit(
      input,
      attachments.length > 0
        ? attachments.map((a) => ({ fileId: a.fileId, mimeType: a.mimeType, name: a.name }))
        : undefined
    );
    setInput('');
    clearAttachments();
  }, [input, attachments, onSubmit, setInput, clearAttachments]);

  const handleFiles = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        await uploadFile(file);
      }
    },
    [uploadFile]
  );

  return (
    <div className="shrink-0 px-4 pt-2 pb-4 bg-gradient-to-t from-background via-background to-transparent">
      <div className="mx-auto max-w-3xl">
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((att) => (
              <AttachmentBadge key={att.fileId} attachment={att} onRemove={removeAttachment} />
            ))}
          </div>
        )}

        <div className="rounded-2xl bg-card outline-none" style={{ boxShadow: '0 0 0 1px oklch(1 0 0 / 6%), 0 4px 24px oklch(0 0 0 / 0.25)' }}>
          <div className="px-4 pt-3 pb-1">
            <MessageTextarea
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-1 px-3 pb-2 pt-1">
            <FileDropzone onFiles={handleFiles} uploading={uploading} />
            <ToolToggleBar />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={thinkingEnabled ? 'default' : 'ghost'}
                  size="icon"
                  className={`h-7 w-7 ${thinkingEnabled ? '' : 'text-muted-foreground'}`}
                  onClick={() => setThinkingEnabled(!thinkingEnabled)}
                >
                  <Brain className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Extended thinking
              </TooltipContent>
            </Tooltip>

            <div className="flex-1" />
            <ModelSelector />

            <div className="relative h-8 w-8">
              {isLoading ? (
                <Button
                  size="icon"
                  className="h-8 w-8 absolute inset-0 animate-in fade-in zoom-in-75 duration-150"
                  onClick={onStop}
                >
                  <Square className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  className="h-8 w-8 absolute inset-0 animate-in fade-in zoom-in-75 duration-150"
                  onClick={handleSubmit}
                  disabled={!input.trim() && attachments.length === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          personaLLM can make mistakes. All data stored locally in your browser.
        </p>
      </div>
    </div>
  );
}
