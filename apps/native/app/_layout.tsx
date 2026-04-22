import "@/global.css";
import DatabaseProvider from "@nozbe/watermelondb/react/DatabaseProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { ThemeStoreSync } from "@/components/theme-store-sync";
import { database } from "@/lib/watermelon";
import { queryClient } from "@/utils/trpc";

export const unstable_settings = {
  initialRouteName: "(drawer)",
};

function StackLayout() {
  return (
    <Stack screenOptions={{}}>
      <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ title: "Modal", presentation: "modal" }} />
    </Stack>
  );
}

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <DatabaseProvider database={database}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <ThemeStoreSync />
            <HeroUINativeProvider>
              <StackLayout />
            </HeroUINativeProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </DatabaseProvider>
    </QueryClientProvider>
  );
}
