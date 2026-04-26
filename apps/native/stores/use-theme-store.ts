import { Uniwind } from "uniwind";
import { create } from "zustand";

import type { LeafCueDatabase } from "@/lib/db";
import {
  DEFAULT_APPEARANCE,
  loadAppearance,
  saveAppearance,
} from "@/lib/settings/app-settings";

export type ThemeName = "light" | "dark";
export type AppearanceMode = "system" | "light" | "dark";

type ThemeStore = {
  currentTheme: ThemeName;
  appearanceMode: AppearanceMode;
  hydrated: boolean;
  setCurrentTheme: (theme: ThemeName) => void;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
  hydrateAppearance: (db: LeafCueDatabase) => void;
  setAppearanceMode: (db: LeafCueDatabase, mode: AppearanceMode) => void;
};

export const useThemeStore = create<ThemeStore>()((set, get) => ({
  currentTheme: "light",
  appearanceMode: DEFAULT_APPEARANCE.mode,
  hydrated: false,
  setCurrentTheme: (theme) => {
    set({ currentTheme: theme });
  },
  setTheme: (theme) => {
    Uniwind.setTheme(theme);
    set({ currentTheme: theme, appearanceMode: theme });
  },
  toggleTheme: () => {
    get().setTheme(get().currentTheme === "light" ? "dark" : "light");
  },
  hydrateAppearance: (db) => {
    const stored = loadAppearance(db);
    Uniwind.setTheme(stored.mode);
    set({ appearanceMode: stored.mode, hydrated: true });
  },
  setAppearanceMode: (db, mode) => {
    saveAppearance(db, { mode });
    Uniwind.setTheme(mode);
    set({ appearanceMode: mode });
  },
}));

export const selectIsLightTheme = (state: ThemeStore) =>
  state.currentTheme === "light";
