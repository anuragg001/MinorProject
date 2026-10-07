import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

export const generatePitch = action({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // We use ctx.runQuery to get user and event details because we can't use ctx.db in actions
    const user = await ctx.runQuery(internal.users.getCurrentUserForAction, { tokenIdentifier: identity.tokenIdentifier });
    const event = await ctx.runQuery(internal.events.getEventById, { eventId: args.eventId });

    if (!user || !event) throw new Error("Data not found");

    const interests = user.interests && user.interests.length > 0 ? user.interests.join(", ") : "general events";
    
    // Placeholder for actual AI integration (e.g. Gemini API)
    // To implement Gemini:
    // 1. Install @google/generative-ai
    // 2. Initialize it with an API key from process.env.GEMINI_API_KEY
    // 3. const prompt = `The user is interested in ${interests}. The event is ${event.title} in the category ${event.category}. Generate a 1-sentence personalized pitch on why they should attend.`;
    // 4. const result = await geminiApi.generateContent(prompt);
    // 5. return { pitch: result.response.text() };
    
    // Mock AI response for now:
    const mockPitch = `Because you're interested in ${interests}, you'll absolutely love ${event.title} which focuses heavily on ${event.category}!`;
    
    return { pitch: mockPitch };
  },
});
