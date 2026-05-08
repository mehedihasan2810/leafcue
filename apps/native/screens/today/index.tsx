import { Ionicons } from "@expo/vector-icons";
import { addDays, isAfter } from "date-fns";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Button, PressableFeedback, useThemeColor } from "heroui-native";
import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CareTaskCard } from "@/components/care-task-card";
import { Container } from "@/components/container";
import { EmptyState } from "@/components/empty-state";
import { SectionHeader } from "@/components/section-header";
import { StatPill } from "@/components/stat-pill";
import { TaskActionSheets } from "@/components/task-action-sheets";
import { useTaskHandlers } from "@/hooks/use-task-handlers";
import { getHealthIssueLabel } from "@/lib/care/health-hints";
import { formatLongDate, isOverdue, timeOfDayGreeting } from "@/lib/dates";
import { useDatabase } from "@/lib/db";
import {
  type ActiveHealthObservationRow,
  type DueTaskRow,
  getActiveHealthObservationsAcrossPlants,
  getDueTasks,
  getRooms,
  getUpcomingTasks,
} from "@/lib/db/repositories";
import {
  healthObservations,
  journalEntries,
  plantPhotos,
  plants,
  plantTaskSchedules,
} from "@/lib/db/schema";
import type { Plant, Room } from "@/lib/db/types";

