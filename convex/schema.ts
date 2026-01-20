import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  words: defineTable({
    word: v.string(),
    level: v.string(),
    definition: v.optional(v.string()),
    sentence: v.optional(v.string()),
    creatorId: v.optional(v.string()), // null = system, or parentId
  })
    .index("by_level", ["level"])
    .index("by_level_word", ["level", "word"])
    .index("by_creator", ["creatorId"]),

  // parents: defineTable({ ... }) - Removed, using Clerk
  
  students: defineTable({
    name: v.string(),
    parentId: v.string(), // Clerk User ID
    pin: v.optional(v.string()),
  }).index("by_parent", ["parentId"]),

  progress: defineTable({
    userId: v.optional(v.string()), // e.g. "Sienna"
    wordId: v.id("words"),
    status: v.string(),
    attempts: v.number(),
    lastPracticed: v.number(),
  })
    .index("by_user_word", ["userId", "wordId"])
    .index("by_user", ["userId"]),
});

