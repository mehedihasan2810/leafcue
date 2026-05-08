import { Ionicons } from "@expo/vector-icons";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router } from "expo-router";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { useToast } from "heroui-native/toast";
import { useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { PhotoViewerDialog } from "@/components/photo-viewer-dialog";
import { TaskActionSheets } from "@/components/task-action-sheets";
import { useTaskHandlers } from "@/hooks/use-task-handlers";
import { performComplete } from "@/lib/care/task-actions";
import { relativeDueLabel } from "@/lib/dates";
import { useDatabase } from "@/lib/db";
import {
  getCareTaskTemplates,
  getDueTasks,
  getGrowthMeasurements,
  getHealthObservations,
  getPlantById,
  getPlantPhotos,
  getPlantTimeline,
  getPresetById,
  getRoomById,
  getSchedulesForPlant,
  type PlantTimelineKind,
  updatePlant,
} from "@/lib/db/repositories";
import {
  careLogs,
  careTaskTemplates,
  growthMeasurements,
  healthObservations,
  journalEntries,
  plantPhotos,
  plants as plantsTable,
  plantTaskSchedules,
  rooms as roomsTable,
  shelves as shelvesTable,
} from "@/lib/db/schema";
import type {
  CareTaskTemplate,
  PlantPhoto,
  PlantTaskSchedule,
  Room,
  Shelf,
} from "@/lib/db/types";

import { CareProfileSection } from "@/screens/plants/detail/_components/care-profile-section";
import { GrowthSnippet } from "@/screens/plants/detail/_components/growth-snippet";
import { HealthBanner } from "@/screens/plants/detail/_components/health-banner";
import { HeroCard } from "@/screens/plants/detail/_components/hero-card";
import { NotesSection } from "@/screens/plants/detail/_components/notes-section";
import { PhotosStrip } from "@/screens/plants/detail/_components/photos-strip";
import {
  type QuickAction,
  type QuickActionId,
  QuickActions,
} from "@/screens/plants/detail/_components/quick-actions";
import type { TimelineFilter } from "@/screens/plants/detail/_components/timeline-filter";
import { TimelineSection } from "@/screens/plants/detail/_components/timeline-section";
import { TodayTasksSection } from "@/screens/plants/detail/_components/today-tasks-section";

const TIMELINE_KIND_FROM_FILTER: Record<
  Exclude<TimelineFilter, "all">,
  PlantTimelineKind
> = {
  care_log: "care_log",
  journal_entry: "journal_entry",
  photo: "photo",
  growth_measurement: "growth_measurement",
  health_observation: "health_observation",
};

type PlantDetailScreenProps = {
  plantId: number;
};

export function PlantDetailScreen({ plantId }: PlantDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");
  const db = useDatabase();
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const [viewerPhoto, setViewerPhoto] = useState<PlantPhoto | null>(null);

  const livePlants = useLiveQuery(db.select().from(plantsTable));
  const liveSchedules = useLiveQuery(db.select().from(plantTaskSchedules));
  const liveLogs = useLiveQuery(db.select().from(careLogs));
  const liveJournal = useLiveQuery(db.select().from(journalEntries));
  const livePhotos = useLiveQuery(db.select().from(plantPhotos));
  const liveGrowth = useLiveQuery(db.select().from(growthMeasurements));
  const liveHealth = useLiveQuery(db.select().from(healthObservations));
  const liveRooms = useLiveQuery(db.select().from(roomsTable));
  const liveShelves = useLiveQuery(db.select().from(shelvesTable));
  const liveTemplates = useLiveQuery(db.select().from(careTaskTemplates));

  const plant = useMemo(() => {
    void livePlants.data;
    return getPlantById(db, plantId);
  }, [db, plantId, livePlants.data]);

  const room = useMemo<Room | null>(() => {
    void liveRooms.data;
    if (!plant?.roomId) return null;
    return getRoomById(db, plant.roomId) ?? null;
  }, [db, plant?.roomId, liveRooms.data]);

  const shelfRow = useMemo<Shelf | null>(() => {
    if (!plant?.shelfId) return null;
    return liveShelves.data.find((s) => s.id === plant.shelfId) ?? null;
  }, [plant?.shelfId, liveShelves.data]);

  const schedules = useMemo(() => {
    void liveSchedules.data;
    return getSchedulesForPlant(db, plantId);
  }, [db, plantId, liveSchedules.data]);

  const dueRows = useMemo(() => {
    void liveSchedules.data;
    void liveLogs.data;
    return getDueTasks(db).filter((row) => row.plant.id === plantId);
  }, [db, plantId, liveSchedules.data, liveLogs.data]);

  const photos = useMemo(() => {
    void livePhotos.data;
    return getPlantPhotos(db, plantId);
  }, [db, plantId, livePhotos.data]);

  const measurements = useMemo(() => {
    void liveGrowth.data;
    return getGrowthMeasurements(db, plantId);
  }, [db, plantId, liveGrowth.data]);

  const observations = useMemo(() => {
    void liveHealth.data;
    return getHealthObservations(db, plantId);
  }, [db, plantId, liveHealth.data]);

  const templates = useMemo<CareTaskTemplate[]>(() => {
    void liveTemplates.data;
    return getCareTaskTemplates(db);
  }, [db, liveTemplates.data]);

  const preset = useMemo(() => {
    if (!plant?.speciesPresetId) return null;
    return getPresetById(db, plant.speciesPresetId) ?? null;
  }, [db, plant?.speciesPresetId]);

  const timelineKinds = useMemo<PlantTimelineKind[] | undefined>(() => {
    if (filter === "all") return undefined;
    return [TIMELINE_KIND_FROM_FILTER[filter]];
  }, [filter]);

  const timeline = useMemo(() => {
    void liveLogs.data;
    void liveJournal.data;
    void livePhotos.data;
    void liveGrowth.data;
    void liveHealth.data;
    return getPlantTimeline(db, plantId, { kinds: timelineKinds, limit: 200 });
  }, [
    db,
    plantId,
    timelineKinds,
    liveLogs.data,
    liveJournal.data,
    livePhotos.data,
    liveGrowth.data,
    liveHealth.data,
  ]);

  const handlers = useTaskHandlers();
  const { toast } = useToast();

  const nextDueAt = useMemo<Date | null>(() => {
    let next: Date | null = null;
    for (const schedule of schedules) {
      if (!schedule.isEnabled || !schedule.nextDueAt) continue;
      if (!next || schedule.nextDueAt < next) next = schedule.nextDueAt;
    }
    return next;
  }, [schedules]);

  if (!plant) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background px-6"
        style={{ paddingTop: insets.top }}
      >
        <Text className="font-semibold text-base text-foreground">
          Plant not found
        </Text>
        <PressableFeedback className="mt-4" onPress={() => router.back()}>
          <Text className="font-medium text-accent">Close</Text>
        </PressableFeedback>
      </View>
    );
  }

  const findScheduleForKey = (
    key: "water" | "fertilize",
  ): {
    schedule: PlantTaskSchedule;
    template: CareTaskTemplate | null;
  } | null => {
    const template = templates.find((t) => t.key === key) ?? null;
    if (!template) return null;
    const schedule = schedules.find(
      (s) => s.templateId === template.id && s.isEnabled,
    );
    return schedule ? { schedule, template } : null;
  };

  const handleCompleteByKey = async (key: "water" | "fertilize") => {
    const found = findScheduleForKey(key);
    if (!found) {
      toast.show({
        label: `No ${key} schedule yet`,
        description: "Add a schedule to log this care.",
        variant: "warning",
        actionLabel: "Add schedule",
        onActionPress: ({ hide }) => {
          hide();
          router.push({
            pathname: "/plants/[plantId]/schedules",
            params: { plantId: String(plantId) },
          });
        },
      });
      return;
    }
    await performComplete(
      db,
      { scheduleId: found.schedule.id },
      found.schedule,
    );
    const actionLabel = key === "water" ? "Watered" : "Fertilized";
    toast.show({
      label: `${actionLabel} ${plant?.nickname ?? ""}`,
      description:
        key === "water" ? "💧 Logged as watered" : "🧪 Logged as fertilized",
      variant: "success",
    });
  };

  const handleQuickAction = (id: QuickActionId) => {
    switch (id) {
      case "water":
        void handleCompleteByKey("water");
        return;
      case "fertilize":
        void handleCompleteByKey("fertilize");
        return;
      case "photo":
        router.push({
          pathname: "/plants/[plantId]/photos",
          params: { plantId: String(plantId) },
        });
        return;
      case "journal":
        router.push({
          pathname: "/plants/[plantId]/journal",
          params: { plantId: String(plantId) },
        });
        return;
      case "health":
        router.push({
          pathname: "/plants/[plantId]/health",
          params: { plantId: String(plantId) },
        });
        return;
      case "growth":
        router.push({
          pathname: "/plants/[plantId]/growth",
          params: { plantId: String(plantId) },
        });
        return;
      case "edit":
        router.push({
          pathname: "/plants/[plantId]/edit",
          params: { plantId: String(plantId) },
        });
        return;
    }
  };

  const handleToggleFavorite = () => {
    try {
      updatePlant(db, plantId, { isFavorite: !plant.isFavorite });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not update favorite";
      Alert.alert("Couldn't update", message);
    }
  };

  const heroStatus: "healthy" | "needs_attention" | "in_recovery" =
    observations.some((obs) => obs.status === "active")
      ? "needs_attention"
      : observations.some((obs) => obs.status === "improving")
        ? "in_recovery"
        : "healthy";

  const quickActions: QuickAction[] = [
    {
      id: "water",
      label: "Water",
      icon: "water-outline",
      disabled: !findScheduleForKey("water"),
    },
    {
      id: "fertilize",
      label: "Fertilize",
      icon: "flask-outline",
      disabled: !findScheduleForKey("fertilize"),
    },
    { id: "photo", label: "Add photo", icon: "camera-outline" },
    { id: "journal", label: "Note", icon: "create-outline" },
    { id: "health", label: "Health", icon: "medkit-outline" },
    { id: "growth", label: "Measure", icon: "resize-outline" },
    { id: "edit", label: "Edit", icon: "create-outline" },
  ];

  return (
    <View className="flex-1 bg-background">
      <View
        className="flex-row items-center justify-between px-6"
        style={{ paddingTop: insets.top + 4, paddingBottom: 12 }}
      >
        <PressableFeedback
          onPress={() => router.back()}
          className="size-9 items-center justify-center rounded-full bg-surface"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={20} color={muted} />
        </PressableFeedback>
        <Text
          className="flex-1 px-3 text-center font-semibold text-base text-foreground"
          numberOfLines={1}
        >
          {plant.nickname}
        </Text>
        <PressableFeedback
          onPress={() =>
            router.push({
              pathname: "/plants/[plantId]/edit",
              params: { plantId: String(plantId) },
            })
          }
          className="size-9 items-center justify-center rounded-full bg-surface"
          accessibilityLabel="Edit plant"
        >
          <Ionicons name="create-outline" size={18} color={accent} />
        </PressableFeedback>
      </View>

      <Container
        isScrollable
        scrollViewProps={{
          contentContainerStyle: {
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 96,
            gap: 24,
          },
        }}
      >
        <View className="gap-6">
          <HeroCard
            plant={plant}
            room={room}
            shelf={shelfRow}
            nextDueAt={nextDueAt}
            nextDueLabel={
              nextDueAt ? `Next: ${relativeDueLabel(nextDueAt)}` : null
            }
            status={heroStatus}
            onToggleFavorite={handleToggleFavorite}
          />
          <QuickActions actions={quickActions} onPress={handleQuickAction} />
          <TodayTasksSection
            rows={dueRows}
            handlers={handlers}
            onPressOpenPlant={(id) =>
              router.push({
                pathname: "/plants/[plantId]",
                params: { plantId: String(id) },
              })
            }
          />
          <HealthBanner
            observations={observations}
            onPress={() =>
              router.push({
                pathname: "/plants/[plantId]/health",
                params: { plantId: String(plantId) },
              })
            }
          />
          <PhotosStrip
            photos={photos}
            onPressPhoto={setViewerPhoto}
            onAddPhoto={() =>
              router.push({
                pathname: "/plants/[plantId]/photos",
                params: { plantId: String(plantId) },
              })
            }
            onPressSeeAll={() =>
              router.push({
                pathname: "/plants/[plantId]/photos",
                params: { plantId: String(plantId) },
              })
            }
          />
          <GrowthSnippet
            measurements={measurements}
            onPressSeeAll={() =>
              router.push({
                pathname: "/plants/[plantId]/growth",
                params: { plantId: String(plantId) },
              })
            }
          />
          <CareProfileSection plant={plant} preset={preset} />
          <NotesSection notes={plant.notes} />
          <TimelineSection
            items={timeline}
            filter={filter}
            onFilterChange={setFilter}
          />
        </View>
      </Container>

      <TaskActionSheets handlers={handlers} />

      <PhotoViewerDialog
        isOpen={viewerPhoto !== null}
        onOpenChange={(open) => {
          if (!open) setViewerPhoto(null);
        }}
        photo={viewerPhoto}
      />
    </View>
  );
}
