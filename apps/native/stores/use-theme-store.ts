import { Uniwind } from "uniwind";
import { create } from "zustand";

export type ThemeName = "light" | "dark";

type ThemeStore = {
  currentTheme: ThemeName;
  setCurrentTheme: (theme: ThemeName) => void;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
};

export const useThemeStore = create<ThemeStore>()((set, get) => ({
  currentTheme: "light",
  setCurrentTheme: (theme) => {
    set({ currentTheme: theme });
  },
  setTheme: (theme) => {
    Uniwind.setTheme(theme);
    set({ currentTheme: theme });
  },
  toggleTheme: () => {
    get().setTheme(get().currentTheme === "light" ? "dark" : "light");
  },
}));

export const selectIsLightTheme = (state: ThemeStore) =>
  state.currentTheme === "light";
