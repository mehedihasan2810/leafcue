import "@/global.css";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { HeroUINativeProvider } from "heroui-native";
import { ToastProvider } from "heroui-native/toast";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { AppFontProvider } from "@/components/app-font-provider";
import { BillingBootstrapper } from "@/components/billing/billing-bootstrapper";
import { CompletionCelebration } from "@/components/completion-celebration";
import { OnboardingGate } from "@/components/onboarding-gate";
import { ThemeStoreSync } from "@/components/theme-store-sync";
import { DatabaseProvider } from "@/lib/db/provider";
import { NotificationResponseRouter } from "@/lib/notifications/response-routing";

// Set splash screen animation options
SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

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
      <Stack.Screen name="tasks" options={{ headerShown: false }} />
      <Stack.Screen name="rooms" options={{ headerShown: false }} />
      <Stack.Screen
        name="plants/new"
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
      <Stack.Screen name="plants/identify" options={{ headerShown: false }} />
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
      <Stack.Screen name="settings/terms" options={{ headerShown: false }} />
      <Stack.Screen
        name="settings/plus"
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
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
      <AppFontProvider>
        <KeyboardProvider>
          <ThemeStoreSync />
          <HeroUINativeProvider>
            <DatabaseProvider>
              <ToastProvider>
                <BillingBootstrapper />
                <OnboardingGate>
                  <NotificationResponseRouter />
                  <StackLayout />
                  <CompletionCelebration />
                </OnboardingGate>
              </ToastProvider>
            </DatabaseProvider>
          </HeroUINativeProvider>
        </KeyboardProvider>
      </AppFontProvider>
    </GestureHandlerRootView>
  );
}
