import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Button, cn, useThemeColor } from "heroui-native";
import { Platform, Pressable, Text, View } from "react-native";

import { getCareTaskIcon } from "@/components/care-task-icons";
import { relativeDueLabel } from "@/lib/dates";
import type { DueTaskRow } from "@/lib/db/repositories";

type CareTaskCardProps = {
  row: DueTaskRow;
  isOverdue?: boolean;
  isLoading?: boolean;
  onPressComplete?: (row: DueTaskRow) => void;
  onPressSnooze?: (row: DueTaskRow) => void;
  onPressOpen?: (row: DueTaskRow) => void;
  className?: string;
};

export function CareTaskCard({
  row,
  isOverdue,
  isLoading,
  onPressComplete,
  onPressSnooze,
  onPressOpen,
  className,
}: CareTaskCardProps) {
  const accentColor = useThemeColor("accent");
  const dangerColor = useThemeColor("danger");
  const successColor = useThemeColor("success");

  const { schedule, plant, template } = row;
  const iconName = getCareTaskIcon(template?.key);

  const taskLabel = schedule.customName ?? template?.name ?? "Care cue";
  const dueLabel = relativeDueLabel(schedule.nextDueAt ?? null);
  const dueColor = isOverdue ? dangerColor : accentColor;

  const handleComplete = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPressComplete?.(row);
  };

  const handleSnooze = () => {
    if (Platform.OS === "ios") {
      Haptics.selectionAsync();
    }
    onPressSnooze?.(row);
  };

  return (
    <Pressable
      onPress={() => onPressOpen?.(row)}
      className={cn(
        "gap-3 rounded-2xl border border-border/40 bg-surface p-4",
        isOverdue ? "border-danger/30" : null,
        className,
      )}
    >
      <View className="flex-row items-center gap-3">
        <View
          className={cn(
            "size-10 items-center justify-center rounded-xl",
            isOverdue ? "bg-danger-soft" : "bg-accent-soft",
          )}
        >
          <Ionicons
            name={iconName}
            size={20}
            color={isOverdue ? dangerColor : accentColor}
          />
        </View>
        <View className="flex-1 gap-0.5">
          <Text
            className="font-semibold text-base text-foreground"
            numberOfLines={1}
          >
            {taskLabel}
          </Text>
          <Text className="text-muted text-sm" numberOfLines={1}>
            {plant.nickname}
          </Text>
        </View>
        <View className="items-end gap-0.5">
          <Text
            className="font-medium text-xs uppercase tracking-wide"
            style={{ color: dueColor }}
          >
            {isOverdue ? "Overdue" : "Due"}
          </Text>
          <Text className="text-muted text-xs">{dueLabel}</Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        <Button
          size="sm"
          className="flex-1"
          isDisabled={isLoading}
          onPress={handleComplete}
        >
          <Ionicons name="checkmark-outline" size={16} color={successColor} />
          <Button.Label>Done</Button.Label>
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="flex-1"
          isDisabled={isLoading}
          onPress={handleSnooze}
        >
          <Ionicons name="time-outline" size={16} color={accentColor} />
          <Button.Label>Snooze</Button.Label>
        </Button>
      </View>
    </Pressable>
  );
}
