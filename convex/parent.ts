import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// === Student Management ===

export const createStudent = mutation({
  args: { name: v.string(), pin: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db.insert("students", {
      name: args.name,
      parentId: identity.subject, // Clerk ID
      pin: args.pin,
    });
  },
});

export const getStudents = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("students")
      .withIndex("by_parent", (q) => q.eq("parentId", identity.subject))
      .collect();
  },
});

// === Custom Words ===

export const addCustomWord = mutation({
  args: {
    word: v.string(),
    level: v.string(), // Can be "Custom" or specific level
    sentence: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const creatorId = identity.subject;

    // Check if exists for this creator
    const existing = await ctx.db
        .query("words")
        .withIndex("by_level_word", (q) => q.eq("level", args.level).eq("word", args.word))
        .filter((q) => q.eq(q.field("creatorId"), creatorId))
        .first();
    
    if (existing) return existing._id;

    return await ctx.db.insert("words", {
      word: args.word,
      level: args.level,
      sentence: args.sentence,
      creatorId: creatorId,
    });
  },
});

export const getParentWords = query({
  args: {},
  handler: async (ctx) => {
     const identity = await ctx.auth.getUserIdentity();
     if (!identity) return [];

     return await ctx.db
        .query("words")
        .withIndex("by_creator", (q) => q.eq("creatorId", identity.subject))
        .collect();
  }
});
