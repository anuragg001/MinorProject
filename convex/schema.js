import {defineSchema, defineTable} from "convex/server";
import { v } from "convex/values";
export default defineSchema({
    users: defineTable({
        name: v.string(),
        tokenIdentifier: v.string(), //clerk user id for authentication
        email: v.string(),  
        imageUrl: v.optional(v.string()),

        hasCompletedOnboarding: v.boolean(),
        location: v.optional(
            v.object({
                city:v.string(),
                state: v.optional(v.string()),
                country:v.string()
            })
        ),

        interests: v.optional(v.array(v.string())),

        freeEventsCreated: v.number(),   // to track free events created by the user

        //timestamps
        createdAt: v.number(),
        updatedAt: v.number()  
    }).index("by_token", ["tokenIdentifier"])
})