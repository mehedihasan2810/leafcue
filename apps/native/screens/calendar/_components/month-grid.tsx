import { Ionicons } from "@expo/vector-icons";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { cn, useThemeColor } from "heroui-native";
import { Pressable, Text, View } from "react-native";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type MonthGridDayMeta = {
  isOverdue?: boolean;
  taskCount?: number;
  completedCount?: number;
};

type MonthGridProps = {
  monthAnchor: Date;
  onChangeMonth: (next: Date) => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  metaByKey: Map<string, MonthGridDayMeta>;
};

export function MonthGrid({
  monthAnchor,
  onChangeMonth,
  selectedDate,
  onSelectDate,
  metaByKey,
}: MonthGridProps) {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");
  const danger = useThemeColor("danger");
  const success = useThemeColor("success");

  const monthStart = startOfMonth(monthAnchor);
  const monthEnd = endOfMonth(monthAnchor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <View className="gap-3 rounded-3xl border border-border/40 bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <Pressable
          hitSlop={8}
          onPress={() => onChangeMonth(subMonths(monthAnchor, 1))}
          className="size-9 items-center justify-center rounded-full bg-background"
          accessibilityLabel="Previous month"
        >
          <Ionicons name="chevron-back" size={18} color={muted} />
        </Pressable>
        <View className="items-center">
          <Text className="font-semibold text-base text-foreground">
            {format(monthAnchor, "MMMM yyyy")}
          </Text>
          <Pressable
            hitSlop={8}
            onPress={() => {
              const today = new Date();
              onChangeMonth(today);
              onSelectDate(today);
            }}
          >
            <Text className="text-accent text-xs">Today</Text>
          </Pressable>
        </View>
        <Pressable
          hitSlop={8}
          onPress={() => onChangeMonth(addMonths(monthAnchor, 1))}
          className="size-9 items-center justify-center rounded-full bg-background"
          accessibilityLabel="Next month"
        >
          <Ionicons name="chevron-forward" size={18} color={muted} />
        </Pressable>
      </View>

      <View className="flex-row">
        {WEEKDAYS.map((day) => (
          <View key={day} className="flex-1 items-center">
            <Text className="text-muted text-xs uppercase">{day}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {days.map((day) => {
          const inMonth = isSameMonth(day, monthAnchor);
          const isSelected = isSameDay(day, selectedDate);
          const today = isToday(day);
          const meta = metaByKey.get(format(day, "yyyy-MM-dd"));
          const taskCount = meta?.taskCount ?? 0;
          const completedCount = meta?.completedCount ?? 0;
          const isOverdueDay = meta?.isOverdue ?? false;

          return (
            <View
              key={day.toISOString()}
              style={{ width: "14.2857%" }}
              className="items-center py-1"
            >
              <Pressable
                onPress={() => onSelectDate(day)}
                hitSlop={4}
                className={cn(
                  "size-10 items-center justify-center rounded-2xl",
                  isSelected ? "bg-accent" : null,
                  !isSelected && today ? "bg-accent-soft" : null,
                )}
              >
                <Text
                  className={cn(
                    "font-semibold text-sm",
                    isSelected
                      ? "text-accent-foreground"
                      : !inMonth
                        ? "text-muted/60"
                        : "text-foreground",
                  )}
                >
                  {format(day, "d")}
                </Text>
                <View className="mt-0.5 flex-row gap-0.5">
                  {taskCount > 0 ? (
                    <View
                      className="size-1.5 rounded-full"
                      style={{
                        backgroundColor: isOverdueDay ? danger : accent,
                      }}
                    />
                  ) : null}
                  {completedCount > 0 ? (
                    <View
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: success }}
                    />
                  ) : null}
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
