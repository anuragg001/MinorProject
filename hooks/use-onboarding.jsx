"use client";


import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useConvexQuery } from "./use-convex-query";
import { api } from "@/convex/_generated/api";

//first set all the routes that we want to trigger onboarding onn , then we can add a check in the header 
const ATTENDEE_PAGES = ["/explore", "/events", "/my-tickets", "/profile"];

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const pathname = usePathname(); // to check the current route
  const router = useRouter(); // to route to seperate page

  const { data: currentUser, isLoading } = useConvexQuery(
    api.users.getCurrentUser
  );

  useEffect(() => {
    if (isLoading || !currentUser) return;

    // check if user hasn't completed onboarding
    if (!currentUser.hasCompletedOnboarding) {
      // Check if current page requires onboarding
      const requiresOnboarding = ATTENDEE_PAGES.some((page) =>
        pathname.startsWith(page)
      );

      if (requiresOnboarding) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShowOnboarding(true);
      }
    }
  }, [currentUser, pathname, isLoading]); // depeecy that will trigger the onboarding modeal

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Refresh to get updated user data
    router.refresh();
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    // Redirect back to homepage if they skip
    router.push("/");
  };

  return {
    showOnboarding,
    setShowOnboarding,
    handleOnboardingComplete,
    handleOnboardingSkip,
    needsOnboarding: currentUser && !currentUser.hasCompletedOnboarding,
  };
}