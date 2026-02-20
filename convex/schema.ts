import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  projects: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    instructions: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    pinnedAt: v.optional(v.number()),
  }).index('by_user', ['userId']),

  conversations: defineTable({
    userId: v.string(),
    title: v.string(),
    activeBranchId: v.string(),
    modelId: v.string(),
    providerId: v.string(),
    personaId: v.optional(v.string()),
    enabledTools: v.array(v.string()),
    projectId: v.optional(v.id('projects')),
    shareToken: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    pinnedAt: v.optional(v.number()),
    archivedAt: v.optional(v.number()),
  })
    .index('by_user_updatedAt', ['userId', 'updatedAt'])
    .index('by_project', ['projectId'])
    .index('by_shareToken', ['shareToken']),

  messages: defineTable({
    conversationId: v.id('conversations'),
    branchId: v.string(),
    role: v.string(),
    parts: v.array(v.any()),
    metadata: v.optional(v.any()),
    modelId: v.optional(v.string()),
    providerId: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_branch', ['conversationId', 'branchId', 'createdAt']),

  branches: defineTable({
    conversationId: v.id('conversations'),
    parentBranchId: v.optional(v.string()),
    forkMessageId: v.optional(v.string()),
    name: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_conversation', ['conversationId']),

  personas: defineTable({
    userId: v.string(),
    name: v.string(),
    systemPrompt: v.string(),
    isDefault: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),

  files: defineTable({
    userId: v.string(),
    conversationId: v.optional(v.id('conversations')),
    projectId: v.optional(v.id('projects')),
    messageId: v.optional(v.string()),
    name: v.string(),
    mimeType: v.string(),
    size: v.number(),
    storageId: v.optional(v.id('_storage')),
    content: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_conversation', ['conversationId'])
    .index('by_project', ['projectId']),
});
