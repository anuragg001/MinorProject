//api for ecreate-event page
//event fetching ,creating events logic

import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { getCurrentUserAuth } from "./users";

export const createEvent = mutation({
    args:{
    title: v.string(),
    description: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    timezone: v.string(),
    locationType: v.union(v.literal("physical"), v.literal("online")),
    venue: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.string(),
    state: v.optional(v.string()),
    country: v.string(),
    capacity: v.number(),
    ticketType: v.union(v.literal("free"), v.literal("paid")),
    ticketPrice: v.optional(v.number()),
    coverImage: v.optional(v.string()),
    themeColor: v.optional(v.string()),
    // hasPro: v.optional(v.boolean()),
    },
    handler: async (ctx , args)=>{
        try {
            const user = await getCurrentUserAuth(ctx);
            
            //server side validation for: verfiy event limit for free user
            //  if(!args.hasPro && user.freeEventsCreated >=1){
            //     throw new Error(
            //         "Free User Event Limit Reached. Please upgrade to Pro to create more events."
            //     )
            //  }

            //  const defaultColor = "#1e3a8a"; // default theme color
            //  if(!args.hasPro && args.themeColor && args.themeColor !== defaultColor){
            //     throw new Error(
            //         "Custom Theme Colors are available for pro users only. Please upgraded to Pro to use custome theme colors."
            //     )
            //  } 

            //  const themeColor =args.hasPro ? args.themeColor:defaultColor
             const themeColor = args.themeColor;

             //generate sluf from title or url
             const slug = args.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-") //rejx to replace non-alphanumeric characters with hyphens
                .replace(/(^-|-$)/g, "");

            //create event
            const eventId = await ctx.db.insert("events",{
                ...args,
                themeColor,
                slug: `${slug}-${Date.now()}`, //append timestamp to ensure uniqueness as (unique id)
                organizerId:user._id,
                organizerName: user.name,
                registrationCount:0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });

            //update users free event count
            await ctx.db.patch(user._id ,{
                freeEventsCreated: user.freeEventsCreated +1
            })
            return eventId;
        } catch (error) {
            throw new Error(`Failed to create event: ${error.message}`);
        }
    }
});

//api for getting event by slug 
export const getEventBySlug = query({
    args:{ slug: v.string()},
    handler: async (ctx , args)=>{
        const event = await ctx.db
        .query("events")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug))
        .unique();

        return event;
    }
});

//get event by organiser
export const getMyEvents = query({
    handler: async (ctx)=>{
        const user = await getCurrentUserAuth(ctx); // to get urrent user details

        const events = await ctx.db
        .query("events")
        .withIndex("by_organizer", (q) => q.eq("organizerId", user._id))
        .order("desc")
        .collect();
        
        return events;
    }
});

//delete event by id 
export const deleteEvent = mutation({
    args:{eventId: v.id("events")},
    handler: async (ctx,args)=>{
        const user = await getCurrentUserAuth(ctx); // to get urrent user details 

        const event = await ctx.db.get(args.eventId); // valid event id or not 
        if(!event){
            throw new Error("Event not found");
        }

        //chcek if the user is the organiser of the event 
        if(event.organizerId !== user._id){
            throw new Error("Unauthorized: You can only delete your own events.");
        }

        //now finally delete the event after all tthe chck

        // delete all the registrations for the events
        const registrations = await ctx.db
        .query("registrations")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .collect()

        for (const registration of registrations){
            await ctx.db.delete(registration._id);
        }

        //delete tehhe event
        await ctx.db.delete(args.eventId);

        if(user.freeEventsCreated > 0){
            await ctx.db.patch(user._id,{
                freeEventsCreated: user.freeEventsCreated - 1,
            });
        }
        
        return { success: true};
    }
})

export const getEventById = internalQuery({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  }
});