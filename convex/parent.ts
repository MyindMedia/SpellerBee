import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// === Parent Auth ===

export const createParent = mutation({
  args: { username: v.string(), pin: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("parents")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (existing) throw new Error("Username taken");

    return await ctx.db.insert("parents", {
      username: args.username,
      pin: args.pin,
    });
  },
});

export const loginParent = query({
  args: { username: v.string(), pin: v.string() },
  handler: async (ctx, args) => {
    const parent = await ctx.db
      .query("parents")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (!parent || parent.pin !== args.pin) {
      return null;
    }
    return parent;
  },
});

// === Student Management ===

export const createStudent = mutation({
  args: { name: v.string(), parentId: v.id("parents"), pin: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return await ctx.db.insert("students", {
      name: args.name,
      parentId: args.parentId,
      pin: args.pin,
    });
  },
});

export const getStudents = query({
  args: { parentId: v.id("parents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();
  },
});

// === Custom Words ===

export const addCustomWord = mutation({
  args: {
    word: v.string(),
    level: v.string(), // Can be "Custom" or specific level
    sentence: v.optional(v.string()),
    creatorId: v.string(), // parentId
  },
  handler: async (ctx, args) => {
    // Check if exists for this creator
    const existing = await ctx.db
        .query("words")
        .withIndex("by_level_word", (q) => q.eq("level", args.level).eq("word", args.word))
        .filter((q) => q.eq(q.field("creatorId"), args.creatorId))
        .first();
    
    if (existing) return existing._id;

    return await ctx.db.insert("words", {
      word: args.word,
      level: args.level,
      sentence: args.sentence,
      creatorId: args.creatorId,
    });
  },
});

export const getParentWords = query({
  args: { parentId: v.string() },
  handler: async (ctx, args) => {
     return await ctx.db
        .query("words")
        .withIndex("by_creator", (q) => q.eq("creatorId", args.parentId))
        .collect();
  }
});
