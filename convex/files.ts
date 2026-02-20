import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

async function requireUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Not authenticated');
  return identity.subject;
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

export const addToProject = mutation({
  args: {
    projectId: v.id('projects'),
    storageId: v.id('_storage'),
    name: v.string(),
    mimeType: v.string(),
    size: v.number(),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return ctx.db.insert('files', {
      userId,
      projectId: args.projectId,
      storageId: args.storageId,
      name: args.name,
      mimeType: args.mimeType,
      size: args.size,
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

export const addToConversation = mutation({
  args: {
    conversationId: v.id('conversations'),
    storageId: v.optional(v.id('_storage')),
    name: v.string(),
    mimeType: v.string(),
    size: v.number(),
    content: v.optional(v.string()),
    messageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return ctx.db.insert('files', {
      userId,
      conversationId: args.conversationId,
      storageId: args.storageId,
      name: args.name,
      mimeType: args.mimeType,
      size: args.size,
      content: args.content,
      messageId: args.messageId,
      createdAt: Date.now(),
    });
  },
});

export const getForProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, { projectId }) => {
    return ctx.db
      .query('files')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .order('desc')
      .collect();
  },
});

export const getForConversation = query({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, { conversationId }) => {
    return ctx.db
      .query('files')
      .withIndex('by_conversation', (q) => q.eq('conversationId', conversationId))
      .collect();
  },
});

export const getUrl = query({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, { storageId }) => {
    return ctx.storage.getUrl(storageId);
  },
});

export const remove = mutation({
  args: { id: v.id('files') },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const file = await ctx.db.get(id);
    if (!file || file.userId !== userId) throw new Error('Not found');
    if (file.storageId) await ctx.storage.delete(file.storageId);
    await ctx.db.delete(id);
  },
});
