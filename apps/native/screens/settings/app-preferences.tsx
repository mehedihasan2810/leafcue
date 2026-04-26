import { Ionicons } from "@expo/vector-icons";
import { cn, useThemeColor } from "heroui-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { SectionHeader } from "@/components/section-header";
import { useDatabase } from "@/lib/db";
import type { MeasurementUnits, WeekStartDay } from "@/lib/db/zod";
import {
  loadAppPreferences,
  updateAppPreferences,
} from "@/lib/settings/app-settings";
import { SettingsHeader } from "@/screens/settings/settings-header";

const WEEK_OPTIONS: ReadonlyArray<{ value: WeekStartDay; label: string }> = [
  { value: "monday", label: "Monday" },
  { value: "sunday", label: "Sunday" },
  { value: "saturday", label: "Saturday" },
];

const UNIT_OPTIONS: ReadonlyArray<{
  value: MeasurementUnits;
  label: string;
  caption: string;
}> = [
  { value: "metric", label: "Metric", caption: "Centimeters, milliliters." },
  { value: "imperial", label: "Imperial", caption: "Inches, fluid ounces." },
];

export function AppPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");
  const db = useDatabase();

  const [prefs, setPrefs] = useState(() => loadAppPreferences(db));

  const updateWeek = (value: WeekStartDay) => {
    const next = updateAppPreferences(db, { weekStartDay: value });
    setPrefs(next);
  };
  const updateUnits = (value: MeasurementUnits) => {
    const next = updateAppPreferences(db, { units: value });
    setPrefs(next);
  };

  return (
    <View className="flex-1 bg-background">
      <SettingsHeader title="App preferences" />
      <Container className="px-6" isScrollable>
        <View className="gap-6" style={{ paddingBottom: insets.bottom + 32 }}>
          <View className="gap-3">
            <SectionHeader
              title="Week starts on"
              caption="Used by the calendar and weekly summaries."
            />
            <View className="gap-2 rounded-3xl border border-border/40 bg-surface p-2">
              {WEEK_OPTIONS.map((option) => {
                const isActive = prefs.weekStartDay === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={option.label}
                    onPress={() => updateWeek(option.value)}
                    className={cn(
                      "flex-row items-center justify-between rounded-2xl p-3",
                      isActive ? "bg-accent-soft/40" : null,
                    )}
                  >
                    <Text className="font-medium text-base text-foreground">
                      {option.label}
                    </Text>
                    {isActive ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={accent}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="gap-3">
            <SectionHeader
              title="Measurement units"
              caption="Affects growth measurements and watering hints."
            />
            <View className="gap-2 rounded-3xl border border-border/40 bg-surface p-2">
              {UNIT_OPTIONS.map((option) => {
                const isActive = prefs.units === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={option.label}
                    accessibilityHint={option.caption}
                    onPress={() => updateUnits(option.value)}
                    className={cn(
                      "flex-row items-center gap-3 rounded-2xl p-3",
                      isActive ? "bg-accent-soft/40" : null,
                    )}
                  >
                    <View className="flex-1 gap-0.5">
                      <Text className="font-medium text-base text-foreground">
                        {option.label}
                      </Text>
                      <Text className="text-muted text-xs">
                        {option.caption}
                      </Text>
                    </View>
                    {isActive ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={accent}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Container>
    </View>
  );
}
