import { Ionicons } from "@expo/vector-icons";
import { Button, PressableFeedback, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import { getCareTaskIcon } from "@/components/care-task-icons";
import { isOverdue, relativeDueLabel } from "@/lib/dates";
import type { DueTaskRow } from "@/lib/db/repositories";

type PlantNextCareCardProps = {
  nextRow: DueTaskRow | null;
  upcomingRows: ReadonlyArray<DueTaskRow>;
  scheduleCount: number;
  onComplete: (row: DueTaskRow) => void;
  onMore: (row: DueTaskRow) => void;
  onWhy: (row: DueTaskRow) => void;
  onEditSchedules: () => void;
};

export function PlantNextCareCard({
  nextRow,
  upcomingRows,
  scheduleCount,
  onComplete,
  onMore,
  onWhy,
  onEditSchedules,
}: PlantNextCareCardProps) {
  const accent = useThemeColor("accent");
  const danger = useThemeColor("danger");
  const muted = useThemeColor("muted");

  if (!nextRow) {
    return (
      <View className="gap-3 rounded-3xl border border-border/40 bg-surface p-4">
        <View className="flex-row items-start gap-3">
          <View className="size-10 items-center justify-center rounded-2xl bg-accent-soft">
            <Ionicons name="time-outline" size={18} color={accent} />
          </View>
          <View className="flex-1 gap-1">
            <Text className="font-semibold text-base text-foreground">
              Schedule missing
            </Text>
            <Text className="text-muted text-xs leading-4">
              Add a schedule so LeafCue can show what is next for this plant.
            </Text>
          </View>
        </View>
        <Button variant="secondary" size="sm" onPress={onEditSchedules}>
          <Button.Label>Add schedule</Button.Label>
        </Button>
      </View>
    );
  }

  const taskName =
    nextRow.schedule.customName ?? nextRow.template?.name ?? "Care cue";
  const overdue = isOverdue(nextRow.schedule.nextDueAt);
  const dueLabel = relativeDueLabel(nextRow.schedule.nextDueAt ?? null);
  const iconName = getCareTaskIcon(nextRow.template?.key);

  return (
    <View className="gap-4 rounded-3xl border border-border/40 bg-surface p-4">
      <View className="flex-row items-start gap-3">
        <View
          className={
            overdue
              ? "size-11 items-center justify-center rounded-2xl bg-danger-soft"
              : "size-11 items-center justify-center rounded-2xl bg-accent-soft"
          }
        >
          <Ionicons
            name={iconName}
            size={20}
            color={overdue ? danger : accent}
          />
        </View>
        <View className="flex-1 gap-1">
          <Text className="font-semibold text-foreground text-lg">
            Now & Next
          </Text>
          <Text className="text-muted text-xs leading-4">
            {overdue ? "Needs attention" : "Next care cue"} · {dueLabel}
          </Text>
        </View>
        <PressableFeedback
          onPress={() => onWhy(nextRow)}
          className="rounded-full bg-accent-soft px-3 py-2"
          accessibilityLabel="Why this cue"
        >
          <Text className="font-medium text-accent text-xs">Why?</Text>
        </PressableFeedback>
      </View>

      <View className="gap-1">
        <Text className="font-semibold text-base text-foreground">
          {taskName}
        </Text>
        <Text className="text-muted text-sm">
          {nextRow.schedule.instructions ??
            nextRow.template?.defaultInstructions ??
            "Use the schedule controls to adjust the cadence."}
        </Text>
      </View>

      <View className="flex-row gap-2">
        <Button
          size="sm"
          className="flex-1"
          onPress={() => onComplete(nextRow)}
        >
          <Button.Label>Complete</Button.Label>
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="flex-1"
          onPress={() => onMore(nextRow)}
        >
          <Button.Label>Snooze / edit</Button.Label>
        </Button>
      </View>

      {upcomingRows.length > 0 ? (
        <View className="gap-2 border-border/30 border-t pt-3">
          <Text className="font-medium text-muted text-xs uppercase">
            Coming up
          </Text>
          {upcomingRows.slice(0, 3).map((row) => (
            <PressableFeedback
              key={`next-upcoming-${row.schedule.id}`}
              onPress={() => onWhy(row)}
              className="flex-row items-center gap-2 rounded-2xl bg-background/70 px-3 py-2"
            >
              <Text
                className="flex-1 text-foreground text-sm"
                numberOfLines={1}
              >
                {row.schedule.customName ?? row.template?.name ?? "Care cue"}
              </Text>
              <Text className="text-muted text-xs">
                {relativeDueLabel(row.schedule.nextDueAt ?? null)}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={muted} />
            </PressableFeedback>
          ))}
        </View>
      ) : scheduleCount > 1 ? null : (
        <Button variant="ghost" size="sm" onPress={onEditSchedules}>
          <Button.Label>Edit care plan</Button.Label>
        </Button>
      )}
    </View>
  );
}
