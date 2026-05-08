import { Ionicons } from "@expo/vector-icons";
import {
  endOfMonth,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router } from "expo-router";
import { Chip, PressableFeedback, useThemeColor } from "heroui-native";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import { Container } from "@/components/container";
import { EmptyState } from "@/components/empty-state";
import { GroupedTaskCard } from "@/components/grouped-task-card";
import { SectionHeader } from "@/components/section-header";
import { TaskActionSheets } from "@/components/task-action-sheets";
import { useTaskHandlers } from "@/hooks/use-task-handlers";
import { isOverdue } from "@/lib/dates";
import { useDatabase } from "@/lib/db";
import {
  type CompletedLogRow,
  type DueTaskRow,
  getAllActiveScheduleRows,
  getCompletedTaskLogs,
  getOverdueTasks,
  getRooms,
  getShelves,
} from "@/lib/db/repositories";
import {
  careLogs,
  plants,
  plantTaskSchedules,
  rooms as roomsTable,
  shelves as shelvesTable,
} from "@/lib/db/schema";
import type { Room, Shelf } from "@/lib/db/types";

import {
  MonthGrid,
  type MonthGridDayMeta,
} from "@/screens/calendar/_components/month-grid";

const calendarSegmentValues = ["upcoming", "overdue", "history"] as const;
type CalendarSegment = (typeof calendarSegmentValues)[number];
const calendarSegmentSchema = z.enum(calendarSegmentValues);

