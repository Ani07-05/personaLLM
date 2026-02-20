'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';

interface Props {
  projectId: Id<'projects'>;
}

export function ProjectChatList({ projectId }: Props) {
  const router = useRouter();
  const conversations = useQuery(api.conversations.listByProject, { projectId }) as Array<{ _id: Id<'conversations'>; title: string }> | undefined;
  const createConv = useMutation(api.conversations.create);
  const providerId = useChatStore((s) => s.providerId);
  const modelId = useChatStore((s) => s.modelId);
  const enabledTools = useChatStore((s) => s.enabledTools);

  const handleNewChat = async () => {
    const conv = await createConv({ modelId, providerId, enabledTools, projectId });
    router.push(`/chat/${conv.id}`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border/40">
        <h3 className="text-sm font-medium">Chats</h3>
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={handleNewChat}>
          <Plus className="h-3.5 w-3.5" />
          New chat
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-2 space-y-1">
        {(conversations ?? []).length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-30" />
            <p>No chats in this project yet</p>
          </div>
        )}
        {(conversations ?? []).map((conv) => (
          <button
            key={conv._id}
            onClick={() => router.push(`/chat/${conv._id}`)}
            className="w-full flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted/40 text-left transition-colors"
          >
            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm truncate">{conv.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
