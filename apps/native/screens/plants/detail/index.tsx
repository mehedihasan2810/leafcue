import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { useToast } from "heroui-native/toast";
import { useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { PhotoViewerDialog } from "@/components/photo-viewer-dialog";
import { SetupProgressCard } from "@/components/setup-progress-card";
import { TaskActionSheets } from "@/components/task-action-sheets";
import { usePlantDetailReadModel } from "@/hooks/use-care-read-models";
import { useTaskHandlers } from "@/hooks/use-task-handlers";
import type { PlantSetupAction } from "@/lib/care/setup-progress";
import { getPlantSetupProgress } from "@/lib/care/setup-progress";
import { performComplete } from "@/lib/care/task-actions";
import { relativeDueLabel } from "@/lib/dates";
import { useDatabase } from "@/lib/db";
import {
  type DueTaskRow,
  type PlantTimelineKind,
  updatePlant,
} from "@/lib/db/repositories";
import type {
  CareTaskTemplate,
  PlantPhoto,
  PlantTaskSchedule,
} from "@/lib/db/types";
import { CarePlanCard } from "@/screens/plants/detail/_components/care-plan-card";
import { CareProfileSection } from "@/screens/plants/detail/_components/care-profile-section";
import { GrowthSnippet } from "@/screens/plants/detail/_components/growth-snippet";
import { HealthBanner } from "@/screens/plants/detail/_components/health-banner";
import { HeroCard } from "@/screens/plants/detail/_components/hero-card";
import { NotesSection } from "@/screens/plants/detail/_components/notes-section";
import { PhotosStrip } from "@/screens/plants/detail/_components/photos-strip";
import { PlantNextCareCard } from "@/screens/plants/detail/_components/plant-next-care-card";
import {
  type QuickAction,
  type QuickActionId,
  QuickActions,
} from "@/screens/plants/detail/_components/quick-actions";
import type { TimelineFilter } from "@/screens/plants/detail/_components/timeline-filter";
import { TimelineSection } from "@/screens/plants/detail/_components/timeline-section";
import { WhyThisCueSheet } from "@/screens/plants/detail/_components/why-this-cue-sheet";

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
  const [cueRow, setCueRow] = useState<DueTaskRow | null>(null);

  const timelineKinds = useMemo<PlantTimelineKind[] | undefined>(() => {
    if (filter === "all") return undefined;
    return [TIMELINE_KIND_FROM_FILTER[filter]];
  }, [filter]);
  const {
    plant,
    room,
    shelf: shelfRow,
    schedules,
    dueRows,
    careLogs,
    photos,
    measurements,
    observations,
    templates,
    preset,
    timeline,
    nextDueAt,
  } = usePlantDetailReadModel(db, { plantId, timelineKinds });

  const handlers = useTaskHandlers();
  const { toast } = useToast();

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

  const templateById = new Map<number, CareTaskTemplate>();
  for (const template of templates) templateById.set(template.id, template);

  const scheduleRows: DueTaskRow[] = schedules
    .filter((schedule) => schedule.isEnabled)
    .map((schedule) => ({
      schedule,
      plant,
      template: schedule.templateId
        ? (templateById.get(schedule.templateId) ?? null)
        : null,
    }))
    .sort((a, b) => {
      const left = a.schedule.nextDueAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const right = b.schedule.nextDueAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return left - right;
    });

  const nextCareRow = dueRows[0] ?? scheduleRows[0] ?? null;
  const upcomingCareRows = scheduleRows.filter(
    (row) => row.schedule.id !== nextCareRow?.schedule.id,
  );

  const setupProgress = getPlantSetupProgress({
    plant,
    schedules,
    photos,
    logs: careLogs,
  });

  const openSchedules = () => {
    router.push({
      pathname: "/plants/[plantId]/schedules",
      params: { plantId: String(plantId) },
    });
  };

  const handleSetupAction = (action: PlantSetupAction) => {
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
      openSchedules();
      return;
    }
    router.push({
      pathname: "/plants/[plantId]/edit",
      params: { plantId: String(plantId) },
    });
  };

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
          openSchedules();
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
          {!setupProgress.isComplete ? (
            <SetupProgressCard
              plantName={plant.nickname}
              progress={setupProgress}
              onPressAction={handleSetupAction}
            />
          ) : null}
          <PlantNextCareCard
            nextRow={nextCareRow}
            upcomingRows={upcomingCareRows}
            scheduleCount={schedules.length}
            onComplete={handlers.handleQuickComplete}
            onMore={handlers.openMenu}
            onWhy={setCueRow}
            onEditSchedules={openSchedules}
          />
          <QuickActions actions={quickActions} onPress={handleQuickAction} />
          <CarePlanCard
            schedules={schedules}
            templates={templates}
            onEdit={openSchedules}
          />
          <CareProfileSection plant={plant} preset={preset} />
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
          <TimelineSection
            items={timeline}
            filter={filter}
            onFilterChange={setFilter}
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
          <HealthBanner
            observations={observations}
            onPress={() =>
              router.push({
                pathname: "/plants/[plantId]/health",
                params: { plantId: String(plantId) },
              })
            }
          />
          <NotesSection notes={plant.notes} />
        </View>
      </Container>

      <TaskActionSheets handlers={handlers} />

      <WhyThisCueSheet
        row={cueRow}
        isOpen={cueRow !== null}
        onOpenChange={(open) => {
          if (!open) setCueRow(null);
        }}
        onEditSchedule={openSchedules}
      />

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