export function TodayScreen() {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");
  const accentForeground = useThemeColor("accent-foreground");
  const db = useDatabase();
  const now = new Date();
  const sevenDaysAgo = addDays(now, -7);

  const livePlants = useLiveQuery(db.select().from(plants));
  const liveSchedules = useLiveQuery(db.select().from(plantTaskSchedules));
  const liveJournal = useLiveQuery(db.select().from(journalEntries));
  const livePhotos = useLiveQuery(db.select().from(plantPhotos));
  const liveHealth = useLiveQuery(db.select().from(healthObservations));

  const activeHealthIssues = useMemo(() => {
    void liveHealth.data;
    void livePlants.data;
    return getActiveHealthObservationsAcrossPlants(db);
  }, [db, liveHealth.data, livePlants.data]);

  const allDueTasks = useMemo(() => {
    void liveSchedules.data;
    void livePlants.data;
    return getDueTasks(db);
  }, [db, liveSchedules.data, livePlants.data]);
  const upcomingTasks = useMemo(() => {
    void liveSchedules.data;
    void livePlants.data;
    return getUpcomingTasks(db, 7);
  }, [db, liveSchedules.data, livePlants.data]);

  const overdueTasks = allDueTasks.filter((row) =>
    isOverdue(row.schedule.nextDueAt, now),
  );
  const todayTasks = allDueTasks.filter(
    (row) => !isOverdue(row.schedule.nextDueAt, now),
  );

  const activePlants = livePlants.data.filter((plant) => !plant.archivedAt);
  const favoritePlants = activePlants.filter((plant) => plant.isFavorite);

  const recentActivityCount =
    liveJournal.data.filter((entry) => isAfter(entry.createdAt, sevenDaysAgo))
      .length +
    livePhotos.data.filter((photo) => isAfter(photo.takenAt, sevenDaysAgo))
      .length;

  const rooms = useMemo(() => {
    void livePlants.data;
    return getRooms(db);
  }, [db, livePlants.data]);
  const roomById = useMemo(() => {
    const map = new Map<number, Room>();
    for (const room of rooms) map.set(room.id, room);
    return map;
  }, [rooms]);

  const handlers = useTaskHandlers();

  const handleComplete = (row: DueTaskRow) => {
    handlers.handleQuickComplete(row);
  };

  const handleSnooze = (row: DueTaskRow) => {
    handlers.openMenu(row);
  };

  const handleOpenPlant = (plantId: number) => {
    router.push({
      pathname: "/plants/[plantId]",
      params: { plantId: String(plantId) },
    });
  };

  const handleAddPlant = () => {
    router.push("/plants/new");
  };

  const handleOpenSettings = () => {
    router.push("/settings");
  };

  if (activePlants.length === 0) {
    return (
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
          <Header
            greeting={timeOfDayGreeting(now)}
            date={formatLongDate(now)}
            onPressSettings={handleOpenSettings}
          />
          <EmptyState
            icon="leaf-outline"
            title="No plants yet"
            description="Add your first plant to start tracking watering, fertilizing, and growth."
            ctaLabel="Add your first plant"
            onPressCta={handleAddPlant}
          />
        </View>
      </Container>
    );
  }

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
        <View className="gap-6">
          <Header
            greeting={timeOfDayGreeting(now)}
            date={formatLongDate(now)}
            onPressSettings={handleOpenSettings}
          />

          <View className="gap-2">
            <View className="flex-row gap-2">
              <StatPill
                icon="leaf-outline"
                label="Plants"
                value={activePlants.length}
              />
              <StatPill
                icon="sunny-outline"
                label="Today"
                value={todayTasks.length}
                tone="accent"
              />
            </View>
            <View className="flex-row gap-2">
              <StatPill
                icon="alert-circle-outline"
                label="Overdue"
                value={overdueTasks.length}
                tone={overdueTasks.length > 0 ? "danger" : "neutral"}
              />
              <StatPill
                icon="time-outline"
                label="Recent"
                value={recentActivityCount}
                tone="success"
              />
            </View>
          </View>

          {activeHealthIssues.length > 0 ? (
            <HealthBanner
              rows={activeHealthIssues}
              onPressRow={(plantId) => {
                router.push({
                  pathname: "/plants/[plantId]/health",
                  params: { plantId: String(plantId) },
                });
              }}
            />
          ) : null}

          {overdueTasks.length > 0 ? (
            <View className="gap-3">
              <SectionHeader
                title="Overdue"
                count={overdueTasks.length}
                caption="Catch up to keep things healthy"
              />
              <View className="gap-3">
                {overdueTasks.map((row) => (
                  <CareTaskCard
                    key={`overdue-${row.schedule.id}`}
                    row={row}
                    isOverdue
                    onPressComplete={handleComplete}
                    onPressSnooze={handleSnooze}
                    onPressOpen={() => handleOpenPlant(row.plant.id)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View className="gap-3">
            <SectionHeader
              title="Today"
              count={todayTasks.length}
              caption={
                todayTasks.length > 0
                  ? "Quick wins waiting for you"
                  : "Nothing left for today"
              }
            />
            {todayTasks.length === 0 ? (
              <View className="items-center gap-2 rounded-3xl border border-border/40 bg-success-soft/40 p-6">
                <Ionicons
                  name="checkmark-done-circle-outline"
                  size={28}
                  color={accent}
                />
                <Text className="font-medium text-foreground">
                  All caught up
                </Text>
                <Text className="text-center text-muted text-sm leading-5">
                  Enjoy a calm moment — your plants are happy.
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {todayTasks.map((row) => (
                  <CareTaskCard
                    key={`today-${row.schedule.id}`}
                    row={row}
                    onPressComplete={handleComplete}
                    onPressSnooze={handleSnooze}
                    onPressOpen={() => handleOpenPlant(row.plant.id)}
                  />
                ))}
              </View>
            )}
          </View>

          {upcomingTasks.length > 0 ? (
            <View className="gap-3">
              <SectionHeader
                title="Coming up next 7 days"
                count={upcomingTasks.length}
              />
              <View className="gap-2">
                {upcomingTasks.slice(0, 5).map((row) => (
                  <UpcomingRow
                    key={`upcoming-${row.schedule.id}`}
                    row={row}
                    onPress={() => handleOpenPlant(row.plant.id)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {favoritePlants.length > 0 ? (
            <View className="gap-3">
              <SectionHeader
                title="Favorites"
                count={favoritePlants.length}
                actionLabel="See all"
                onPressAction={() => router.push("/plants")}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 8 }}
              >
                {favoritePlants.map((plant) => (
                  <FavoritePlantCard
                    key={`fav-${plant.id}`}
                    plant={plant}
                    roomName={
                      plant.roomId ? roomById.get(plant.roomId)?.name : null
                    }
                    onPress={() => handleOpenPlant(plant.id)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </Container>

      <View
        style={{ position: "absolute", bottom: insets.bottom + 12, right: 16 }}
        pointerEvents="box-none"
      >
        <Button onPress={handleAddPlant} feedbackVariant="scale-highlight">
          <Ionicons name="add" size={18} color={accentForeground} />
          <Button.Label>Add plant</Button.Label>
        </Button>
      </View>

      <TaskActionSheets handlers={handlers} />
    </View>
  );
}

function Header({
  greeting,
  date,
  onPressSettings,
}: {
  greeting: string;
  date: string;
  onPressSettings: () => void;
}) {
  const muted = useThemeColor("muted");
  return (
    <View className="flex-row items-end justify-between">
      <View>
        <Text className="text-muted text-sm">{date}</Text>
        <Text className="font-display text-2xl text-foreground">
          {greeting}
        </Text>
      </View>
      <PressableFeedback
        onPress={onPressSettings}
        className="size-10 items-center justify-center rounded-full bg-surface"
        accessibilityLabel="Reminder settings"
      >
        <Ionicons name="settings-outline" size={18} color={muted} />
      </PressableFeedback>
    </View>
  );
}

function UpcomingRow({
  row,
  onPress,
}: {
  row: DueTaskRow;
  onPress: () => void;
}) {
  const { schedule, plant, template } = row;
  const accent = useThemeColor("accent");
  const dueDate = schedule.nextDueAt;
  const dueLabel = dueDate
    ? dueDate.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <PressableFeedback
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-border/30 bg-surface p-3"
    >
      <View className="size-9 overflow-hidden rounded-lg bg-accent-soft">
        {plant.photoUri ? (
          <Image
            source={{ uri: plant.photoUri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="calendar-outline" size={16} color={accent} />
          </View>
        )}
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-medium text-foreground" numberOfLines={1}>
          {plant.nickname}
        </Text>
        <Text className="text-muted text-xs" numberOfLines={1}>
          {schedule.customName ?? template?.name ?? "Care cue"}
        </Text>
      </View>
      <Text className="text-muted text-xs">{dueLabel}</Text>
    </PressableFeedback>
  );
}

function HealthBanner({
  rows,
  onPressRow,
}: {
  rows: ActiveHealthObservationRow[];
  onPressRow: (plantId: number) => void;
}) {
  const danger = useThemeColor("danger");
  const top = rows.slice(0, 3);
  const remaining = rows.length - top.length;

  return (
    <View className="gap-2 rounded-3xl border border-warning/40 bg-warning-soft/40 p-4">
      <View className="flex-row items-center gap-2">
        <Ionicons name="alert-circle-outline" size={18} color={danger} />
        <Text className="font-semibold text-foreground">
          {rows.length === 1
            ? "1 plant needs a closer look"
            : `${rows.length} plants need a closer look`}
        </Text>
      </View>
      <View className="gap-1.5">
        {top.map((row) => (
          <PressableFeedback
            key={`health-${row.observation.id}`}
            onPress={() => onPressRow(row.plant.id)}
            className="flex-row items-center justify-between rounded-xl bg-surface/80 px-3 py-2"
          >
            <View className="flex-1 pr-2">
              <Text className="font-medium text-foreground" numberOfLines={1}>
                {row.plant.nickname}
              </Text>
              <Text className="text-muted text-xs" numberOfLines={1}>
                {getHealthIssueLabel(row.observation.issueType)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={danger} />
          </PressableFeedback>
        ))}
        {remaining > 0 ? (
          <Text className="px-1 text-muted text-xs">
            +{remaining} more open
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function FavoritePlantCard({
  plant,
  roomName,
  onPress,
}: {
  plant: Plant;
  roomName?: string | null;
  onPress: () => void;
}) {
  const accent = useThemeColor("accent");

  return (
    <PressableFeedback
      onPress={onPress}
      className="w-40 overflow-hidden rounded-2xl border border-border/30 bg-surface"
    >
      <View className="aspect-square w-full bg-muted/15">
        {plant.photoUri ? (
          <Image
            source={{ uri: plant.photoUri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="leaf-outline" size={36} color={accent} />
          </View>
        )}
      </View>
      <View className="gap-0.5 px-3 py-2">
        <Text className="font-semibold text-foreground" numberOfLines={1}>
          {plant.nickname}
        </Text>
        {roomName ? (
          <Text className="text-muted text-xs" numberOfLines={1}>
            {roomName}
          </Text>
        ) : null}
      </View>
    </PressableFeedback>
  );
}
