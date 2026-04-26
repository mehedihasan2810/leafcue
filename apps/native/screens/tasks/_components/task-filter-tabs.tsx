import { Ionicons } from "@expo/vector-icons";
import { Chip, useThemeColor } from "heroui-native";
import { ScrollView, View } from "react-native";

import type { TaskFilter } from "@/lib/db/zod";

type FilterOption = {
  value: TaskFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const FILTER_OPTIONS: ReadonlyArray<FilterOption> = [
  { value: "today", label: "Today", icon: "sunny-outline" },
  { value: "overdue", label: "Overdue", icon: "alert-circle-outline" },
  { value: "upcoming", label: "Upcoming", icon: "calendar-outline" },
  { value: "completed", label: "Completed", icon: "checkmark-done-outline" },
  { value: "all", label: "All", icon: "list-outline" },
];

type TaskFilterTabsProps = {
  value: TaskFilter;
  onChange: (filter: TaskFilter) => void;
  counts?: Partial<Record<TaskFilter, number>>;
};

export function TaskFilterTabs({
  value,
  onChange,
  counts,
}: TaskFilterTabsProps) {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 4 }}
    >
      <View className="flex-row gap-2">
        {FILTER_OPTIONS.map((option) => {
          const isActive = option.value === value;
          const count = counts?.[option.value];
          return (
            <Chip
              key={option.value}
              variant={isActive ? "primary" : "secondary"}
              size="md"
              color={isActive ? "accent" : "default"}
              onPress={() => onChange(option.value)}
            >
              <Ionicons
                name={option.icon}
                size={14}
                color={isActive ? accent : muted}
              />
              <Chip.Label>{option.label}</Chip.Label>
              {typeof count === "number" && count > 0 ? (
                <Chip.Label>· {count}</Chip.Label>
              ) : null}
            </Chip>
          );
        })}
      </View>
    </ScrollView>
  );
}
