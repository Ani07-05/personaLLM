import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

async function requireUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Not authenticated');
  return identity.subject;
}

export const add = mutation({
  args: {
    id: v.optional(v.string()),
    conversationId: v.id('conversations'),
    branchId: v.string(),
    role: v.string(),
    parts: v.array(v.any()),
    metadata: v.optional(v.any()),
    modelId: v.optional(v.string()),
    providerId: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireUserId(ctx);
    const now = args.createdAt ?? Date.now();
    const docId = await ctx.db.insert('messages', {
      conversationId: args.conversationId,
      branchId: args.branchId,
      role: args.role,
      parts: args.parts,
      metadata: args.metadata,
      modelId: args.modelId,
      providerId: args.providerId,
      createdAt: now,
    });
    return docId;
  },
});

export const getForBranch = query({
  args: {
    conversationId: v.id('conversations'),
    branchId: v.string(),
  },
  handler: async (ctx, { conversationId, branchId }) => {
    return ctx.db
      .query('messages')
      .withIndex('by_branch', (q) =>
        q.eq('conversationId', conversationId).eq('branchId', branchId)
      )
      .order('asc')
      .collect();
  },
});

export const bulkDeleteAfter = mutation({
  args: {
    conversationId: v.id('conversations'),
    branchId: v.string(),
    afterCreatedAt: v.number(),
  },
  handler: async (ctx, { conversationId, branchId, afterCreatedAt }) => {
    await requireUserId(ctx);
    const toDelete = await ctx.db
      .query('messages')
      .withIndex('by_branch', (q) =>
        q.eq('conversationId', conversationId).eq('branchId', branchId)
      )
      .filter((q) => q.gte(q.field('createdAt'), afterCreatedAt))
      .collect();
    for (const m of toDelete) await ctx.db.delete(m._id);
  },
});

export const usageStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const userId = identity.subject;
    const conversations = await ctx.db
      .query('conversations')
      .withIndex('by_user_updatedAt', (q) => q.eq('userId', userId))
      .collect();

    const results = [];
    for (const conv of conversations) {
      const messages = await ctx.db
        .query('messages')
        .withIndex('by_branch', (q) =>
          q.eq('conversationId', conv._id).eq('branchId', conv.activeBranchId)
        )
        .collect();

      let promptTokens = 0;
      let completionTokens = 0;
      const modelCounts: Record<string, number> = {};

      for (const msg of messages) {
        if (msg.role !== 'assistant') continue;
        const meta = msg.metadata as Record<string, unknown> | undefined;
        const usage = meta?.tokenUsage as { promptTokens?: number; completionTokens?: number } | undefined;
        if (usage) {
          promptTokens += usage.promptTokens ?? 0;
          completionTokens += usage.completionTokens ?? 0;
        }
        if (msg.modelId) modelCounts[msg.modelId] = (modelCounts[msg.modelId] ?? 0) + 1;
      }

      results.push({
        conversationId: conv._id,
        title: conv.title,
        updatedAt: conv.updatedAt,
        promptTokens,
        completionTokens,
        modelCounts,
      });
    }

    return results.filter((r) => r.promptTokens + r.completionTokens > 0);
  },
});
