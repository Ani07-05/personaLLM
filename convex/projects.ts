import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

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
      .query('projects')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .collect();
  },
});

export const get = query({
  args: { id: v.id('projects') },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(id);
    if (!project || project.userId !== userId) return null;
    return project;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    instructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();
    return ctx.db.insert('projects', {
      userId,
      name: args.name,
      description: args.description,
      instructions: args.instructions,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('projects'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    instructions: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(id);
    if (!project || project.userId !== userId) throw new Error('Not found');
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) patch[k] = v;
    }
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id('projects') },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(id);
    if (!project || project.userId !== userId) throw new Error('Not found');

    // Cascade: delete all conversations in project
    const convs = await ctx.db
      .query('conversations')
      .withIndex('by_project', (q) => q.eq('projectId', id))
      .collect();
    for (const conv of convs) {
      // Delete messages
      const msgs = await ctx.db
        .query('messages')
        .filter((q) => q.eq(q.field('conversationId'), conv._id))
        .collect();
      for (const m of msgs) await ctx.db.delete(m._id);
      // Delete branches
      const brs = await ctx.db
        .query('branches')
        .withIndex('by_conversation', (q) => q.eq('conversationId', conv._id))
        .collect();
      for (const b of brs) await ctx.db.delete(b._id);
      await ctx.db.delete(conv._id);
    }

    // Delete files
    const files = await ctx.db
      .query('files')
      .withIndex('by_project', (q) => q.eq('projectId', id))
      .collect();
    for (const f of files) await ctx.db.delete(f._id);

    await ctx.db.delete(id);
  },
});
