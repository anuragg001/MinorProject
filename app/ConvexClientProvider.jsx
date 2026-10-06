"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://dummy.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }) {
  return <ConvexProviderWithClerk client={convex} useAuth = {useAuth}>{children}</ConvexProviderWithClerk>;
}
