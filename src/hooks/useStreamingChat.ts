'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import type { UIMessage } from 'ai';
import { useMutation, useQuery, useAction, useConvexAuth } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useChatStore } from '@/store/chatStore';
import { useApiKeys } from './useApiKeys';
import { loadSettings } from '@/lib/storage/settingsStore';

interface UseStreamingChatOptions {
  conversationId?: string;
  branchId?: string;
  systemPrompt?: string;
  projectId?: string;
}

function toConvexId(id: string): Id<'conversations'> {
  return id as Id<'conversations'>;
}

export function useStreamingChat({
  conversationId,
  branchId,
  systemPrompt,
  projectId,
}: UseStreamingChatOptions = {}) {
  const router = useRouter();
  const { getKey } = useApiKeys();
  const providerId = useChatStore((s) => s.providerId);
  const modelId = useChatStore((s) => s.modelId);
  const enabledTools = useChatStore((s) => s.enabledTools);
  const thinkingEnabled = useChatStore((s) => s.thinkingEnabled);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const setStreaming = useChatStore((s) => s.setStreaming);

  const [settings] = useState(() => loadSettings());
  const [input, setInput] = useState('');
  const currentConvIdRef = useRef<string | null>(conversationId ?? null);
  const currentBranchIdRef = useRef<string | null>(branchId ?? null);
  const pendingNavigationRef = useRef<string | null>(null);
  const isStreamingRef = useRef(false);

  // Convex mutations/actions
  const createConv = useMutation(api.conversations.create);
  const addMsg = useMutation(api.messages.add);
  const updateConv = useMutation(api.conversations.update);
  const bulkDeleteAfter = useMutation(api.messages.bulkDeleteAfter);
  const getFullHistory = useAction(api.branches.getFullHistory);

  const { isAuthenticated } = useConvexAuth();

  // Load conversation to resolve branchId
  const convData = useQuery(
    api.conversations.get,
    isAuthenticated && conversationId ? { id: toConvexId(conversationId) } : 'skip'
  );

  const resolvedBranchId = branchId ?? convData?.activeBranchId ?? null;

  useEffect(() => {
    currentConvIdRef.current = conversationId ?? null;
    if (resolvedBranchId) currentBranchIdRef.current = resolvedBranchId;
  }, [conversationId, resolvedBranchId]);

  const chatIdRef = useRef(conversationId ?? 'new');

  const { messages, sendMessage, status, stop, error, setMessages } = useChat({
    id: chatIdRef.current,
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    experimental_throttle: 30,
    onFinish: async ({ message, messages: allMessages }) => {
      isStreamingRef.current = false;
      setStreaming(false);
      const convId = currentConvIdRef.current;
      const bId = currentBranchIdRef.current;
      if (!convId || !bId) return;

      const rawMeta = message.metadata as Record<string, unknown> | undefined;
      const messageMeta: Record<string, unknown> = { ...rawMeta };

      // Usage is forwarded via messageMetadata({ part }) when part.type === 'finish-step'
      // Shape: { usage: { inputTokens, outputTokens } }
      const sdkUsage = (rawMeta?.usage) as { inputTokens?: number; outputTokens?: number } | undefined;
      if (sdkUsage) {
        messageMeta.tokenUsage = {
          promptTokens: sdkUsage.inputTokens ?? 0,
          completionTokens: sdkUsage.outputTokens ?? 0,
        };
      }
      messageMeta.modelId = modelId;
      messageMeta.providerId = providerId;

      try {
        await addMsg({
          conversationId: toConvexId(convId),
          branchId: bId,
          role: message.role,
          parts: message.parts as never[],
          metadata: messageMeta,
          modelId,
          providerId,
        });
      } catch {
        // Already exists
      }

      await updateConv({ id: toConvexId(convId) });

      if (pendingNavigationRef.current) {
        const navTarget = pendingNavigationRef.current;
        pendingNavigationRef.current = null;
        router.push(navTarget);
      }
    },
    onError: () => {
      setStreaming(false);
      if (pendingNavigationRef.current) {
        const navTarget = pendingNavigationRef.current;
        pendingNavigationRef.current = null;
        router.push(navTarget);
      }
    },
  });

  // Load DB messages on mount / conversation change (skip during streaming)
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    if (!resolvedBranchId) return;
    if (isStreamingRef.current) return;

    async function loadMessages() {
      if (isStreamingRef.current) return;
      try {
        const dbMessages = await getFullHistory({
          conversationId: toConvexId(conversationId!),
          branchId: resolvedBranchId!,
        }) as Array<{
          _id: string;
          role: string;
          parts: UIMessage['parts'];
          metadata?: unknown;
        }>;

        if (isStreamingRef.current) return;
        const uiMessages: UIMessage[] = dbMessages.map((m) => ({
          id: m._id,
          role: m.role as UIMessage['role'],
          parts: m.parts,
          metadata: m.metadata,
        }));
        setMessages(uiMessages);
      } catch {
        // SSR guard
      }
    }
    loadMessages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, resolvedBranchId]);

  const autoTitle = useCallback(
    async (convId: string, text: string) => {
      try {
        const apiKey = await getKey(providerId);
        const res = await fetch('/api/title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text.slice(0, 200), providerId, modelId, apiKey, ollamaBaseUrl: settings.ollamaBaseUrl }),
        });
        const { title } = await res.json();
        await updateConv({ id: toConvexId(convId), title });
      } catch {
        // Non-critical
      }
    },
    [providerId, modelId, getKey, settings.ollamaBaseUrl, updateConv]
  );

  const submitMessage = useCallback(
    async (
      text: string,
      attachments?: Array<{ fileId: string; mimeType: string; name: string }>
    ) => {
      let convId = currentConvIdRef.current;
      let bId = currentBranchIdRef.current;

      if (!convId) {
        const conv = await createConv({
          modelId,
          providerId,
          enabledTools,
          projectId: projectId as Id<'projects'> | undefined,
        });
        convId = conv.id as string;
        bId = conv.activeBranchId;
        currentConvIdRef.current = convId;
        currentBranchIdRef.current = bId;
        setActiveConversation(convId, bId);
        pendingNavigationRef.current = `/chat/${convId}`;
        window.history.replaceState(null, '', `/chat/${convId}`);
      } else if (!bId) {
        bId = resolvedBranchId;
        if (!bId) {
          console.error('Could not resolve branchId');
          return;
        }
        currentBranchIdRef.current = bId;
      }

      const apiKey = await getKey(providerId);
      const tavilyKey = await getKey('tavily');
      const e2bKey = await getKey('e2b');

      const userParts: UIMessage['parts'] = [{ type: 'text', text }];
      if (attachments) {
        for (const att of attachments) {
          if (att.mimeType.startsWith('image/')) {
            // Images: fileId is a base64 data URL — send as file part
            userParts.push({
              type: 'file',
              url: att.fileId,
              mediaType: att.mimeType as `${string}/${string}`,
              filename: att.name,
            });
          } else {
            // PDFs / text: keep a display-only file part (badge in UI) + a text part for the API
            userParts.push({
              type: 'file',
              url: '',  // no real URL — display only
              mediaType: att.mimeType as `${string}/${string}`,
              filename: att.name,
            });
            userParts.push({
              type: 'text',
              text: `<attachment filename="${att.name}">\n${att.fileId}\n</attachment>`,
            });
          }
        }
      }

      // Fetch history BEFORE adding user message to avoid duplicate
      const history = await getFullHistory({
        conversationId: toConvexId(convId),
        branchId: bId,
      }) as Array<{ _id: string; role: string; parts: UIMessage['parts']; metadata?: unknown }>;

      const isFirstMessage = history.length === 0;
      const userMsgId = nanoid();
      await addMsg({
        id: userMsgId,
        conversationId: toConvexId(convId),
        branchId: bId,
        role: 'user',
        parts: userParts as never[],
      });

      if (isFirstMessage) autoTitle(convId, text);

      isStreamingRef.current = true;
      setStreaming(true, userMsgId);

      const uiHistory: UIMessage[] = history.map((m) => ({
        id: m._id,
        role: m.role as UIMessage['role'],
        parts: m.parts,
        metadata: m.metadata,
      }));
      setMessages(uiHistory);

      sendMessage(
        { id: userMsgId, role: 'user', parts: userParts },
        {
          body: {
            providerId,
            modelId,
            apiKey,
            tavilyKey,
            e2bKey,
            enabledTools,
            systemPrompt,
            thinking: thinkingEnabled,
            ollamaBaseUrl: settings.ollamaBaseUrl,
            maxSteps: 10,
          },
        }
      );
    },
    [
      providerId, modelId, enabledTools, thinkingEnabled, systemPrompt,
      resolvedBranchId, projectId, getKey, setActiveConversation, setStreaming,
      sendMessage, setMessages, createConv, addMsg, getFullHistory, settings.ollamaBaseUrl,
    ]
  );

  const editAndResubmit = useCallback(
    async (messageId: string, newText: string) => {
      const convId = currentConvIdRef.current;
      const bId = currentBranchIdRef.current;
      if (!convId || !bId) return;

      const msgIndex = messages.findIndex((m) => m.id === messageId);
      if (msgIndex === -1) return;

      const history = await getFullHistory({
        conversationId: toConvexId(convId),
        branchId: bId,
      }) as Array<{ _id: string; createdAt: number }>;

      const target = history.find((m) => m._id === messageId);
      if (target) {
        await bulkDeleteAfter({
          conversationId: toConvexId(convId),
          branchId: bId,
          afterCreatedAt: target.createdAt,
        });
      }

      const newHistory = messages.slice(0, msgIndex);
      setMessages(newHistory);
      await submitMessage(newText);
    },
    [messages, submitMessage, setMessages, getFullHistory, bulkDeleteAfter]
  );

  return {
    messages,
    input,
    setInput,
    submitMessage,
    editAndResubmit,
    isLoading: status === 'submitted' || status === 'streaming',
    stop,
    error,
    setMessages,
    status,
  };
}
