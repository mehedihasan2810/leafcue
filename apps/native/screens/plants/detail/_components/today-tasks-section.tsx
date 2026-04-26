import { Text, View } from "react-native";

import { GroupedTaskCard } from "@/components/grouped-task-card";
import { SectionHeader } from "@/components/section-header";
import type { useTaskHandlers } from "@/hooks/use-task-handlers";
import { isOverdue } from "@/lib/dates";
import type { DueTaskRow } from "@/lib/db/repositories";

type TodayTasksSectionProps = {
  rows: ReadonlyArray<DueTaskRow>;
  handlers: ReturnType<typeof useTaskHandlers>;
  onPressOpenPlant: (plantId: number) => void;
};

export function TodayTasksSection({
  rows,
  handlers,
  onPressOpenPlant,
}: TodayTasksSectionProps) {
  if (rows.length === 0) {
    return (
      <View className="gap-3">
        <SectionHeader title="Today" caption="No care due right now" />
        <View className="rounded-2xl border border-border/30 bg-surface p-4">
          <Text className="text-muted text-sm">
            All caught up. The next task will appear here when it's time.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <SectionHeader title="Today" count={rows.length} />
      <View className="gap-3">
        {rows.map((row) => (
          <GroupedTaskCard
            key={`detail-task-${row.schedule.id}`}
            row={row}
            isOverdue={isOverdue(row.schedule.nextDueAt)}
            onPressComplete={handlers.handleQuickComplete}
            onLongPressComplete={handlers.handleAddDetails}
            onPressMenu={handlers.openMenu}
            onPressOpen={() => onPressOpenPlant(row.plant.id)}
          />
        ))}
      </View>
    </View>
  );
}
