import { Ionicons } from "@expo/vector-icons";
import { addDays } from "date-fns";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Button, PressableFeedback, useThemeColor } from "heroui-native";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { EmptyState } from "@/components/empty-state";
import { GroupedTaskCard } from "@/components/grouped-task-card";
import { SectionHeader } from "@/components/section-header";
import { SetupProgressCard } from "@/components/setup-progress-card";
import { TaskActionSheets } from "@/components/task-action-sheets";
import { useTodayReadModel } from "@/hooks/use-care-read-models";
import { usePlantLimitGate } from "@/hooks/use-plant-limit-gate";
import { useTaskHandlers } from "@/hooks/use-task-handlers";
import { getHealthIssueLabel } from "@/lib/care/health-hints";
import type { PlantSetupAction } from "@/lib/care/setup-progress";
import { formatLongDate, timeOfDayGreeting } from "@/lib/dates";
import { useDatabase } from "@/lib/db";
import type {
  ActiveHealthObservationRow,
  CompletedLogRow,
  DueTaskRow,
} from "@/lib/db/repositories";
import type { Plant } from "@/lib/db/types";

export function TodayScreen() {
  const insets = useSafeAreaInsets();
  const accentForeground = useThemeColor("accent-foreground");
  const db = useDatabase();
  const now = new Date();
  const sevenDaysAgo = addDays(now, -7);

  const {
    activeHealthIssues,
    upcomingTasks,
    overdueTasks,
    todayTasks,
    activePlants,
    favoritePlants,
    plantsWithoutSchedules,
    recentCareLogs,
    recentActivityCount,
    setupProgressItems,
    roomById,
  } = useTodayReadModel(db, { now, recentSince: sevenDaysAgo });

  const handlers = useTaskHandlers();
  const { requestActivePlantSlot } = usePlantLimitGate();

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
    void requestActivePlantSlot({
      onAllow: () => router.push("/plants/new"),
    });
  };

  const handleOpenSettings = () => {
    router.push("/settings");
  };

  const firstSetupProgress = setupProgressItems[0] ?? null;

  const handleOpenSchedules = (plantId: number) => {
    router.push({
      pathname: "/plants/[plantId]/schedules",
      params: { plantId: String(plantId) },
    });
  };

  const handleSetupAction = (plantId: number, action: PlantSetupAction) => {
    if (action === "photo") {
      router.push({
        pathname: "/plants/[plantId]/photos",
        params: { plantId: String(plantId) },
      });
      return;
    }
    if (action === "journal") {
      router.push({
        pathname: "/plants/[plantId]/journal",
        params: { plantId: String(plantId) },
      });
      return;
    }
    if (action === "schedules") {
      handleOpenSchedules(plantId);
      return;
    }
    router.push({
      pathname: "/plants/[plantId]/edit",
      params: { plantId: String(plantId) },
    });
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

          <CareSummaryCard
            plantCount={activePlants.length}
            overdueCount={overdueTasks.length}
            todayCount={todayTasks.length}
            upcomingCount={upcomingTasks.length}
            recentCount={recentActivityCount}
            unscheduledCount={plantsWithoutSchedules.length}
          />

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

          <CareQueueSection
            title="Overdue"
            caption="Catch up first"
            rows={overdueTasks}
            emptyTitle="Nothing overdue"
            emptyDescription="No late care tasks right now."
            isOverdue
            onPressComplete={handleComplete}
            onPressMenu={handleSnooze}
            onPressOpenPlant={handleOpenPlant}
          />

          <CareQueueSection
            title="Due today"
            caption="One-handed quick actions"
            rows={todayTasks}
            emptyTitle="Nice, your plants are cared for today"
            emptyDescription={
              plantsWithoutSchedules.length > 0
                ? "Some plants still need schedules before they can appear here."
                : "All caught up. The next task will appear when it is due."
            }
            onPressComplete={handleComplete}
            onPressMenu={handleSnooze}
            onPressOpenPlant={handleOpenPlant}
            actionLabel="All tasks"
            onPressAction={() => router.push("/tasks")}
          />

          {plantsWithoutSchedules.length > 0 ? (
            <UnscheduledPlantsCard
              plants={plantsWithoutSchedules}
              onPressPlant={handleOpenSchedules}
            />
          ) : null}

          {upcomingTasks.length > 0 ? (
            <CareQueueSection
              title="Upcoming"
              caption="Next 7 days"
              rows={upcomingTasks.slice(0, 5)}
              emptyTitle="No upcoming care"
              emptyDescription="Add care schedules to see future tasks."
              onPressComplete={handleComplete}
              onPressMenu={handleSnooze}
              onPressOpenPlant={handleOpenPlant}
              isCompact
            />
          ) : null}

          {recentCareLogs.length > 0 ? (
            <RecentCareSection rows={recentCareLogs} />
          ) : null}

          {firstSetupProgress ? (
            <SetupProgressCard
              plantName={firstSetupProgress.plant.nickname}
              progress={firstSetupProgress.progress}
              compact
              onPressAction={(action) => {
                handleSetupAction(firstSetupProgress.plant.id, action);
              }}
            />
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

function CareSummaryCard({
  plantCount,
  overdueCount,
  todayCount,
  upcomingCount,
  recentCount,
  unscheduledCount,
}: {
  plantCount: number;
  overdueCount: number;
  todayCount: number;
  upcomingCount: number;
  recentCount: number;
  unscheduledCount: number;
}) {
  const accent = useThemeColor("accent");
  const danger = useThemeColor("danger");
  const success = useThemeColor("success");
  const isCaughtUp = overdueCount === 0 && todayCount === 0;

  return (
    <View className="gap-4 rounded-3xl border border-border/40 bg-surface p-4">
      <View className="flex-row items-start gap-3">
        <View
          className={
            isCaughtUp
              ? "size-11 items-center justify-center rounded-2xl bg-success-soft"
              : "size-11 items-center justify-center rounded-2xl bg-accent-soft"
          }
        >
          <Ionicons
            name={
              isCaughtUp ? "checkmark-done-circle-outline" : "calendar-outline"
            }
            size={22}
            color={isCaughtUp ? success : accent}
          />
        </View>
        <View className="flex-1 gap-1">
          <Text className="font-semibold text-foreground text-lg">
            {isCaughtUp ? "All caught up" : "Care queue"}
          </Text>
          <Text className="text-muted text-xs leading-4">
            Works offline. Your plant data stays on this device.
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2">
        <SummaryMetric label="Plants" value={plantCount} color={accent} />
        <SummaryMetric
          label="Overdue"
          value={overdueCount}
          color={overdueCount > 0 ? danger : success}
        />
        <SummaryMetric label="Today" value={todayCount} color={accent} />
        <SummaryMetric label="Upcoming" value={upcomingCount} color={accent} />
        <SummaryMetric label="Recent" value={recentCount} color={success} />
        {unscheduledCount > 0 ? (
          <SummaryMetric
            label="Need schedules"
            value={unscheduledCount}
            color={danger}
          />
        ) : null}
      </View>
    </View>
  );
}

function SummaryMetric({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View className="min-w-24 flex-1 rounded-2xl bg-background/70 px-3 py-2">
      <Text className="font-semibold text-foreground text-lg" style={{ color }}>
        {value}
      </Text>
      <Text className="text-muted text-xs" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function CareQueueSection({
  title,
  caption,
  rows,
  emptyTitle,
  emptyDescription,
  isOverdue,
  isCompact,
  onPressComplete,
  onPressMenu,
  onPressOpenPlant,
  actionLabel,
  onPressAction,
}: {
  title: string;
  caption?: string;
  rows: ReadonlyArray<DueTaskRow>;
  emptyTitle: string;
  emptyDescription: string;
  isOverdue?: boolean;
  isCompact?: boolean;
  onPressComplete: (row: DueTaskRow) => void;
  onPressMenu: (row: DueTaskRow) => void;
  onPressOpenPlant: (plantId: number) => void;
  actionLabel?: string;
  onPressAction?: () => void;
}) {
  const accent = useThemeColor("accent");

  return (
    <View className="gap-3">
      <SectionHeader
        title={title}
        count={rows.length}
        caption={caption}
        actionLabel={actionLabel}
        onPressAction={onPressAction}
      />
      {rows.length === 0 ? (
        <View className="items-center gap-2 rounded-3xl border border-border/40 bg-surface p-5">
          <Ionicons name="checkmark-circle-outline" size={24} color={accent} />
          <Text className="text-center font-medium text-foreground">
            {emptyTitle}
          </Text>
          <Text className="text-center text-muted text-sm leading-5">
            {emptyDescription}
          </Text>
        </View>
      ) : (
        <View className={isCompact ? "gap-2" : "gap-3"}>
          {rows.map((row) => (
            <GroupedTaskCard
              key={`${title}-${row.schedule.id}`}
              row={row}
              isOverdue={isOverdue}
              onPressComplete={onPressComplete}
              onPressMenu={onPressMenu}
              onPressOpen={() => onPressOpenPlant(row.plant.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function UnscheduledPlantsCard({
  plants,
  onPressPlant,
}: {
  plants: ReadonlyArray<Plant>;
  onPressPlant: (plantId: number) => void;
}) {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");
  const top = plants.slice(0, 3);

  return (
    <View className="gap-3 rounded-3xl border border-border/40 bg-surface p-4">
      <View className="flex-row items-start gap-3">
        <View className="size-10 items-center justify-center rounded-2xl bg-accent-soft">
          <Ionicons name="time-outline" size={18} color={accent} />
        </View>
        <View className="flex-1 gap-1">
          <Text className="font-semibold text-base text-foreground">
            Add care schedules
          </Text>
          <Text className="text-muted text-xs leading-4">
            {plants.length} plant{plants.length === 1 ? "" : "s"} will show in
            Today after at least one schedule is enabled.
          </Text>
        </View>
      </View>
      <View className="gap-2">
        {top.map((plant) => (
          <PressableFeedback
            key={`unscheduled-${plant.id}`}
            onPress={() => onPressPlant(plant.id)}
            className="flex-row items-center gap-3 rounded-2xl bg-background/70 px-3 py-2.5"
          >
            <Text className="flex-1 font-medium text-foreground text-sm">
              {plant.nickname}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={muted} />
          </PressableFeedback>
        ))}
      </View>
    </View>
  );
}

function RecentCareSection({ rows }: { rows: ReadonlyArray<CompletedLogRow> }) {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");

  return (
    <View className="gap-3">
      <SectionHeader title="Recently cared for" count={rows.length} />
      <View className="gap-2">
        {rows.map((row) => (
          <View
            key={`recent-care-${row.log.id}`}
            className="flex-row items-center gap-3 rounded-2xl border border-border/30 bg-surface p-3"
          >
            <View className="size-9 items-center justify-center rounded-xl bg-accent-soft">
              <Ionicons name="checkmark-outline" size={16} color={accent} />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="font-medium text-foreground text-sm">
                {row.plant.nickname}
              </Text>
              <Text className="text-muted text-xs" numberOfLines={1}>
                {row.log.title ?? row.template?.name ?? row.log.type}
              </Text>
            </View>
            <Text className="text-muted text-xs" style={{ color: muted }}>
              {row.log.completedAt.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
        ))}
      </View>
    </View>
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
