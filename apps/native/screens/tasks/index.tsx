import { Ionicons } from "@expo/vector-icons";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router, useLocalSearchParams } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useEffect, useMemo } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/empty-state";
import { TaskActionSheets } from "@/components/task-action-sheets";
import { useTaskHandlers } from "@/hooks/use-task-handlers";
import { useDatabase } from "@/lib/db";
import {
  type CompletedLogRow,
  type DueTaskRow,
  getRooms,
  getShelves,
  getTasksByFilter,
} from "@/lib/db/repositories";
import {
  careLogs,
  plants,
  plantTaskSchedules,
  rooms,
  shelves,
} from "@/lib/db/schema";
import type { Room, Shelf } from "@/lib/db/types";
import {
  type TaskFilter,
  taskFilterSchema,
  tasksRouteParamsSchema,
} from "@/lib/db/zod";
import { TaskFilterTabs } from "@/screens/tasks/_components/task-filter-tabs";
import { TaskSectionList } from "@/screens/tasks/_components/task-section-list";
import { useTaskFiltersStore } from "@/stores/use-task-filters";

export function TasksScreen() {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");
  const db = useDatabase();
  const params = useLocalSearchParams();

  const initialFilter = useMemo(() => {
    const parsed = tasksRouteParamsSchema.safeParse(params);
    return parsed.success ? parsed.data.filter : undefined;
  }, [params]);

  const filter = useTaskFiltersStore((state) => state.filter);
  const setFilter = useTaskFiltersStore((state) => state.setFilter);

  useEffect(() => {
    if (initialFilter && initialFilter !== filter) {
      setFilter(initialFilter);
    }
  }, [initialFilter, filter, setFilter]);

  const livePlants = useLiveQuery(db.select().from(plants));
  const liveSchedules = useLiveQuery(db.select().from(plantTaskSchedules));
  const liveLogs = useLiveQuery(db.select().from(careLogs));
  const liveRooms = useLiveQuery(db.select().from(rooms));
  const liveShelves = useLiveQuery(db.select().from(shelves));

  const now = new Date();

  const data = useMemo<{
    schedules: DueTaskRow[];
    completed: CompletedLogRow[];
  }>(
    () => getTasksByFilter(db, filter, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      db,
      filter,
      liveSchedules.data.length,
      livePlants.data.length,
      liveLogs.data.length,
    ],
  );

  const counts = useMemo(() => {
    const today = getTasksByFilter(db, "today", now);
    const overdue = getTasksByFilter(db, "overdue", now);
    const upcoming = getTasksByFilter(db, "upcoming", now);
    return {
      today: today.schedules.length,
      overdue: overdue.schedules.length,
      upcoming: upcoming.schedules.length,
    } satisfies Partial<Record<TaskFilter, number>>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, liveSchedules.data.length, livePlants.data.length]);

  const roomList = useMemo<Room[]>(
    () => getRooms(db),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, liveRooms.data.length],
  );
  const shelfList = useMemo<Shelf[]>(
    () => getShelves(db),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, liveShelves.data.length],
  );

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

  const handlers = useTaskHandlers();

  const handleOpenPlant = (plantId: number) => {
    router.push({
      pathname: "/plants/[plantId]",
      params: { plantId: String(plantId) },
    });
  };

  const handleOpenSchedules = (plantId: number) => {
    router.push({
      pathname: "/plants/[plantId]/schedules",
      params: { plantId: String(plantId) },
    });
  };

  const handleOpenReminders = () => {
    router.push("/settings");
  };

  const isEmpty =
    filter === "completed"
      ? data.completed.length === 0
      : data.schedules.length === 0;

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={[]}
        keyExtractor={(_, index) => `tasks-${index}`}
        renderItem={null}
        contentContainerStyle={{
          paddingTop: 8,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 96,
        }}
        ListHeaderComponent={
          <View className="gap-5">
            <View className="flex-row items-center justify-between">
              <View className="gap-1">
                <Text className="text-muted text-sm">Care queue</Text>
                <Text className="font-bold text-3xl text-foreground">
                  Tasks
                </Text>
              </View>
              <Pressable
                onPress={handleOpenReminders}
                hitSlop={8}
                className="size-10 items-center justify-center rounded-full bg-surface"
                accessibilityLabel="Reminder settings"
              >
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color={accent}
                />
              </Pressable>
            </View>

            <TaskFilterTabs
              value={filter}
              onChange={(next) => {
                const result = taskFilterSchema.safeParse(next);
                if (result.success) setFilter(result.data);
              }}
              counts={counts}
            />

            {isEmpty ? (
              <EmptyState
                icon={
                  filter === "overdue"
                    ? "checkmark-done-outline"
                    : filter === "completed"
                      ? "calendar-outline"
                      : "leaf-outline"
                }
                title={emptyTitle(filter)}
                description={emptyDescription(filter)}
              />
            ) : (
              <TaskSectionList
                schedules={data.schedules}
                completed={data.completed}
                filter={filter}
                now={now}
                roomById={roomById}
                shelfById={shelfById}
                onPressComplete={handlers.handleQuickComplete}
                onLongPressComplete={handlers.handleAddDetails}
                onPressMenu={handlers.openMenu}
                onPressOpenPlant={handleOpenPlant}
                onPressCompletedPlant={handleOpenSchedules}
              />
            )}
          </View>
        }
      />

      <TaskActionSheets handlers={handlers} />
    </View>
  );
}

function emptyTitle(filter: TaskFilter): string {
  switch (filter) {
    case "today":
      return "Care round complete";
    case "overdue":
      return "Nothing overdue";
    case "upcoming":
      return "No upcoming tasks";
    case "completed":
      return "No completions yet";
    case "all":
      return "No active schedules";
  }
}

function emptyDescription(filter: TaskFilter): string {
  switch (filter) {
    case "today":
      return "All caught up. Take a moment to enjoy your plants.";
    case "overdue":
      return "You're keeping up with everything. Nice work.";
    case "upcoming":
      return "Add schedules to a plant to see them here.";
    case "completed":
      return "Care logs will appear here as you complete tasks.";
    case "all":
      return "Open a plant and add a care schedule to get started.";
  }
}
