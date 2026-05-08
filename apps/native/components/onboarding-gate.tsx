import { router, useSegments } from "expo-router";
import { type PropsWithChildren, useLayoutEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { useDatabase } from "@/lib/db";
import { useOnboardingStore } from "@/stores/use-onboarding-store";

export function OnboardingGate({ children }: PropsWithChildren) {
  const db = useDatabase();
  const segments = useSegments();
  const status = useOnboardingStore((state) => state.status);
  const hydrated = useOnboardingStore((state) => state.hydrated);
  const hydrate = useOnboardingStore((state) => state.hydrate);

  useLayoutEffect(() => {
    if (!hydrated) {
      hydrate(db);
    }
  }, [db, hydrate, hydrated]);

  useLayoutEffect(() => {
    if (!hydrated) return;
    if (status !== "needs_onboarding") return;
    const inOnboarding = segments[0] === "onboarding";
    if (!inOnboarding) {
      router.replace("/onboarding");
    }
  }, [segments, status, hydrated]);

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return children;
}
