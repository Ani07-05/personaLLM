import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { api } from './_generated/api';

async function requireUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Not authenticated');
  return identity.subject;
}

export const forkSharedConversation = mutation({
  args: { shareToken: v.string() },
  handler: async (ctx, { shareToken }) => {
    const userId = await requireUserId(ctx);

    // Find source conversation by token
    const source = await ctx.db
      .query('conversations')
      .withIndex('by_shareToken', (q) => q.eq('shareToken', shareToken))
      .first();
    if (!source) throw new Error('Shared conversation not found');

    const now = Date.now();

    // Create new conversation with placeholder activeBranchId
    const newConvId = await ctx.db.insert('conversations', {
      userId,
      title: `Fork of ${source.title}`,
      activeBranchId: '',
      modelId: source.modelId,
      providerId: source.providerId,
      enabledTools: source.enabledTools,
      createdAt: now,
      updatedAt: now,
    });

    // Use branch Convex _id as activeBranchId
    const newBranchId = await ctx.db.insert('branches', {
      conversationId: newConvId,
      createdAt: now,
    });

    await ctx.db.patch(newConvId, { activeBranchId: newBranchId });

    // Copy messages
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_branch', (q) =>
        q.eq('conversationId', source._id).eq('branchId', source.activeBranchId)
      )
      .order('asc')
      .collect();

    for (const msg of messages) {
      await ctx.db.insert('messages', {
        conversationId: newConvId,
        branchId: newBranchId,
        role: msg.role,
        parts: msg.parts,
        metadata: msg.metadata,
        modelId: msg.modelId,
        providerId: msg.providerId,
        createdAt: msg.createdAt,
      });
    }

    return { conversationId: newConvId };
  },
});
