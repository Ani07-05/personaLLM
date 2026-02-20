import { getDB } from '../database';
import type { Branch, PersistedMessage } from '@/types/conversation';
import { nanoid } from 'nanoid';

export async function createBranch(
  conversationId: string,
  parentBranchId: string,
  forkMessageId: string,
  name?: string
): Promise<Branch> {
  const db = getDB();
  const branch: Branch = {
    id: nanoid(),
    conversationId,
    parentBranchId,
    forkMessageId,
    name,
    createdAt: Date.now(),
  };
  await db.branches.add(branch);
  return branch;
}

export async function getBranch(id: string): Promise<Branch | undefined> {
  const db = getDB();
  return db.branches.get(id);
}

export async function getBranchesForConversation(conversationId: string): Promise<Branch[]> {
  const db = getDB();
  return db.branches.where('conversationId').equals(conversationId).toArray();
}

export async function forkFromMessage(
  conversationId: string,
  sourceBranchId: string,
  forkMessageId: string
): Promise<Branch> {
  const db = getDB();
  const newBranch: Branch = {
    id: nanoid(),
    conversationId,
    parentBranchId: sourceBranchId,
    forkMessageId,
    createdAt: Date.now(),
  };
  await db.branches.add(newBranch);
  return newBranch;
}

/**
 * Reconstructs the full message history for a branch by walking up the branch tree.
 * Returns messages in chronological order.
 */
export async function getFullMessageHistory(
  conversationId: string,
  branchId: string
): Promise<PersistedMessage[]> {
  const db = getDB();

  async function collect(currentBranchId: string): Promise<PersistedMessage[]> {
    const branch = await db.branches.get(currentBranchId);
    if (!branch) return [];

    const ownMessages = await db.messages
      .where('conversationId')
      .equals(conversationId)
      .filter((m) => m.branchId === currentBranchId)
      .sortBy('createdAt');

    if (!branch.parentBranchId || !branch.forkMessageId) {
      return ownMessages;
    }

    // Get parent messages up to and including the fork message
    const parentMessages = await db.messages
      .where('conversationId')
      .equals(conversationId)
      .filter((m) => m.branchId === branch.parentBranchId!)
      .sortBy('createdAt');

    const forkIdx = parentMessages.findIndex((m) => m.id === branch.forkMessageId);
    const parentSlice =
      forkIdx >= 0 ? parentMessages.slice(0, forkIdx + 1) : parentMessages;

    // Recursively get ancestry if grandparent exists
    const parentBranch = await db.branches.get(branch.parentBranchId);
    if (parentBranch?.parentBranchId) {
      const ancestry = await collect(branch.parentBranchId!);
      return [...ancestry, ...ownMessages];
    }

    return [...parentSlice, ...ownMessages];
  }

  return collect(branchId);
}
