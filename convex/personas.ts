import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { nanoid } from 'nanoid';

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
      .query('personas')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id('personas') },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const persona = await ctx.db.get(id);
    if (!persona || persona.userId !== userId) return null;
    return persona;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    systemPrompt: v.string(),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();
    return ctx.db.insert('personas', {
      userId,
      name: args.name,
      systemPrompt: args.systemPrompt,
      isDefault: args.isDefault,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('personas'),
    name: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const userId = await requireUserId(ctx);
    const persona = await ctx.db.get(id);
    if (!persona || persona.userId !== userId) throw new Error('Not found');
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id('personas') },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const persona = await ctx.db.get(id);
    if (!persona || persona.userId !== userId) throw new Error('Not found');
    await ctx.db.delete(id);
  },
});

export const setDefault = mutation({
  args: { id: v.id('personas') },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    // Clear existing defaults
    const existing = await ctx.db
      .query('personas')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    for (const p of existing) {
      if (p.isDefault) await ctx.db.patch(p._id, { isDefault: false });
    }
    await ctx.db.patch(id, { isDefault: true });
  },
});
