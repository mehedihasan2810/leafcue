import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { SettingsHeader } from "@/screens/settings/settings-header";

type HubItem = {
  href: string;
  label: string;
  caption: string;
  icon: keyof typeof import("@expo/vector-icons/Ionicons").default.glyphMap;
  testID?: string;
};

const SECTIONS: ReadonlyArray<{
  title: string;
  items: ReadonlyArray<HubItem>;
}> = [
  {
    title: "Personalization",
    items: [
      {
        href: "/settings/appearance",
        label: "Appearance",
        caption: "Light, dark, or follow system.",
        icon: "color-palette-outline",
      },
      {
        href: "/settings/app-preferences",
        label: "App preferences",
        caption: "Week start, units of measurement.",
        icon: "options-outline",
      },
      {
        href: "/settings/plant-defaults",
        label: "Plant defaults",
        caption: "Default care intervals for new plants.",
        icon: "leaf-outline",
      },
    ],
  },
  {
    title: "Reminders",
    items: [
      {
        href: "/settings/reminders",
        label: "Reminders",
        caption: "Local notifications for care tasks.",
        icon: "notifications-outline",
      },
    ],
  },
  {
    title: "Data & privacy",
    items: [
      {
        href: "/settings/backup",
        label: "Backup, export, import",
        caption: "JSON backup file you control.",
        icon: "cloud-download-outline",
      },
      {
        href: "/settings/archive",
        label: "Archive",
        caption: "Restore or delete archived plants.",
        icon: "archive-outline",
      },
      {
        href: "/settings/privacy",
        label: "Privacy",
        caption: "How LeafCue handles your data.",
        icon: "lock-closed-outline",
      },
    ],
  },
  {
    title: "About",
    items: [
      {
        href: "/settings/about",
        label: "About LeafCue",
        caption: "Version, credits, and feedback.",
        icon: "information-circle-outline",
      },
    ],
  },
];

export function SettingsHubScreen() {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");

  return (
    <View className="flex-1 bg-background">
      <SettingsHeader title="Settings" />
      <Container className="px-6" isScrollable>
        <View className="gap-6" style={{ paddingBottom: insets.bottom + 32 }}>
          <View className="gap-2 rounded-3xl border border-border/40 bg-surface p-4">
            <View className="flex-row items-start gap-3">
              <View className="size-10 items-center justify-center rounded-2xl bg-accent-soft">
                <Ionicons name="lock-closed-outline" size={18} color={accent} />
              </View>
              <View className="flex-1 gap-1">
                <Text className="font-semibold text-base text-foreground">
                  Private by default
                </Text>
                <Text className="text-muted text-xs leading-4">
                  Works offline. Your plant data stays on this device. Back up
                  your data before changing phones.
                </Text>
              </View>
            </View>
          </View>

          {SECTIONS.map((section) => (
            <View key={section.title} className="gap-2">
              <Text className="px-1 font-medium text-muted text-xs uppercase tracking-wide">
                {section.title}
              </Text>
              <View className="gap-2 rounded-3xl border border-border/40 bg-surface p-2">
                {section.items.map((item) => (
                  <PressableFeedback
                    key={item.href}
                    accessibilityLabel={item.label}
                    accessibilityHint={item.caption}
                    onPress={() => {
                      router.push(
                        // biome-ignore lint/suspicious/noExplicitAny: typed routes are generated post-build
                        item.href as any,
                      );
                    }}
                    className="flex-row items-center gap-3 rounded-2xl p-3 active:bg-muted/10"
                  >
                    <View className="size-10 items-center justify-center rounded-2xl bg-accent-soft">
                      <Ionicons name={item.icon} size={18} color={accent} />
                    </View>
                    <View className="flex-1 gap-0.5">
                      <Text className="font-medium text-base text-foreground">
                        {item.label}
                      </Text>
                      <Text className="text-muted text-xs">{item.caption}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={muted} />
                  </PressableFeedback>
                ))}
              </View>
            </View>
          ))}
          <Text className="text-center text-muted text-xs">
            LeafCue is offline-first. No accounts, no servers.
          </Text>
        </View>
      </Container>
    </View>
  );
}
