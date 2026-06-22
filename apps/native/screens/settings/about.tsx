import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { router } from "expo-router";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { useDatabase } from "@/lib/db";
import { LINKS, openEmail, openExternal } from "@/lib/links";
import { SettingsHeader } from "@/screens/settings/settings-header";
import { useOnboardingStore } from "@/stores/use-onboarding-store";

const LINK_ROWS: ReadonlyArray<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}> = [
  {
    icon: "shield-checkmark-outline",
    label: "Privacy Policy",
    onPress: () => openExternal(LINKS.privacy),
  },
  {
    icon: "document-text-outline",
    label: "Terms of Service",
    onPress: () => openExternal(LINKS.terms),
  },
  {
    icon: "help-circle-outline",
    label: "Support",
    onPress: () => openExternal(LINKS.support),
  },
  {
    icon: "mail-outline",
    label: "Contact us",
    onPress: () => openEmail(LINKS.contactEmail),
  },
  {
    icon: "globe-outline",
    label: "Visit leafcue.galaxyway.ai",
    onPress: () => openExternal(LINKS.website),
  },
];

export function AboutScreen() {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");
  const db = useDatabase();
  const resetOnboarding = useOnboardingStore((state) => state.reset);

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const handleReplayOnboarding = () => {
    resetOnboarding(db);
    router.replace("/onboarding");
  };

  return (
    <View className="flex-1 bg-background">
      <SettingsHeader title="About LeafCue" />
      <Container className="px-6" isScrollable>
        <View className="gap-6" style={{ paddingBottom: insets.bottom + 32 }}>
          <View className="items-center gap-3 rounded-3xl border border-border/40 bg-surface p-6">
            <View className="size-16 items-center justify-center rounded-3xl bg-accent-soft">
              <Ionicons name="leaf" size={32} color={accent} />
            </View>
            <Text className="font-semibold text-foreground text-lg">
              LeafCue
            </Text>
            <Text className="text-center text-muted text-xs">
              A private, offline plant care tracker for watering, fertilizing,
              reminders, photos, journals, growth logs, and plant health notes.
              No account required.
            </Text>
            <Text className="text-muted text-xs">Version {appVersion}</Text>
          </View>

          <View className="gap-2 rounded-3xl border border-border/40 bg-surface p-4">
            <Text className="font-medium text-foreground text-sm">
              How it works
            </Text>
            <Text className="text-muted text-xs">
              Everything lives on your device. No accounts, no servers, no
              tracking. Reminders are local notifications scheduled by your
              phone. Backups are JSON files you control.
            </Text>
          </View>

          <View className="gap-1 rounded-3xl border border-border/40 bg-surface p-2">
            <Text className="px-2 pt-2 pb-1 font-medium text-foreground text-sm">
              Legal & links
            </Text>
            {LINK_ROWS.map((row) => (
              <PressableFeedback
                key={row.label}
                onPress={row.onPress}
                className="flex-row items-center justify-between rounded-2xl p-3 active:opacity-70"
              >
                <View className="flex-row items-center gap-3">
                  <View className="size-9 items-center justify-center rounded-2xl bg-accent-soft">
                    <Ionicons name={row.icon} size={16} color={accent} />
                  </View>
                  <Text className="font-medium text-foreground text-sm">
                    {row.label}
                  </Text>
                </View>
                <Ionicons name="open-outline" size={16} color={accent} />
              </PressableFeedback>
            ))}
          </View>

          <Text className="text-center text-muted text-xs">
            {LINKS.company}
          </Text>

          {__DEV__ ? (
            <PressableFeedback
              onPress={handleReplayOnboarding}
              className="rounded-3xl border border-warning/50 border-dashed bg-warning/10 p-4 active:opacity-80"
            >
              <Text className="font-medium text-foreground text-sm">
                Replay onboarding
              </Text>
              <Text className="text-muted text-xs leading-4">
                Development only: clears the “first launch completed” flag and
                opens the onboarding flow again.
              </Text>
            </PressableFeedback>
          ) : null}
        </View>
      </Container>
    </View>
  );
}
