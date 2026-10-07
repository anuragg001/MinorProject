import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUserAuth } from "./users";

export const followOrganizer = mutation({
  args: {
    organizerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserAuth(ctx);

    if (user._id === args.organizerId) {
      throw new Error("You cannot follow yourself");
    }

    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("by_follower_organizer", (q) =>
        q.eq("followerId", user._id).eq("organizerId", args.organizerId)
      )
      .unique();

    if (existingFollow) {
      throw new Error("Already following this organizer");
    }

    await ctx.db.insert("follows", {
      followerId: user._id,
      organizerId: args.organizerId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const unfollowOrganizer = mutation({
  args: {
    organizerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserAuth(ctx);

    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("by_follower_organizer", (q) =>
        q.eq("followerId", user._id).eq("organizerId", args.organizerId)
      )
      .unique();

    if (!existingFollow) {
      throw new Error("Not following this organizer");
    }

    await ctx.db.delete(existingFollow._id);

    return { success: true };
  },
});

export const getEventAttendees = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    // We do not require auth here so anyone can see the public guest list,
    // or you could require it if you want the guest list to be private to users only.
    
    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("status"), "confirmed"))
      .collect();

    // Filter to only include those who opted into being public
    const publicRegistrations = registrations.filter((r) => r.isPublic === true);

    const attendees = await Promise.all(
      publicRegistrations.map(async (reg) => {
        const user = await ctx.db.get(reg.userId);
        return {
          _id: user._id,
          name: user.name,
          imageUrl: user.imageUrl,
          interests: user.interests,
        };
      })
    );

    return attendees;
  },
});

export const getFollowedOrganizersEvents = query({
  handler: async (ctx) => {
    const user = await getCurrentUserAuth(ctx);

    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", user._id))
      .collect();

    const organizerIds = follows.map((f) => f.organizerId);

    // Fetch all events by these organizers
    let allEvents = [];
    for (const orgId of organizerIds) {
      const events = await ctx.db
        .query("events")
        .withIndex("by_organizer", (q) => q.eq("organizerId", orgId))
        .filter(q => q.gte(q.field("startDate"), Date.now())) // Only upcoming events
        .collect();
      allEvents = [...allEvents, ...events];
    }

    // Sort by start date
    allEvents.sort((a, b) => a.startDate - b.startDate);

    return allEvents;
  },
});
