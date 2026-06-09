import { Ionicons } from "@expo/vector-icons";
import { Button, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import { getCareTaskIcon } from "@/components/care-task-icons";
import { resolveIntervalDays } from "@/lib/care/scheduling";
import { relativeDueLabel } from "@/lib/dates";
import type { CareTaskTemplate, PlantTaskSchedule } from "@/lib/db/types";

type CarePlanCardProps = {
  schedules: ReadonlyArray<PlantTaskSchedule>;
  templates: ReadonlyArray<CareTaskTemplate>;
  onEdit: () => void;
};

export function CarePlanCard({
  schedules,
  templates,
  onEdit,
}: CarePlanCardProps) {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");

  const templateById = new Map<number, CareTaskTemplate>();
  for (const template of templates) templateById.set(template.id, template);

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <View className="gap-0.5">
          <Text className="font-semibold text-base text-foreground">
            Care Plan
          </Text>
          <Text className="text-muted text-xs">
            Intervals, next due dates, and reminder timing
          </Text>
        </View>
        <Button size="sm" variant="secondary" onPress={onEdit}>
          <Button.Label>Edit</Button.Label>
        </Button>
      </View>

      {schedules.length === 0 ? (
        <View className="rounded-2xl border border-border/30 bg-surface p-4">
          <Text className="text-muted text-sm">
            No care schedules yet. Add one to keep this plant in the daily
            queue.
          </Text>
        </View>
      ) : (
        <View className="gap-2">
          {schedules.map((schedule) => {
            const template = schedule.templateId
              ? (templateById.get(schedule.templateId) ?? null)
              : null;
            const interval = resolveIntervalDays(
              schedule.intervalDays,
              template?.defaultIntervalDays ?? null,
            );
            return (
              <View
                key={`plan-${schedule.id}`}
                className="flex-row items-center gap-3 rounded-2xl border border-border/30 bg-surface p-3"
                style={{ opacity: schedule.isEnabled ? 1 : 0.55 }}
              >
                <View className="size-10 items-center justify-center rounded-2xl bg-accent-soft">
                  <Ionicons
                    name={getCareTaskIcon(template?.key)}
                    size={18}
                    color={accent}
                  />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="font-medium text-foreground text-sm">
                    {schedule.customName ?? template?.name ?? "Custom care"}
                  </Text>
                  <Text className="text-muted text-xs">
                    {interval
                      ? `Every ${interval} day${interval === 1 ? "" : "s"}`
                      : "One-off"}{" "}
                    · Next {relativeDueLabel(schedule.nextDueAt ?? null)}
                  </Text>
                </View>
                <Text className="font-medium text-muted text-xs">
                  {schedule.preferredHour !== null &&
                  schedule.preferredMinute !== null
                    ? `${schedule.preferredHour}:${schedule.preferredMinute
                        .toString()
                        .padStart(2, "0")}`
                    : "Default"}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={muted} />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
