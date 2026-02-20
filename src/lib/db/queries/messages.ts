import { getDB } from '../database';
import type { PersistedMessage } from '@/types/conversation';
import { nanoid } from 'nanoid';

export async function addMessage(
  partial: Omit<PersistedMessage, 'id' | 'createdAt'> & { id?: string }
): Promise<PersistedMessage> {
  const db = getDB();
  const message: PersistedMessage = {
    ...partial,
    id: partial.id ?? nanoid(),
    createdAt: Date.now(),
  };
  await db.messages.add(message);
  return message;
}

export async function getMessage(id: string): Promise<PersistedMessage | undefined> {
  const db = getDB();
  return db.messages.get(id);
}

export async function getMessagesForBranch(
  conversationId: string,
  branchId: string
): Promise<PersistedMessage[]> {
  const db = getDB();
  return db.messages
    .where('conversationId')
    .equals(conversationId)
    .filter((m) => m.branchId === branchId)
    .sortBy('createdAt');
}

export async function updateMessage(id: string, updates: Partial<PersistedMessage>): Promise<void> {
  const db = getDB();
  await db.messages.update(id, updates);
}

export async function deleteMessage(id: string): Promise<void> {
  const db = getDB();
  await db.messages.delete(id);
}
