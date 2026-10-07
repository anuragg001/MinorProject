import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUserAuth } from "./users";

export const getEventStats = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserAuth(ctx);
    const event = await ctx.db.get(args.eventId);

    if (!event) throw new Error("Event not found");

    if (event.organizerId !== user._id) {
      throw new Error("Unauthorized: Only the organizer can view stats");
    }

    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const waitlists = await ctx.db
      .query("waitlists")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const confirmedCount = registrations.filter(r => r.status === "confirmed").length;
    const checkedInCount = registrations.filter(r => r.status === "confirmed" && r.checkedIn).length;
    const cancelledCount = registrations.filter(r => r.status === "cancelled").length;
    
    const waitlistCount = waitlists.filter(w => w.status === "waiting").length;

    return {
      totalCapacity: event.capacity,
      confirmedCount,
      checkedInCount,
      cancelledCount,
      waitlistCount,
      attendanceRate: confirmedCount > 0 ? (checkedInCount / confirmedCount) * 100 : 0,
      fillRate: event.capacity > 0 ? (confirmedCount / event.capacity) * 100 : 0
    };
  },
});

export const checkInAttendee = mutation({
  args: {
    qrCode: v.string(),
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserAuth(ctx);
    const event = await ctx.db.get(args.eventId);

    if (!event) throw new Error("Event not found");

    if (event.organizerId !== user._id) {
      throw new Error("Unauthorized: Only the organizer can check-in attendees");
    }

    const registration = await ctx.db
      .query("registrations")
      .withIndex("by_qr_code", (q) => q.eq("qrCode", args.qrCode))
      .unique();

    if (!registration) {
      throw new Error("Invalid QR code: Registration not found");
    }

    if (registration.eventId !== args.eventId) {
      throw new Error("Invalid QR code: This ticket is for a different event");
    }

    if (registration.status !== "confirmed") {
      throw new Error("Ticket is not valid (status: " + registration.status + ")");
    }

    if (registration.checkedIn) {
      throw new Error("Attendee has already checked in");
    }

    await ctx.db.patch(registration._id, {
      checkedIn: true,
      checkedInAt: Date.now(),
    });

    return { 
      success: true, 
      attendeeName: registration.attendeeName,
      message: `${registration.attendeeName} checked in successfully!`
    };
  },
});
