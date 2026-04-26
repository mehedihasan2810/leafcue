import { create } from "zustand";

import type { LeafCueDatabase } from "@/lib/db";
import { getOnboardingState, setOnboardingState } from "@/lib/db/repositories";
import { onboardingKeys, onboardingValueSchema } from "@/lib/db/zod";

export type OnboardingStatus = "loading" | "needs_onboarding" | "done";

type OnboardingStore = {
  status: OnboardingStatus;
  hydrated: boolean;
  hydrate: (db: LeafCueDatabase) => void;
  complete: (db: LeafCueDatabase) => void;
  reset: (db: LeafCueDatabase) => void;
};

export const useOnboardingStore = create<OnboardingStore>()((set) => ({
  status: "loading",
  hydrated: false,
  hydrate: (db) => {
    const stored = getOnboardingState(
      db,
      onboardingKeys.MAIN,
      onboardingValueSchema,
    );
    set({
      status: stored?.completed ? "done" : "needs_onboarding",
      hydrated: true,
    });
  },
  complete: (db) => {
    setOnboardingState(
      db,
      onboardingKeys.MAIN,
      { completed: true, completedAt: new Date().toISOString() },
      onboardingValueSchema,
    );
    set({ status: "done", hydrated: true });
  },
  reset: (db) => {
    setOnboardingState(
      db,
      onboardingKeys.MAIN,
      { completed: false },
      onboardingValueSchema,
    );
    set({ status: "needs_onboarding", hydrated: true });
  },
}));

export const selectOnboardingStatus = (state: OnboardingStore) => state.status;
