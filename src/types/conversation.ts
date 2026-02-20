import type { UIMessage } from 'ai';

// Re-export for convenience
export type { UIMessage };

// A persisted message in Dexie — extends UIMessage with our metadata
export interface PersistedMessage extends UIMessage {
  conversationId: string;
  branchId: string;
  modelId?: string;
  providerId?: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    reasoningTokens?: number;
  };
  createdAt: number;
}

export interface Branch {
  id: string;
  conversationId: string;
  parentBranchId?: string;
  forkMessageId?: string;
  name?: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  activeBranchId: string;
  modelId: string;
  providerId: string;
  personaId?: string;
  enabledTools: string[];
  createdAt: number;
  updatedAt: number;
  pinnedAt?: number;
  archivedAt?: number;
}

export interface Persona {
  id: string;
  name: string;
  systemPrompt: string;
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface FileAttachment {
  id: string;
  conversationId: string;
  messageId?: string;
  name: string;
  mimeType: string;
  size: number;
  content: string;
  createdAt: number;
}
