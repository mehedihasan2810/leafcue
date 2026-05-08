import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { type PropsWithChildren, useEffect } from "react";

void SplashScreen.preventAutoHideAsync();

const APP_FONT_MAP = {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
};

export function AppFontProvider({ children }: PropsWithChildren) {
  const [loaded, error] = useFonts(APP_FONT_MAP);

  useEffect(() => {
    if (loaded || error) {
      void SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!(loaded || error)) {
    return null;
  }

  return children;
}
