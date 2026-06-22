import { Ionicons } from "@expo/vector-icons";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { LINKS, openExternal } from "@/lib/links";
import { SettingsHeader } from "@/screens/settings/settings-header";

const POINTS: ReadonlyArray<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}> = [
  {
    icon: "phone-portrait-outline",
    title: "Stays on your device",
    body: "Plants, logs, photos, and settings are stored locally with SQLite. There is no LeafCue server.",
  },
  {
    icon: "wifi-outline",
    title: "No network calls",
    body: "LeafCue never makes network requests for plant data, analytics, or telemetry.",
  },
  {
    icon: "notifications-outline",
    title: "Reminders are local",
    body: "Care reminders are scheduled by the operating system on your device. They never leave it.",
  },
  {
    icon: "cloud-download-outline",
    title: "You own your backups",
    body: "Backups are JSON files. They go where you tell them to go (Files, AirDrop, email, etc.) and never to LeafCue.",
  },
  {
    icon: "people-outline",
    title: "No accounts",
    body: "There is no sign-up, sign-in, or identifier collected.",
  },
];

export function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");

  return (
    <View className="flex-1 bg-background">
      <SettingsHeader title="Privacy" />
      <Container className="px-6" isScrollable>
        <View className="gap-3" style={{ paddingBottom: insets.bottom + 32 }}>
          <View className="gap-2 rounded-3xl border border-border/40 bg-surface p-4">
            <Text className="font-semibold text-base text-foreground">
              Local-first by design
            </Text>
            <Text className="text-muted text-xs">
              LeafCue is a private offline plant care tracker. The summary below
              describes what your device does and does not do.
            </Text>
          </View>

          <View className="gap-2">
            {POINTS.map((point) => (
              <View
                key={point.title}
                className="flex-row items-start gap-3 rounded-3xl border border-border/40 bg-surface p-4"
              >
                <View className="size-10 items-center justify-center rounded-2xl bg-accent-soft">
                  <Ionicons name={point.icon} size={18} color={accent} />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="font-medium text-foreground text-sm">
                    {point.title}
                  </Text>
                  <Text className="text-muted text-xs">{point.body}</Text>
                </View>
              </View>
            ))}
          </View>

          <PressableFeedback
            onPress={() => openExternal(LINKS.privacy)}
            className="mt-1 flex-row items-center justify-between rounded-3xl border border-border/40 bg-surface p-4 active:opacity-70"
          >
            <View className="flex-1 gap-1 pr-3">
              <Text className="font-medium text-foreground text-sm">
                Read the full Privacy Policy
              </Text>
              <Text className="text-muted text-xs">
                Opens leafcue.galaxyway.ai/privacy in your browser.
              </Text>
            </View>
            <Ionicons name="open-outline" size={18} color={accent} />
          </PressableFeedback>
        </View>
      </Container>
    </View>
  );
}
