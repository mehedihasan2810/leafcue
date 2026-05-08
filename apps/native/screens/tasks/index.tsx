import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { EmptyState } from "@/components/empty-state";
import { TaskActionSheets } from "@/components/task-action-sheets";
import { useTaskQueueReadModel } from "@/hooks/use-care-read-models";
import { useTaskHandlers } from "@/hooks/use-task-handlers";
import { useDatabase } from "@/lib/db";
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

  const now = new Date();
  const { data, counts, roomById, shelfById } = useTaskQueueReadModel(
    db,
    filter,
  );

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
          <View className="flex-row items-center justify-between">
            <Text className="font-display text-2xl text-foreground">Tasks</Text>
            <PressableFeedback
              onPress={handleOpenReminders}
              className="size-10 items-center justify-center rounded-full bg-surface"
              accessibilityLabel="Reminder settings"
            >
              <Ionicons name="notifications-outline" size={18} color={accent} />
            </PressableFeedback>
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
      </Container>

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
