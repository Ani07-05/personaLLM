import { v } from 'convex/values';
import { mutation, query, action } from './_generated/server';
import { api } from './_generated/api';
import { nanoid } from 'nanoid';

async function requireUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Not authenticated');
  return identity.subject;
}

export const create = mutation({
  args: {
    conversationId: v.id('conversations'),
    parentBranchId: v.optional(v.string()),
    forkMessageId: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUserId(ctx);
    const branchId = await ctx.db.insert('branches', {
      conversationId: args.conversationId,
      parentBranchId: args.parentBranchId,
      forkMessageId: args.forkMessageId,
      name: args.name,
      createdAt: Date.now(),
    });
    return branchId as string;
  },
});

export const getForConversation = query({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, { conversationId }) => {
    return ctx.db
      .query('branches')
      .withIndex('by_conversation', (q) => q.eq('conversationId', conversationId))
      .collect();
  },
});

export const getFullHistory = action({
  args: {
    conversationId: v.id('conversations'),
    branchId: v.string(),
  },
  handler: async (ctx, { conversationId, branchId }) => {
    // Get all branches for this conversation
    const branches: Array<{
      _id: string;
      conversationId: string;
      parentBranchId?: string;
      forkMessageId?: string;
      createdAt: number;
    }> = await ctx.runQuery(api.branches.getForConversation, { conversationId });

    const branchMap = new Map(branches.map((b) => [b._id, b]));

    async function collect(currentBranchId: string): Promise<unknown[]> {
      const branch = branchMap.get(currentBranchId) ?? branches.find((b) => b._id === currentBranchId);
      if (!branch) return [];

      const ownMessages: unknown[] = await ctx.runQuery(api.messages.getForBranch, {
        conversationId,
        branchId: currentBranchId,
      });

      if (!branch.parentBranchId || !branch.forkMessageId) {
        return ownMessages;
      }

      const parentMessages: Array<{ _id: string; createdAt: number }> = await ctx.runQuery(
        api.messages.getForBranch,
        { conversationId, branchId: branch.parentBranchId }
      ) as Array<{ _id: string; createdAt: number }>;

      const forkIdx = parentMessages.findIndex((m) => m._id === branch.forkMessageId);
      const parentSlice = forkIdx >= 0 ? parentMessages.slice(0, forkIdx + 1) : parentMessages;

      const parentBranch = branchMap.get(branch.parentBranchId);
      if (parentBranch?.parentBranchId) {
        const ancestry = await collect(branch.parentBranchId);
        return [...ancestry, ...ownMessages];
      }

      return [...parentSlice, ...ownMessages];
    }

    return collect(branchId);
  },
});
