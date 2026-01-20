import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  words: defineTable({
    word: v.string(),
    level: v.string(),
    definition: v.optional(v.string()),
    sentence: v.optional(v.string()),
  })
    .index("by_level", ["level"])
    .index("by_level_word", ["level", "word"]),

  progress: defineTable({
    userId: v.string(), // e.g. "Sienna"
    wordId: v.id("words"),
    status: v.string(),
    attempts: v.number(),
    lastPracticed: v.number(),
  })
    .index("by_user_word", ["userId", "wordId"])
    .index("by_user", ["userId"]),
});

