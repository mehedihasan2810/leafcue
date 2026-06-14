import { create } from "zustand";

import type { LeafCueDatabase } from "@/lib/db";
import { getOnboardingState, setOnboardingState } from "@/lib/db/repositories";
import {
  type OnboardingProfile,
  onboardingKeys,
  onboardingProfileSchema,
  onboardingValueSchema,
} from "@/lib/db/zod";

export type OnboardingStatus = "loading" | "needs_onboarding" | "done";

/** The first plant collected mid-onboarding, revealed before it is persisted. */
export type OnboardingDraftPlant = {
  nickname: string;
  presetId: number | null;
};

const DEFAULT_PROFILE: OnboardingProfile = onboardingProfileSchema.parse({});

type OnboardingStore = {
  status: OnboardingStatus;
  hydrated: boolean;
  profile: OnboardingProfile;
  draftPlant: OnboardingDraftPlant | null;
  hydrate: (db: LeafCueDatabase) => void;
  complete: (db: LeafCueDatabase) => void;
  reset: (db: LeafCueDatabase) => void;
  setProfile: (
    db: LeafCueDatabase,
    partial: Partial<OnboardingProfile>,
  ) => void;
  setDraftPlant: (draft: OnboardingDraftPlant | null) => void;
};

export const useOnboardingStore = create<OnboardingStore>()((set, get) => ({
  status: "loading",
  hydrated: false,
  profile: DEFAULT_PROFILE,
  draftPlant: null,
  hydrate: (db) => {
    const stored = getOnboardingState(
      db,
      onboardingKeys.MAIN,
      onboardingValueSchema,
    );
    const profile =
      getOnboardingState(db, onboardingKeys.PROFILE, onboardingProfileSchema) ??
      DEFAULT_PROFILE;
    set({
      status: stored?.completed ? "done" : "needs_onboarding",
      profile,
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
    setOnboardingState(
      db,
      onboardingKeys.PROFILE,
      DEFAULT_PROFILE,
      onboardingProfileSchema,
    );
    set({
      status: "needs_onboarding",
      profile: DEFAULT_PROFILE,
      draftPlant: null,
      hydrated: true,
    });
  },
  setProfile: (db, partial) => {
    const next = { ...get().profile, ...partial };
    setOnboardingState(
      db,
      onboardingKeys.PROFILE,
      next,
      onboardingProfileSchema,
    );
    set({ profile: next });
  },
  setDraftPlant: (draft) => set({ draftPlant: draft }),
}));

export const selectOnboardingStatus = (state: OnboardingStore) => state.status;
