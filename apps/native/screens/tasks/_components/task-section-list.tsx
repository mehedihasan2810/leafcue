import { Ionicons } from "@expo/vector-icons";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { Image } from "expo-image";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import { getCareTaskIcon } from "@/components/care-task-icons";
import { GroupedTaskCard } from "@/components/grouped-task-card";
import { SectionHeader } from "@/components/section-header";
import { isOverdue } from "@/lib/dates";
import type { CompletedLogRow, DueTaskRow } from "@/lib/db/repositories";
import type { Room, Shelf } from "@/lib/db/types";

type Now = Date;

type TaskSectionListProps = {
  schedules: ReadonlyArray<DueTaskRow>;
  completed: ReadonlyArray<CompletedLogRow>;
  filter: "today" | "overdue" | "upcoming" | "completed" | "all";
  now: Now;
  roomById: Map<number, Room>;
  shelfById: Map<number, Shelf>;
  onPressComplete: (row: DueTaskRow) => void;
  onLongPressComplete: (row: DueTaskRow) => void;
  onPressMenu: (row: DueTaskRow) => void;
  onPressOpenPlant: (plantId: number) => void;
  onPressCompletedPlant?: (plantId: number) => void;
};

type ScheduleSection = {
  key: string;
  title: string;
  caption?: string;
  rows: DueTaskRow[];
};

function bucketKey(date: Date | null, now: Now): string {
  if (!date) return "no-date";
  if (isOverdue(date, now)) return "overdue";
  if (isToday(date)) return "today";
  if (isTomorrow(date)) return "tomorrow";
  return format(date, "yyyy-MM-dd");
}

function bucketTitle(date: Date | null, now: Now): string {
  if (!date) return "No date";
  if (isOverdue(date, now)) return "Overdue";
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEEE, MMM d");
}

function buildScheduleSections(
  schedules: ReadonlyArray<DueTaskRow>,
  now: Now,
): ScheduleSection[] {
  const groups = new Map<string, DueTaskRow[]>();
  const order: string[] = [];

  for (const row of schedules) {
    const key = bucketKey(row.schedule.nextDueAt, now);
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)?.push(row);
  }

  return order.map((key) => {
    const rows = groups.get(key) ?? [];
    const first = rows[0];
    const sample = first?.schedule.nextDueAt ?? null;
    return {
      key,
      title: bucketTitle(sample, now),
      caption: rows.length === 1 ? "1 task" : `${rows.length} tasks`,
      rows,
    };
  });
}

export function TaskSectionList({
  schedules,
  completed,
  filter,
  now,
  roomById,
  shelfById,
  onPressComplete,
  onLongPressComplete,
  onPressMenu,
  onPressOpenPlant,
  onPressCompletedPlant,
}: TaskSectionListProps) {
  if (filter === "completed") {
    return (
      <CompletedList
        rows={completed}
        onPressPlant={onPressCompletedPlant ?? onPressOpenPlant}
      />
    );
  }

  const sections = buildScheduleSections(schedules, now);

  return (
    <View className="gap-5">
      {sections.map((section) => (
        <View key={section.key} className="gap-3">
          <SectionHeader
            title={section.title}
            count={section.rows.length}
            caption={section.caption}
          />
          <View className="gap-3">
            {section.rows.map((row) => {
              const overdue = isOverdue(row.schedule.nextDueAt, now);
              return (
                <GroupedTaskCard
                  key={`task-${row.schedule.id}`}
                  row={row}
                  isOverdue={overdue}
                  roomName={
                    row.plant.roomId !== null
                      ? roomById.get(row.plant.roomId)?.name
                      : null
                  }
                  shelfName={
                    row.plant.shelfId !== null
                      ? shelfById.get(row.plant.shelfId)?.name
                      : null
                  }
                  onPressComplete={onPressComplete}
                  onLongPressComplete={onLongPressComplete}
                  onPressMenu={onPressMenu}
                  onPressOpen={() => onPressOpenPlant(row.plant.id)}
                />
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

type CompletedListProps = {
  rows: ReadonlyArray<CompletedLogRow>;
  onPressPlant: (plantId: number) => void;
};

function CompletedList({ rows, onPressPlant }: CompletedListProps) {
  const groups = new Map<string, CompletedLogRow[]>();
  const order: string[] = [];

  for (const row of rows) {
    const key = format(row.log.completedAt, "yyyy-MM-dd");
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)?.push(row);
  }

  return (
    <View className="gap-5">
      {order.map((key) => {
        const groupRows = groups.get(key) ?? [];
        const sample = groupRows[0]?.log.completedAt;
        return (
          <View key={key} className="gap-3">
            <SectionHeader
              title={
                sample
                  ? isToday(sample)
                    ? "Today"
                    : isYesterday(sample)
                      ? "Yesterday"
                      : format(sample, "EEEE, MMM d")
                  : key
              }
              count={groupRows.length}
            />
            <View className="gap-2">
              {groupRows.map((row) => (
                <CompletedRow
                  key={`completed-${row.log.id}`}
                  row={row}
                  onPress={() => onPressPlant(row.plant.id)}
                />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function CompletedRow({
  row,
  onPress,
}: {
  row: CompletedLogRow;
  onPress: () => void;
}) {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");
  const success = useThemeColor("success");
  const taskName = row.log.title ?? row.template?.name ?? row.log.type;
  const time = format(row.log.completedAt, "p");

  return (
    <PressableFeedback
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-border/30 bg-surface p-3"
    >
      <View className="size-10 overflow-hidden rounded-xl bg-muted/15">
        {row.plant.photoUri ? (
          <Image
            source={{ uri: row.plant.photoUri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="leaf-outline" size={18} color={accent} />
          </View>
        )}
      </View>
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-1.5">
          <Ionicons
            name={getCareTaskIcon(row.template?.key)}
            size={12}
            color={success}
          />
          <Text className="font-medium text-foreground text-sm">
            {taskName}
          </Text>
        </View>
        <Text className="text-muted text-xs" numberOfLines={1}>
          {row.plant.nickname}
          {row.log.amount && row.log.unit
            ? ` · ${row.log.amount} ${row.log.unit}`
            : ""}
          {row.log.notes ? ` · ${row.log.notes}` : ""}
        </Text>
      </View>
      <Text className="text-muted text-xs" style={{ color: muted }}>
        {time}
      </Text>
    </PressableFeedback>
  );
}
