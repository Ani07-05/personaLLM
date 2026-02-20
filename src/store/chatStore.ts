import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ProviderId } from '@/types/provider';

interface ChatState {
  // Active conversation
  activeConversationId: string | null;
  activeBranchId: string | null;

  // Model selection
  providerId: ProviderId;
  modelId: string;

  // Tools
  enabledTools: string[];

  // Streaming state
  isStreaming: boolean;
  streamingMessageId: string | null;

  // Thinking
  thinkingEnabled: boolean;

  // Actions
  setActiveConversation: (conversationId: string | null, branchId?: string | null) => void;
  setProvider: (providerId: ProviderId, modelId: string) => void;
  toggleTool: (toolId: string) => void;
  setEnabledTools: (tools: string[]) => void;
  setStreaming: (isStreaming: boolean, messageId?: string | null) => void;
  setThinkingEnabled: (enabled: boolean) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    immer((set) => ({
      activeConversationId: null,
      activeBranchId: null,
      providerId: 'anthropic',
      modelId: 'claude-sonnet-4-6',
      enabledTools: [],
      isStreaming: false,
      streamingMessageId: null,
      thinkingEnabled: false,

      setActiveConversation: (conversationId, branchId = null) =>
        set((state) => {
          state.activeConversationId = conversationId;
          state.activeBranchId = branchId;
        }),

      setProvider: (providerId, modelId) =>
        set((state) => {
          state.providerId = providerId;
          state.modelId = modelId;
        }),

      toggleTool: (toolId) =>
        set((state) => {
          const idx = state.enabledTools.indexOf(toolId);
          if (idx >= 0) {
            state.enabledTools.splice(idx, 1);
          } else {
            state.enabledTools.push(toolId);
          }
        }),

      setEnabledTools: (tools) =>
        set((state) => {
          state.enabledTools = tools;
        }),

      setStreaming: (isStreaming, messageId = null) =>
        set((state) => {
          state.isStreaming = isStreaming;
          state.streamingMessageId = messageId;
        }),

      setThinkingEnabled: (enabled) =>
        set((state) => {
          state.thinkingEnabled = enabled;
        }),
    })),
    {
      name: 'personaLLM_chat',
      // Only persist user preferences, not transient state
      partialize: (state) => ({
        providerId: state.providerId,
        modelId: state.modelId,
        enabledTools: state.enabledTools,
        thinkingEnabled: state.thinkingEnabled,
      }),
    }
  )
);
