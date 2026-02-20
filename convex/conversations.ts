import { v } from 'convex/values';
import { mutation, query, action } from './_generated/server';
import { nanoid } from 'nanoid';
import { api } from './_generated/api';

async function requireUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Not authenticated');
  return identity.subject;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return ctx.db
      .query('conversations')
      .withIndex('by_user_updatedAt', (q) => q.eq('userId', userId))
      .order('desc')
      .collect();
  },
});

export const listByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, { projectId }) => {
    const userId = await requireUserId(ctx);
    return ctx.db
      .query('conversations')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .filter((q) => q.eq(q.field('userId'), userId))
      .order('desc')
      .collect();
  },
});

export const get = query({
  args: { id: v.id('conversations') },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const conv = await ctx.db.get(id);
    if (!conv || conv.userId !== userId) return null;
    return conv;
  },
});

export const create = mutation({
  args: {
    modelId: v.string(),
    providerId: v.string(),
    enabledTools: v.array(v.string()),
    projectId: v.optional(v.id('projects')),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();

    // Insert conversation with placeholder — patched below once we have the branch _id
    const convId = await ctx.db.insert('conversations', {
      userId,
      title: 'New Chat',
      activeBranchId: '',
      modelId: args.modelId,
      providerId: args.providerId,
      enabledTools: args.enabledTools,
      projectId: args.projectId,
      createdAt: now,
      updatedAt: now,
    });

    // Use the branch's Convex _id as the activeBranchId so it matches branch docs
    const branchId = await ctx.db.insert('branches', {
      conversationId: convId,
      createdAt: now,
    });

    await ctx.db.patch(convId, { activeBranchId: branchId });

    return { id: convId, activeBranchId: branchId as string };
  },
});

export const update = mutation({
  args: {
    id: v.id('conversations'),
    title: v.optional(v.string()),
    activeBranchId: v.optional(v.string()),
    personaId: v.optional(v.string()),
    enabledTools: v.optional(v.array(v.string())),
    modelId: v.optional(v.string()),
    providerId: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const userId = await requireUserId(ctx);
    const conv = await ctx.db.get(id);
    if (!conv || conv.userId !== userId) throw new Error('Not found');
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) patch[k] = v;
    }
    await ctx.db.patch(id, patch);
  },
});

export const rename = mutation({
  args: { id: v.id('conversations'), title: v.string() },
  handler: async (ctx, { id, title }) => {
    const userId = await requireUserId(ctx);
    const conv = await ctx.db.get(id);
    if (!conv || conv.userId !== userId) throw new Error('Not found');
    await ctx.db.patch(id, { title, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id('conversations') },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const conv = await ctx.db.get(id);
    if (!conv || conv.userId !== userId) throw new Error('Not found');

    // Cascade delete messages
    const messages = await ctx.db
      .query('messages')
      .filter((q) => q.eq(q.field('conversationId'), id))
      .collect();
    for (const m of messages) await ctx.db.delete(m._id);

    // Cascade delete branches
    const branches = await ctx.db
      .query('branches')
      .withIndex('by_conversation', (q) => q.eq('conversationId', id))
      .collect();
    for (const b of branches) await ctx.db.delete(b._id);

    // Cascade delete files
    const files = await ctx.db
      .query('files')
      .withIndex('by_conversation', (q) => q.eq('conversationId', id))
      .collect();
    for (const f of files) await ctx.db.delete(f._id);

    await ctx.db.delete(id);
  },
});

export const pin = mutation({
  args: { id: v.id('conversations'), pinned: v.boolean() },
  handler: async (ctx, { id, pinned }) => {
    const userId = await requireUserId(ctx);
    const conv = await ctx.db.get(id);
    if (!conv || conv.userId !== userId) throw new Error('Not found');
    await ctx.db.patch(id, {
      pinnedAt: pinned ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
  },
});

export const generateShareToken = mutation({
  args: { id: v.id('conversations') },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const conv = await ctx.db.get(id);
    if (!conv || conv.userId !== userId) throw new Error('Not found');
    const token = nanoid(12);
    await ctx.db.patch(id, { shareToken: token });
    return token;
  },
});

export const revokeShareToken = mutation({
  args: { id: v.id('conversations') },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const conv = await ctx.db.get(id);
    if (!conv || conv.userId !== userId) throw new Error('Not found');
    await ctx.db.patch(id, { shareToken: undefined });
  },
});

export const getByShareToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const conv = await ctx.db
      .query('conversations')
      .withIndex('by_shareToken', (q) => q.eq('shareToken', token))
      .first();
    if (!conv) return null;

    // Get messages for active branch
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_branch', (q) =>
        q.eq('conversationId', conv._id).eq('branchId', conv.activeBranchId)
      )
      .order('asc')
      .collect();

    return { conversation: conv, messages };
  },
});
