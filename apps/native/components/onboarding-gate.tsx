import { router, useSegments } from "expo-router";
import { type PropsWithChildren, useEffect } from "react";

import { useDatabase } from "@/lib/db";
import { useOnboardingStore } from "@/stores/use-onboarding-store";

export function OnboardingGate({ children }: PropsWithChildren) {
  const db = useDatabase();
  const segments = useSegments();
  const status = useOnboardingStore((state) => state.status);
  const hydrated = useOnboardingStore((state) => state.hydrated);
  const hydrate = useOnboardingStore((state) => state.hydrate);

  useEffect(() => {
    if (!hydrated) {
      hydrate(db);
    }
  }, [db, hydrate, hydrated]);

  useEffect(() => {
    if (status !== "needs_onboarding") return;
    const inOnboarding = segments[0] === "onboarding";
    if (!inOnboarding) {
      router.replace("/onboarding");
    }
  }, [segments, status]);

  return children;
}
