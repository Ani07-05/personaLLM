'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { Copy, Check, Share2, FileJson, FileText, Link, Link2Off } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { UIMessage } from 'ai';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: Id<'conversations'>;
  conversationTitle: string;
  messages: UIMessage[];
}

function messagesToMarkdown(title: string, messages: UIMessage[]): string {
  const lines: string[] = [`# ${title}`, '', `_Exported from personaLLM · ${new Date().toLocaleString()}_`, ''];
  for (const msg of messages) {
    const role = msg.role === 'user' ? '**You**' : '**Assistant**';
    lines.push(`## ${role}`, '');
    for (const part of msg.parts) {
      if (part.type === 'text') lines.push(part.text);
      else if (part.type === 'reasoning')
        lines.push(`> _Thinking: ${part.text.slice(0, 200)}${part.text.length > 200 ? '…' : ''}_`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function messagesToJson(title: string, messages: UIMessage[]): string {
  return JSON.stringify(
    {
      title,
      exportedAt: new Date().toISOString(),
      messages: messages.map((m) => ({ role: m.role, parts: m.parts, metadata: m.metadata })),
    },
    null,
    2
  );
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function safeFilename(title: string): string {
  return title.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 60);
}

export function ShareDialog({ open, onOpenChange, conversationId, conversationTitle, messages }: ShareDialogProps) {
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generating, setGenerating] = useState(false);

  const conv = useQuery(api.conversations.get, { id: conversationId });
  const generateToken = useMutation(api.conversations.generateShareToken);
  const revokeToken = useMutation(api.conversations.revokeShareToken);

  const shareUrl = conv?.shareToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${conv.shareToken}`
    : null;

  const handleGenerateLink = async () => {
    setGenerating(true);
    try {
      await generateToken({ id: conversationId });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRevokeLink = async () => {
    await revokeToken({ id: conversationId });
  };

  const handleDownloadMd = useCallback(() => {
    downloadFile(messagesToMarkdown(conversationTitle, messages), `${safeFilename(conversationTitle)}.md`, 'text/markdown');
  }, [conversationTitle, messages]);

  const handleDownloadJson = useCallback(() => {
    downloadFile(messagesToJson(conversationTitle, messages), `${safeFilename(conversationTitle)}.json`, 'application/json');
  }, [conversationTitle, messages]);

  const handleCopyMarkdown = useCallback(async () => {
    await navigator.clipboard.writeText(messagesToMarkdown(conversationTitle, messages));
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  }, [conversationTitle, messages]);

  const msgCount = messages.length;
  const wordCount = messages
    .flatMap((m) => m.parts)
    .filter((p) => p.type === 'text')
    .reduce((acc, p) => acc + (p as { type: 'text'; text: string }).text.split(/\s+/).length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" />
            Share Conversation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground flex gap-6">
            <span><span className="font-medium text-foreground">{msgCount}</span> messages</span>
            <span><span className="font-medium text-foreground">{wordCount.toLocaleString()}</span> words</span>
          </div>

          {/* Share link section */}
          <div className="rounded-xl border border-border/60 p-3 space-y-2">
            <p className="text-sm font-medium">Public share link</p>
            {shareUrl ? (
              <>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    className="flex-1 rounded-md bg-muted/40 border border-border/50 px-2 py-1.5 text-xs font-mono outline-none truncate"
                  />
                  <Button size="sm" variant="outline" onClick={handleCopyLink} className="shrink-0">
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Anyone with this link can view the conversation. Signed-in users can fork it.</p>
                <Button size="sm" variant="ghost" className="text-destructive text-xs h-7" onClick={handleRevokeLink}>
                  <Link2Off className="h-3 w-3 mr-1.5" />
                  Revoke link
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Generate a public link to share this conversation.</p>
                <Button size="sm" onClick={handleGenerateLink} disabled={generating} className="gap-2">
                  <Link className="h-3.5 w-3.5" />
                  {generating ? 'Generating…' : 'Generate share link'}
                </Button>
              </>
            )}
          </div>

          {/* Export section */}
          <div className="grid gap-2">
            <Button variant="outline" className="justify-start gap-3 h-11" onClick={handleCopyMarkdown}>
              {copiedMd ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              <div className="text-left">
                <div className="text-sm font-medium">Copy as Markdown</div>
                <div className="text-xs text-muted-foreground">Paste into Notion, Obsidian, etc.</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start gap-3 h-11" onClick={handleDownloadMd}>
              <FileText className="h-4 w-4" />
              <div className="text-left">
                <div className="text-sm font-medium">Download as Markdown</div>
                <div className="text-xs text-muted-foreground">.md file with full conversation</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start gap-3 h-11" onClick={handleDownloadJson}>
              <FileJson className="h-4 w-4" />
              <div className="text-left">
                <div className="text-sm font-medium">Download as JSON</div>
                <div className="text-xs text-muted-foreground">Structured export for re-importing</div>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
