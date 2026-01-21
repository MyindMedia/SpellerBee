import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("user_settings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();
  },
});

export const updateVoice = mutation({
  args: { voiceId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("user_settings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    if (existing) {
      return await ctx.db.patch(existing._id, { voiceId: args.voiceId });
    }

    return await ctx.db.insert("user_settings", {
      userId: identity.subject,
      voiceId: args.voiceId,
    });
  },
});
