import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUserAuth } from "./users";

export const registerForEvent = mutation({
  args: {
    eventId: v.id("events"),
    isPublic: v.optional(v.boolean()), // For social layer
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserAuth(ctx);

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    // Check if already registered
    const existingRegistration = await ctx.db
      .query("registrations")
      .withIndex("by_event_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id)
      )
      .unique();

    if (existingRegistration && existingRegistration.status === "confirmed") {
      throw new Error("You are already registered for this event.");
    }

    // Check capacity
    if (event.registrationCount >= event.capacity) {
      // Event is full, add to waitlist instead
      const existingWaitlist = await ctx.db
        .query("waitlists")
        .withIndex("by_event_user", (q) =>
          q.eq("eventId", args.eventId).eq("userId", user._id)
        )
        .unique();

      if (existingWaitlist && existingWaitlist.status === "waiting") {
        throw new Error("You are already on the waitlist.");
      }

      const waitlistId = await ctx.db.insert("waitlists", {
        eventId: args.eventId,
        userId: user._id,
        status: "waiting",
        joinedAt: Date.now(),
      });

      return { status: "waitlisted", waitlistId };
    }

    // Generate a simple unique QR code identifier
    const qrCode = `${args.eventId}-${user._id}-${Date.now()}`;

    // Proceed to register
    const registrationId = await ctx.db.insert("registrations", {
      eventId: args.eventId,
      userId: user._id,
      attendeeName: user.name,
      attendeeEmail: user.email,
      qrCode,
      checkedIn: false,
      status: "confirmed",
      isPublic: args.isPublic ?? false,
      registeredAt: Date.now(),
    });

    // Increment event registration count
    await ctx.db.patch(args.eventId, {
      registrationCount: event.registrationCount + 1,
    });

    return { status: "registered", registrationId };
  },
});

export const cancelRegistration = mutation({
  args: {
    registrationId: v.id("registrations"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserAuth(ctx);

    const registration = await ctx.db.get(args.registrationId);
    if (!registration) throw new Error("Registration not found");

    if (registration.userId !== user._id) {
      throw new Error("Unauthorized to cancel this registration");
    }

    if (registration.status === "cancelled") {
      throw new Error("Registration is already cancelled");
    }

    // Mark as cancelled
    await ctx.db.patch(args.registrationId, {
      status: "cancelled",
    });

    const event = await ctx.db.get(registration.eventId);

    // Decrement event registration count
    await ctx.db.patch(event._id, {
      registrationCount: event.registrationCount - 1,
    });

    // Auto-Reallocation: Check the waitlist
    const nextInLine = await ctx.db
      .query("waitlists")
      .withIndex("by_event_status", (q) =>
        q.eq("eventId", event._id).eq("status", "waiting")
      )
      .order("asc")
      .first();

    if (nextInLine) {
      // Promote the user
      await ctx.db.patch(nextInLine._id, {
        status: "promoted",
        promotedAt: Date.now(),
      });

      const waitlistUser = await ctx.db.get(nextInLine.userId);

      // Generate a QR code for the new attendee
      const qrCode = `${event._id}-${waitlistUser._id}-${Date.now()}`;

      // Register them
      await ctx.db.insert("registrations", {
        eventId: event._id,
        userId: waitlistUser._id,
        attendeeName: waitlistUser.name,
        attendeeEmail: waitlistUser.email,
        qrCode,
        checkedIn: false,
        status: "confirmed",
        isPublic: false, // Default to false for auto-promotions
        registeredAt: Date.now(),
      });

      // Re-increment the registration count
      await ctx.db.patch(event._id, {
        registrationCount: event.registrationCount, // effectively +1 -1 = 0 change
      });
      
      // In a full production app, we would also trigger an email notification here.
    }

    return { success: true };
  },
});

export const getMyRegistrations = query({
  handler: async (ctx) => {
    const user = await getCurrentUserAuth(ctx);

    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Map to include event details
    const registrationsWithEvents = await Promise.all(
      registrations.map(async (reg) => {
        const event = await ctx.db.get(reg.eventId);
        return { ...reg, event };
      })
    );

    return registrationsWithEvents;
  },
});

export const checkRegistration = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    try {
      const user = await getCurrentUserAuth(ctx);
      if (!user) return { isRegistered: false };

      const existingRegistration = await ctx.db
        .query("registrations")
        .withIndex("by_event_user", (q) =>
          q.eq("eventId", args.eventId).eq("userId", user._id)
        )
        .unique();

      if (existingRegistration) {
        return { isRegistered: true, registration: existingRegistration };
      }
      return { isRegistered: false };
    } catch (e) {
      return { isRegistered: false };
    }
  },
});
