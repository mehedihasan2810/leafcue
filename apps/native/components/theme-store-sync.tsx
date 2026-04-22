import { useEffect } from "react";
import { useUniwind } from "uniwind";

import { type ThemeName, useThemeStore } from "@/stores/use-theme-store";

function isThemeName(theme: string): theme is ThemeName {
  return theme === "light" || theme === "dark";
}

export function ThemeStoreSync() {
  const { theme } = useUniwind();
  const setCurrentTheme = useThemeStore((state) => state.setCurrentTheme);

  useEffect(() => {
    if (isThemeName(theme) && theme !== useThemeStore.getState().currentTheme) {
      setCurrentTheme(theme);
    }
  }, [setCurrentTheme, theme]);

  return null;
}
