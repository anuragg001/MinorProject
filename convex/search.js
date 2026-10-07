//api for search bar and filter by loaction and category after onboarding
import { query } from "./_generated/server";
import { v } from "convex/values";

// Search events by title
export const searchEvents = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.query || args.query.trim().length < 2) {
      return [];
    }

    const now = Date.now();

    const searchResults = await ctx.db
      .query("events")
      .withSearchIndex("search_title", (q) => q.search("title", args.query))
      .take(args.limit ?? 5);

    return searchResults;
  },
});