export function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");
  const success = useThemeColor("success");
  const db = useDatabase();
  const [monthAnchor, setMonthAnchor] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    startOfDay(new Date()),
  );
  const [segment, setSegment] = useState<CalendarSegment>("upcoming");

  const livePlants = useLiveQuery(db.select().from(plants));
  const liveSchedules = useLiveQuery(db.select().from(plantTaskSchedules));
  const liveLogs = useLiveQuery(db.select().from(careLogs));
  const liveRooms = useLiveQuery(db.select().from(roomsTable));
  const liveShelves = useLiveQuery(db.select().from(shelvesTable));

  const now = new Date();

  const allSchedules = useMemo<DueTaskRow[]>(() => {
    // Reactivity signal: re-run when underlying tables change
    void liveSchedules.data;
    void livePlants.data;
    return getAllActiveScheduleRows(db);
  }, [db, liveSchedules.data, livePlants.data]);

  const overdueRows = useMemo<DueTaskRow[]>(() => {
    void liveSchedules.data;
    void livePlants.data;
    return getOverdueTasks(db, now);
  }, [db, liveSchedules.data, livePlants.data, now]);

  const completedRows = useMemo<CompletedLogRow[]>(() => {
    void liveLogs.data;
    void livePlants.data;
    return getCompletedTaskLogs(db, {
      from: startOfMonth(monthAnchor),
      to: endOfMonth(monthAnchor),
      limit: 200,
    });
  }, [db, monthAnchor, liveLogs.data, livePlants.data]);

  const roomList = useMemo<Room[]>(() => {
    void liveRooms.data;
    return getRooms(db);
  }, [db, liveRooms.data]);
  const shelfList = useMemo<Shelf[]>(() => {
    void liveShelves.data;
    return getShelves(db);
  }, [db, liveShelves.data]);
  const roomById = useMemo(() => {
    const map = new Map<number, Room>();
    for (const room of roomList) map.set(room.id, room);
    return map;
  }, [roomList]);
  const shelfById = useMemo(() => {
    const map = new Map<number, Shelf>();
    for (const shelf of shelfList) map.set(shelf.id, shelf);
    return map;
  }, [shelfList]);

  const metaByKey = useMemo(() => {
    const map = new Map<string, MonthGridDayMeta>();
    for (const row of allSchedules) {
      const due = row.schedule.nextDueAt;
      if (!due) continue;
      const key = format(due, "yyyy-MM-dd");
      const existing = map.get(key) ?? {};
      map.set(key, {
        ...existing,
        taskCount: (existing.taskCount ?? 0) + 1,
        isOverdue: existing.isOverdue || isOverdue(due, now),
      });
    }
    for (const row of completedRows) {
      const key = format(row.log.completedAt, "yyyy-MM-dd");
      const existing = map.get(key) ?? {};
      map.set(key, {
        ...existing,
        completedCount: (existing.completedCount ?? 0) + 1,
      });
    }
    return map;
  }, [allSchedules, completedRows, now]);

  const tasksForSelectedDay = useMemo<DueTaskRow[]>(() => {
    return allSchedules.filter((row) => {
      const due = row.schedule.nextDueAt;
      if (!due) return false;
      return isSameDay(due, selectedDate);
    });
  }, [allSchedules, selectedDate]);

  const completedForSelectedDay = useMemo<CompletedLogRow[]>(() => {
    return completedRows.filter((row) =>
      isSameDay(row.log.completedAt, selectedDate),
    );
  }, [completedRows, selectedDate]);

  const handlers = useTaskHandlers();

  const handleOpenPlant = (plantId: number) => {
    router.push({
      pathname: "/plants/[plantId]",
      params: { plantId: String(plantId) },
    });
  };

  const renderRow = (row: DueTaskRow) => (
    <GroupedTaskCard
      key={`cal-${row.schedule.id}`}
      row={row}
      isOverdue={isOverdue(row.schedule.nextDueAt, now)}
      roomName={
        row.plant.roomId !== null ? roomById.get(row.plant.roomId)?.name : null
      }
      shelfName={
        row.plant.shelfId !== null
          ? shelfById.get(row.plant.shelfId)?.name
          : null
      }
      onPressComplete={handlers.handleQuickComplete}
      onLongPressComplete={handlers.handleAddDetails}
      onPressMenu={handlers.openMenu}
      onPressOpen={() => handleOpenPlant(row.plant.id)}
    />
  );

  return (
    <View className="flex-1 bg-background">
      <Container
        isScrollable
        scrollViewProps={{
          contentContainerStyle: {
            paddingTop: insets.top + 4,
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 96,
          },
        }}
      >
        <View className="gap-4">
          <Text className="font-bold text-2xl text-foreground">Calendar</Text>

          <MonthGrid
            monthAnchor={monthAnchor}
            onChangeMonth={setMonthAnchor}
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setMonthAnchor(date);
            }}
            metaByKey={metaByKey}
          />

          <View className="flex-row gap-2">
            {calendarSegmentValues.map((value) => (
              <Chip
                key={value}
                variant={segment === value ? "primary" : "secondary"}
                color={segment === value ? "accent" : "default"}
                size="md"
                onPress={() => {
                  const result = calendarSegmentSchema.safeParse(value);
                  if (result.success) setSegment(result.data);
                }}
              >
                <Ionicons
                  name={
                    value === "upcoming"
                      ? "calendar-outline"
                      : value === "overdue"
                        ? "alert-circle-outline"
                        : "checkmark-done-outline"
                  }
                  size={14}
                  color={segment === value ? accent : muted}
                />
                <Chip.Label>
                  {value === "upcoming"
                    ? "Selected day"
                    : value === "overdue"
                      ? "Overdue"
                      : "Completed"}
                </Chip.Label>
              </Chip>
            ))}
          </View>

          {segment === "upcoming" ? (
            <View className="gap-3">
              <SectionHeader
                title={
                  isSameDay(selectedDate, now)
                    ? "Today"
                    : format(selectedDate, "EEEE, MMM d")
                }
                count={tasksForSelectedDay.length}
                caption={
                  completedForSelectedDay.length > 0
                    ? `${completedForSelectedDay.length} completed`
                    : undefined
                }
              />
              {tasksForSelectedDay.length === 0 ? (
                <EmptyState
                  icon="leaf-outline"
                  title="Nothing scheduled"
                  description="No tasks for this day."
                />
              ) : (
                <View className="gap-3">
                  {tasksForSelectedDay.map(renderRow)}
                </View>
              )}

              {completedForSelectedDay.length > 0 ? (
                <View className="gap-2 pt-2">
                  <Text className="font-medium text-foreground text-sm">
                    Logged this day
                  </Text>
                  {completedForSelectedDay.map((row) => (
                    <View
                      key={`done-${row.log.id}`}
                      className="flex-row items-center gap-2 rounded-2xl border border-border/30 bg-surface px-3 py-2"
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color={success}
                      />
                      <Text
                        className="flex-1 text-foreground text-sm"
                        numberOfLines={1}
                      >
                        {row.plant.nickname} ·{" "}
                        {row.log.title ?? row.template?.name ?? row.log.type}
                      </Text>
                      <Text className="text-muted text-xs">
                        {format(row.log.completedAt, "p")}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          {segment === "overdue" ? (
            <View className="gap-3">
              <SectionHeader
                title="Overdue"
                count={overdueRows.length}
                caption="Catch up to keep things healthy"
              />
              {overdueRows.length === 0 ? (
                <EmptyState
                  icon="checkmark-done-outline"
                  title="Nothing overdue"
                  description="You're keeping up beautifully."
                />
              ) : (
                <View className="gap-3">{overdueRows.map(renderRow)}</View>
              )}
            </View>
          ) : null}

          {segment === "history" ? (
            <View className="gap-3">
              <SectionHeader
                title="Completed this month"
                count={completedRows.length}
              />
              {completedRows.length === 0 ? (
                <EmptyState
                  icon="time-outline"
                  title="No history yet"
                  description="Care logs will appear here as you complete tasks."
                />
              ) : (
                <View className="gap-2">
                  {completedRows.map((row) => (
                    <PressableFeedback
                      key={`hist-${row.log.id}`}
                      onPress={() => handleOpenPlant(row.plant.id)}
                      className="flex-row items-center gap-3 rounded-2xl border border-border/30 bg-surface p-3"
                    >
                      <View className="size-9 items-center justify-center rounded-xl bg-success-soft">
                        <Ionicons
                          name="checkmark-done-outline"
                          size={16}
                          color={success}
                        />
                      </View>
                      <View className="flex-1 gap-0.5">
                        <Text className="font-medium text-foreground text-sm">
                          {row.plant.nickname}
                        </Text>
                        <Text className="text-muted text-xs">
                          {row.log.title ?? row.template?.name ?? row.log.type}
                          {row.log.amount && row.log.unit
                            ? ` · ${row.log.amount} ${row.log.unit}`
                            : ""}
                        </Text>
                      </View>
                      <Text className="text-muted text-xs">
                        {format(row.log.completedAt, "MMM d")}
                      </Text>
                    </PressableFeedback>
                  ))}
                </View>
              )}
            </View>
          ) : null}
        </View>
      </Container>

      <TaskActionSheets handlers={handlers} />
    </View>
  );
}
