import { Ionicons } from "@expo/vector-icons";
import { cn, useThemeColor } from "heroui-native";
import { FlatList, Pressable, Text } from "react-native";

import type { PlantTimelineKind } from "@/lib/db/repositories";

export type TimelineFilter = "all" | PlantTimelineKind;

type TimelineFilterProps = {
  value: TimelineFilter;
  onChange: (value: TimelineFilter) => void;
};

const FILTERS: ReadonlyArray<{
  id: TimelineFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { id: "all", label: "All", icon: "albums-outline" },
  { id: "care_log", label: "Care", icon: "checkmark-done-outline" },
  { id: "photo", label: "Photos", icon: "camera-outline" },
  { id: "journal_entry", label: "Notes", icon: "create-outline" },
  { id: "growth_measurement", label: "Growth", icon: "resize-outline" },
  { id: "health_observation", label: "Health", icon: "medkit-outline" },
];

export function TimelineFilterRow({ value, onChange }: TimelineFilterProps) {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");

  return (
    <FlatList
      horizontal
      data={FILTERS}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
      renderItem={({ item }) => {
        const isActive = value === item.id;
        return (
          <Pressable
            onPress={() => onChange(item.id)}
            className={cn(
              "flex-row items-center gap-1.5 rounded-full border px-3 py-2",
              isActive
                ? "border-accent bg-accent-soft"
                : "border-border/60 bg-surface",
            )}
          >
            <Ionicons
              name={item.icon}
              size={12}
              color={isActive ? accent : muted}
            />
            <Text
              className={cn(
                "font-medium text-xs",
                isActive ? "text-accent-soft-foreground" : "text-foreground",
              )}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}
