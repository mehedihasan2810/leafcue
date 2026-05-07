import "@/global.css";
import { Stack } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { OnboardingGate } from "@/components/onboarding-gate";
import { ThemeStoreSync } from "@/components/theme-store-sync";
import { DatabaseProvider } from "@/lib/db/provider";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function StackLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="onboarding"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="plants/new"
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="plants/[plantId]/index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="plants/[plantId]/edit"
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="plants/[plantId]/schedules"
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="plants/[plantId]/journal"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="plants/[plantId]/photos"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="plants/[plantId]/growth"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="plants/[plantId]/health"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="settings/index" options={{ headerShown: false }} />
      <Stack.Screen
        name="settings/appearance"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="settings/app-preferences"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="settings/plant-defaults"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="settings/backup" options={{ headerShown: false }} />
      <Stack.Screen name="settings/archive" options={{ headerShown: false }} />
      <Stack.Screen name="settings/about" options={{ headerShown: false }} />
      <Stack.Screen name="settings/privacy" options={{ headerShown: false }} />
      <Stack.Screen
        name="settings/reminders"
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <ThemeStoreSync />
        <HeroUINativeProvider>
          <DatabaseProvider>
            <OnboardingGate>
              <StackLayout />
            </OnboardingGate>
          </DatabaseProvider>
        </HeroUINativeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
