import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Button, Chip, cn, useThemeColor } from "heroui-native";
import { Platform, Pressable, Text, View } from "react-native";

import { getCareTaskIcon } from "@/components/care-task-icons";
import { relativeDueLabel } from "@/lib/dates";
import type { DueTaskRow } from "@/lib/db/repositories";

export type GroupedTaskCardProps = {
  row: DueTaskRow;
  isOverdue?: boolean;
  isLoading?: boolean;
  roomName?: string | null;
  shelfName?: string | null;
  onPressComplete?: (row: DueTaskRow) => void;
  onLongPressComplete?: (row: DueTaskRow) => void;
  onPressMenu?: (row: DueTaskRow) => void;
  onPressOpen?: (row: DueTaskRow) => void;
  className?: string;
};

export function GroupedTaskCard({
  row,
  isOverdue,
  isLoading,
  roomName,
  shelfName,
  onPressComplete,
  onLongPressComplete,
  onPressMenu,
  onPressOpen,
  className,
}: GroupedTaskCardProps) {
  const accentColor = useThemeColor("accent");
  const dangerColor = useThemeColor("danger");
  const successColor = useThemeColor("success");
  const mutedColor = useThemeColor("muted");

  const { schedule, plant, template } = row;
  const iconName = getCareTaskIcon(template?.key);
  const taskLabel = schedule.customName ?? template?.name ?? "Care cue";
  const dueLabel = relativeDueLabel(schedule.nextDueAt ?? null);
  const dueColor = isOverdue ? dangerColor : accentColor;
  const instructions = schedule.instructions ?? template?.defaultInstructions;

  const handleComplete = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPressComplete?.(row);
  };

  const handleLongPress = () => {
    if (Platform.OS === "ios") {
      Haptics.selectionAsync();
    }
    onLongPressComplete?.(row);
  };

  const handleMenu = () => {
    if (Platform.OS === "ios") {
      Haptics.selectionAsync();
    }
    onPressMenu?.(row);
  };

  return (
    <View
      className={cn(
        "gap-3 rounded-3xl border border-border/40 bg-surface p-4",
        isOverdue ? "border-danger/30 bg-danger-soft/20" : null,
        className,
      )}
    >
      <Pressable
        onPress={() => onPressOpen?.(row)}
        className="flex-row items-start gap-3"
        accessibilityRole="button"
        accessibilityLabel={`${taskLabel} for ${plant.nickname}`}
      >
        <View className="size-14 overflow-hidden rounded-2xl bg-muted/15">
          {plant.photoUri ? (
            <Image
              source={{ uri: plant.photoUri }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="leaf-outline" size={24} color={accentColor} />
            </View>
          )}
        </View>

        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <View
              className={cn(
                "size-7 items-center justify-center rounded-lg",
                isOverdue ? "bg-danger-soft" : "bg-accent-soft",
              )}
            >
              <Ionicons
                name={iconName}
                size={14}
                color={isOverdue ? dangerColor : accentColor}
              />
            </View>
            <Text
              className="flex-1 font-semibold text-base text-foreground"
              numberOfLines={1}
            >
              {taskLabel}
            </Text>
            <Text
              className="font-medium text-xs uppercase tracking-wide"
              style={{ color: dueColor }}
            >
              {isOverdue ? "Overdue" : dueLabel}
            </Text>
          </View>

          <Text className="text-foreground text-sm" numberOfLines={1}>
            {plant.nickname}
          </Text>

          {instructions ? (
            <Text className="text-muted text-xs" numberOfLines={2}>
              {instructions}
            </Text>
          ) : null}

          <View className="flex-row flex-wrap gap-1.5 pt-1">
            {roomName ? (
              <Chip variant="secondary" size="sm" color="default">
                <Ionicons name="home-outline" size={12} color={mutedColor} />
                <Chip.Label>{roomName}</Chip.Label>
              </Chip>
            ) : null}
            {shelfName ? (
              <Chip variant="secondary" size="sm" color="default">
                <Ionicons name="layers-outline" size={12} color={mutedColor} />
                <Chip.Label>{shelfName}</Chip.Label>
              </Chip>
            ) : null}
            {schedule.snoozedUntil ? (
              <Chip variant="soft" size="sm" color="warning">
                <Ionicons name="time-outline" size={12} color={mutedColor} />
                <Chip.Label>Snoozed</Chip.Label>
              </Chip>
            ) : null}
          </View>
        </View>
      </Pressable>

      <View className="flex-row gap-2">
        <Button
          size="sm"
          className="flex-1"
          isDisabled={isLoading}
          onPress={handleComplete}
          onLongPress={handleLongPress}
        >
          <Ionicons name="checkmark-outline" size={16} color={successColor} />
          <Button.Label>Done</Button.Label>
        </Button>
        <Button
          size="sm"
          variant="secondary"
          isDisabled={isLoading}
          onPress={handleMenu}
          accessibilityLabel="More actions"
        >
          <Ionicons name="ellipsis-horizontal" size={16} color={accentColor} />
          <Button.Label>More</Button.Label>
        </Button>
      </View>
    </View>
  );
}
