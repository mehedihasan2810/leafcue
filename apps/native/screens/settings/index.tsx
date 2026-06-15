import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { useCallback, useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { useDatabase } from "@/lib/db";
import {
  clearDemoData,
  isDemoDataLoaded,
  loadDemoData,
} from "@/lib/db/seed-demo";
import { SettingsHeader } from "@/screens/settings/settings-header";
import { useEntitlementsStore } from "@/stores/use-entitlements-store";

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

          <PlusCard accent={accent} muted={muted} />

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
          {__DEV__ && <DemoDataCard />}

          <Text className="text-center text-muted text-xs">
            LeafCue is offline-first. No accounts, no servers.
          </Text>
        </View>
      </Container>
    </View>
  );
}

function DemoDataCard() {
  const db = useDatabase();
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");
  const [loaded, setLoaded] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoaded(await isDemoDataLoaded(db));
  }, [db]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleLoad = useCallback(async () => {
    setBusy(true);
    try {
      await loadDemoData(db);
      await refresh();
      Alert.alert(
        "Demo data loaded",
        "8 plants, care schedules, journal entries, and growth measurements have been added. Restart the app if lists don't refresh automatically.",
      );
    } catch (err) {
      Alert.alert("Error", String(err));
    } finally {
      setBusy(false);
    }
  }, [db, refresh]);

  const handleClear = useCallback(async () => {
    Alert.alert(
      "Clear demo data?",
      "All demo plants and their data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              await clearDemoData(db);
              await refresh();
            } catch (err) {
              Alert.alert("Error", String(err));
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }, [db, refresh]);

  return (
    <View className="gap-2">
      <Text className="px-1 font-medium text-muted text-xs uppercase tracking-wide">
        App Store Screenshots
      </Text>
      <View className="rounded-3xl border border-border/40 bg-surface p-2">
        <PressableFeedback
          accessibilityLabel={loaded ? "Clear demo data" : "Load demo data"}
          onPress={loaded ? handleClear : handleLoad}
          isDisabled={busy || loaded === null}
          className="flex-row items-center gap-3 rounded-2xl p-3 active:bg-muted/10"
        >
          <View className="size-10 items-center justify-center rounded-2xl bg-accent-soft">
            <Ionicons
              name={loaded ? "trash-outline" : "leaf-outline"}
              size={18}
              color={loaded ? muted : accent}
            />
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="font-medium text-base text-foreground">
              {busy
                ? "Working…"
                : loaded
                  ? "Clear demo data"
                  : "Load demo data"}
            </Text>
            <Text className="text-muted text-xs">
              {loaded
                ? "Remove all 8 demo plants and related data."
                : "Add 8 realistic plants with photos, schedules, and journal entries."}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={muted} />
        </PressableFeedback>
      </View>
    </View>
  );
}

function PlusCard({ accent, muted }: { accent: string; muted: string }) {
  const isPlusActive = useEntitlementsStore((state) => state.isPlusActive);

  const caption = isPlusActive
    ? "Active — thank you for supporting LeafCue."
    : "Unlimited active plants and deeper local insights.";

  return (
    <View className="gap-2">
      <Text className="px-1 font-medium text-muted text-xs uppercase tracking-wide">
        Plus
      </Text>
      <View className="rounded-3xl border border-border/40 bg-surface p-2">
        <PressableFeedback
          accessibilityLabel="LeafCue Plus"
          accessibilityHint={caption}
          onPress={() => {
            router.push({
              pathname: "/settings/plus",
              params: { reason: "settings" },
            });
          }}
          className="flex-row items-center gap-3 rounded-2xl p-3 active:bg-muted/10"
        >
          <View className="size-10 items-center justify-center rounded-2xl bg-accent-soft">
            <Ionicons name="sparkles-outline" size={18} color={accent} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="font-medium text-base text-foreground">
              LeafCue Plus
            </Text>
            <Text className="text-muted text-xs">{caption}</Text>
          </View>
          <View
            className={
              isPlusActive
                ? "rounded-full bg-accent-soft px-2.5 py-1"
                : "rounded-full border border-border/50 px-2.5 py-1"
            }
          >
            <Text
              className={
                isPlusActive
                  ? "font-semibold text-accent text-xs"
                  : "font-medium text-muted text-xs"
              }
            >
              {isPlusActive ? "Plus" : "Free"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={muted} />
        </PressableFeedback>
      </View>
    </View>
  );
}
