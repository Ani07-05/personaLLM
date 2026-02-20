'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { MessageList } from '@/components/chat/MessageList';
import type { UIMessage } from 'ai';
import { GitFork, Eye } from 'lucide-react';

interface Props {
  conversation: { _id: string; title: string };
  messages: Array<{
    _id: string;
    role: string;
    parts: UIMessage['parts'];
    metadata?: unknown;
  }>;
  shareToken: string;
}

export function SharePageClient({ conversation, messages, shareToken }: Props) {
  const router = useRouter();
  const [forking, setForking] = useState(false);
  const forkConv = useMutation(api.share.forkSharedConversation);

  const uiMessages: UIMessage[] = messages.map((m) => ({
    id: m._id,
    role: m.role as UIMessage['role'],
    parts: m.parts,
    metadata: m.metadata,
  }));

  const handleFork = async () => {
    setForking(true);
    try {
      const { conversationId } = await forkConv({ shareToken });
      router.push(`/chat/${conversationId}`);
    } catch (err) {
      console.error('Fork failed:', err);
      setForking(false);
    }
  };

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Banner */}
      <div className="border-b border-border/40 bg-background/90 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{conversation.title}</p>
            <p className="text-xs text-muted-foreground">Shared conversation · read-only</p>
          </div>
        </div>

        <div>
          <SignedIn>
            <Button size="sm" onClick={handleFork} disabled={forking} className="gap-2">
              <GitFork className="h-4 w-4" />
              {forking ? 'Forking…' : 'Fork & continue'}
            </Button>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="sm" variant="outline">
                Sign in to fork this chat
              </Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>

      {/* Messages - read-only */}
      <div className="flex-1 overflow-auto">
        <MessageList
          messages={uiMessages}
          isStreaming={false}
          onFork={() => {}}
          onEdit={() => {}}
          onSuggestion={() => {}}
          readOnly
        />
      </div>
    </div>
  );
}
