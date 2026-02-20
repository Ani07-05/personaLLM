'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Settings, Share2 } from 'lucide-react';
import { MessageList } from './MessageList';
import { ChatInput } from './input/ChatInput';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { ShareDialog } from './ShareDialog';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';
import { useStreamingChat } from '@/hooks/useStreamingChat';

interface ChatShellProps {
  conversationId?: string;
  branchId?: string;
}

export function ChatShell({ conversationId, branchId }: ChatShellProps) {
  const router = useRouter();
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const [shareOpen, setShareOpen] = useState(false);
  const { isAuthenticated } = useConvexAuth();

  useEffect(() => {
    if (conversationId) setActiveConversation(conversationId, branchId ?? null);
  }, [conversationId, branchId, setActiveConversation]);

  // Load conversation + persona from Convex
  const convData = useQuery(
    api.conversations.get,
    isAuthenticated && conversationId ? { id: conversationId as Id<'conversations'> } : 'skip'
  );

  const personaData = useQuery(
    api.personas.get,
    convData?.personaId ? { id: convData.personaId as Id<'personas'> } : 'skip'
  );

  // Load project for this conversation (if any) to inject instructions
  const projectData = useQuery(
    api.projects.get,
    convData?.projectId ? { id: convData.projectId } : 'skip'
  );

  const convTitle = convData?.title ?? 'New Chat';
  const personaPrompt = personaData?.systemPrompt;
  const projectInstructions = projectData?.instructions;

  // Build system prompt: persona + project instructions
  const systemPrompt = [personaPrompt, projectInstructions ? `\n\n# Project Instructions\n${projectInstructions}` : '']
    .filter(Boolean)
    .join('') || undefined;

  const createBranch = useMutation(api.branches.create);
  const updateConv = useMutation(api.conversations.update);

  const { messages, input, setInput, submitMessage, editAndResubmit, isLoading, stop, error, status } =
    useStreamingChat({ conversationId, branchId, systemPrompt });

  const handleFork = useCallback(
    async (messageId: string) => {
      if (!conversationId || !convData) return;
      try {
        const sourceBranchId = branchId ?? convData.activeBranchId;
        const newBranchId = await createBranch({
          conversationId: conversationId as Id<'conversations'>,
          parentBranchId: sourceBranchId,
          forkMessageId: messageId,
        });
        await updateConv({
          id: conversationId as Id<'conversations'>,
          activeBranchId: newBranchId,
        });
        router.push(`/chat/${conversationId}/branch/${newBranchId}`);
      } catch (err) {
        console.error('Fork failed:', err);
      }
    },
    [conversationId, branchId, convData, createBranch, updateConv, router]
  );

  const handleEdit = useCallback(
    async (messageId: string, newText: string) => {
      await editAndResubmit(messageId, newText);
    },
    [editAndResubmit]
  );

  return (
    <div className="flex flex-col h-dvh">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5 shrink-0 bg-background/90 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <span className="text-sm font-medium text-muted-foreground truncate max-w-[200px]" title={convTitle}>
            {convTitle}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && conversationId && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setShareOpen(true)}
              title="Share conversation"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        isStreaming={status === 'streaming'}
        isWaiting={status === 'submitted'}
        onFork={handleFork}
        onEdit={handleEdit}
        onSuggestion={(text) => setInput(text)}
        conversationId={conversationId}
      />

      {/* Error */}
      {error && (
        <div className="mx-auto max-w-3xl px-4 py-2 w-full">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error.message}
          </div>
        </div>
      )}

      {/* Input */}
      <ChatInput
        input={input}
        setInput={setInput}
        onSubmit={submitMessage}
        onStop={stop}
        isLoading={isLoading}
      />

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      {conversationId && (
        <ShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          conversationId={conversationId as Id<'conversations'>}
          conversationTitle={convTitle}
          messages={messages}
        />
      )}
    </div>
  );
}
