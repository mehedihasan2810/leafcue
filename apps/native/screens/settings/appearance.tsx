import { Ionicons } from "@expo/vector-icons";
import { cn, useThemeColor } from "heroui-native";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { useDatabase } from "@/lib/db";
import type { AppearanceMode } from "@/lib/db/zod";
import { SettingsHeader } from "@/screens/settings/settings-header";
import { useThemeStore } from "@/stores/use-theme-store";

const OPTIONS: ReadonlyArray<{
  value: AppearanceMode;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    value: "system",
    label: "Follow system",
    description: "Match your device's appearance.",
    icon: "phone-portrait-outline",
  },
  {
    value: "light",
    label: "Light",
    description: "Bright theme everywhere.",
    icon: "sunny-outline",
  },
  {
    value: "dark",
    label: "Dark",
    description: "Easier on the eyes at night.",
    icon: "moon-outline",
  },
];

export function AppearanceSettingsScreen() {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");
  const db = useDatabase();
  const mode = useThemeStore((s) => s.appearanceMode);
  const setAppearanceMode = useThemeStore((s) => s.setAppearanceMode);

  return (
    <View className="flex-1 bg-background">
      <SettingsHeader title="Appearance" />
      <Container className="px-6" isScrollable>
        <View className="gap-3" style={{ paddingBottom: insets.bottom + 32 }}>
          <View className="gap-2 rounded-3xl border border-border/40 bg-surface p-3">
            {OPTIONS.map((option) => {
              const isActive = mode === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={option.label}
                  accessibilityHint={option.description}
                  onPress={() => setAppearanceMode(db, option.value)}
                  className={cn(
                    "flex-row items-center gap-3 rounded-2xl border p-3",
                    isActive
                      ? "border-accent bg-accent-soft/40"
                      : "border-transparent",
                  )}
                >
                  <View className="size-10 items-center justify-center rounded-2xl bg-accent-soft">
                    <Ionicons name={option.icon} size={18} color={accent} />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="font-medium text-base text-foreground">
                      {option.label}
                    </Text>
                    <Text className="text-muted text-xs">
                      {option.description}
                    </Text>
                  </View>
                  {isActive ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={accent}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
          <Text className="px-1 text-muted text-xs">
            Appearance is stored on this device only.
          </Text>
        </View>
      </Container>
    </View>
  );
}
