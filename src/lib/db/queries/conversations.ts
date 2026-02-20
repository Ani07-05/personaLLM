import { getDB } from '../database';
import type { Conversation } from '@/types/conversation';
import { nanoid } from 'nanoid';

export async function createConversation(
  partial: Partial<Conversation> & Pick<Conversation, 'modelId' | 'providerId'>
): Promise<Conversation> {
  const db = getDB();
  const id = nanoid();
  const branchId = nanoid();
  const now = Date.now();

  const conversation: Conversation = {
    id,
    title: 'New Chat',
    activeBranchId: branchId,
    modelId: partial.modelId,
    providerId: partial.providerId,
    personaId: partial.personaId,
    enabledTools: partial.enabledTools ?? [],
    createdAt: now,
    updatedAt: now,
  };

  await db.conversations.add(conversation);

  // Create root branch
  await db.branches.add({
    id: branchId,
    conversationId: id,
    createdAt: now,
  });

  return conversation;
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  const db = getDB();
  return db.conversations.get(id);
}

export async function listConversations(): Promise<Conversation[]> {
  const db = getDB();
  return db.conversations.orderBy('updatedAt').reverse().toArray();
}

export async function updateConversation(
  id: string,
  updates: Partial<Conversation>
): Promise<void> {
  const db = getDB();
  await db.conversations.update(id, { ...updates, updatedAt: Date.now() });
}

export async function deleteConversation(id: string): Promise<void> {
  const db = getDB();
  await db.transaction('rw', [db.conversations, db.messages, db.branches, db.files], async () => {
    await db.conversations.delete(id);
    await db.messages.where('conversationId').equals(id).delete();
    await db.branches.where('conversationId').equals(id).delete();
    await db.files.where('conversationId').equals(id).delete();
  });
}

export async function pinConversation(id: string, pinned: boolean): Promise<void> {
  const db = getDB();
  await db.conversations.update(id, {
    pinnedAt: pinned ? Date.now() : undefined,
    updatedAt: Date.now(),
  });
}

export async function archiveConversation(id: string, archived: boolean): Promise<void> {
  const db = getDB();
  await db.conversations.update(id, {
    archivedAt: archived ? Date.now() : undefined,
    updatedAt: Date.now(),
  });
}
