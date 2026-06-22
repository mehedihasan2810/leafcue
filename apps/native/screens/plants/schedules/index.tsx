import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router } from "expo-router";
import {
  Button,
  PressableFeedback,
  Switch,
  useThemeColor,
} from "heroui-native";
import { useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getCareTaskIcon } from "@/components/care-task-icons";
import { Container } from "@/components/container";
import { EmptyState } from "@/components/empty-state";
import { SectionHeader } from "@/components/section-header";
import {
  type IntervalSuggestion,
  suggestIntervalAdjustment,
} from "@/lib/care/adaptive";
import { buildSmartHints, type CareHint } from "@/lib/care/hints";
import {
  performApplyAdaptiveInterval,
  performDeleteSchedule,
  performSaveSchedule,
  performToggleEnabled,
} from "@/lib/care/task-actions";
import { relativeDueLabel } from "@/lib/dates";
import { useDatabase } from "@/lib/db";
import {
  getCareLogsForPlant,
  getCareLogsForSchedule,
  getCareTaskTemplates,
  getPlantById,
  getPresetById,
  getSchedulesForPlant,
} from "@/lib/db/repositories";
import {
  careLogs as careLogsTable,
  careTaskTemplates as careTaskTemplatesTable,
  plantTaskSchedules as plantTaskSchedulesTable,
} from "@/lib/db/schema";
import type {
  CareLog,
  CareTaskTemplate,
  PlantPreset,
  PlantTaskSchedule,
} from "@/lib/db/types";

import { ScheduleFormSheet } from "@/screens/plants/schedules/_components/schedule-form-sheet";

type SchedulesScreenProps = {
  plantId: number;
};

export function SchedulesScreen({ plantId }: SchedulesScreenProps) {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");
  const success = useThemeColor("success");
  const db = useDatabase();
  const [isFormOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PlantTaskSchedule | null>(null);

  const liveSchedules = useLiveQuery(db.select().from(plantTaskSchedulesTable));
  const liveLogs = useLiveQuery(db.select().from(careLogsTable));
  const liveTemplates = useLiveQuery(db.select().from(careTaskTemplatesTable));

  const plant = useMemo(() => {
    void liveSchedules.data;
    return getPlantById(db, plantId);
  }, [db, plantId, liveSchedules.data]);

  const preset = useMemo<PlantPreset | null>(() => {
    if (!plant?.speciesPresetId) return null;
    return getPresetById(db, plant.speciesPresetId) ?? null;
  }, [db, plant?.speciesPresetId]);

  const schedules = useMemo(() => {
    void liveSchedules.data;
    return getSchedulesForPlant(db, plantId);
  }, [db, plantId, liveSchedules.data]);

  const templates = useMemo<CareTaskTemplate[]>(() => {
    void liveTemplates.data;
    return getCareTaskTemplates(db);
  }, [db, liveTemplates.data]);
  const templateById = useMemo(() => {
    const map = new Map<number, CareTaskTemplate>();
    for (const template of templates) map.set(template.id, template);
    return map;
  }, [templates]);

  const recentLogs = useMemo<CareLog[]>(() => {
    void liveLogs.data;
    return getCareLogsForPlant(db, plantId, 10);
  }, [db, plantId, liveLogs.data]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (schedule: PlantTaskSchedule) => {
    setEditing(schedule);
    setFormOpen(true);
  };

  const handleSave = async (input: {
    templateId: number | null;
    customName: string | null;
    intervalDays: number | null;
    nextDueAt: Date | null;
    preferredHour: number | null;
    preferredMinute: number | null;
    instructions: string | null;
  }) => {
    await performSaveSchedule(db, {
      plantId,
      scheduleId: editing?.id,
      templateId: input.templateId,
      customName: input.customName,
      intervalDays: input.intervalDays,
      nextDueAt: input.nextDueAt,
      preferredHour: input.preferredHour,
      preferredMinute: input.preferredMinute,
      instructions: input.instructions,
    });
  };

  const handleDelete = (schedule: PlantTaskSchedule) => {
    Alert.alert(
      "Delete schedule?",
      "This will remove the schedule but keep care logs.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void performDeleteSchedule(db, schedule.id).then((deleted) => {
              if (deleted) setFormOpen(false);
            });
          },
        },
      ],
    );
  };

  const handleToggle = async (
    schedule: PlantTaskSchedule,
    nextEnabled: boolean,
  ) => {
    await performToggleEnabled(db, schedule.id, nextEnabled);
  };

  if (!plant) {
    return (
      <Container className="px-6">
        <View className="flex-1 items-center justify-center gap-3">
          <Text className="font-semibold text-foreground">Plant not found</Text>
          <Button variant="ghost" onPress={() => router.back()}>
            <Button.Label>Close</Button.Label>
          </Button>
        </View>
      </Container>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View
        className="flex-row items-center justify-between px-6"
        style={{ paddingTop: insets.top + 12, paddingBottom: 12 }}
      >
        <PressableFeedback
          onPress={() => router.back()}
          className="size-9 items-center justify-center rounded-full bg-surface"
        >
          <Ionicons name="chevron-back" size={20} color={muted} />
        </PressableFeedback>
        <View className="items-center">
          <Text className="text-muted text-xs">Care schedules</Text>
          <Text className="font-semibold text-base text-foreground">
            {plant.nickname}
          </Text>
        </View>
        <PressableFeedback
          onPress={openCreate}
          className="size-9 items-center justify-center rounded-full bg-accent"
        >
          <Ionicons name="add" size={20} color={accent} />
        </PressableFeedback>
      </View>

      <Container className="px-6" isScrollable>
        <View className="gap-5" style={{ paddingBottom: insets.bottom + 32 }}>
          {schedules.length === 0 ? (
            <EmptyState
              icon="leaf-outline"
              title="No schedules yet"
              description="Add a schedule to get gentle reminders to care for this plant."
              ctaLabel="Add schedule"
              onPressCta={openCreate}
            />
          ) : (
            <View className="gap-3">
              <SectionHeader
                title="Active schedules"
                count={schedules.length}
              />
              <View className="gap-3">
                {schedules.map((schedule) => {
                  const template = schedule.templateId
                    ? (templateById.get(schedule.templateId) ?? null)
                    : null;
                  const scheduleLogs = recentLogs.filter(
                    (log) => log.scheduleId === schedule.id,
                  );
                  const hints = buildSmartHints({
                    plant,
                    preset,
                    template,
                    schedule,
                    recentLogs: scheduleLogs,
                  });
                  const suggestion = suggestIntervalAdjustment({
                    schedule,
                    template,
                    recentLogs: scheduleLogs,
                  });
                  // The actionable banner replaces the advisory median hint.
                  const visibleHints = suggestion
                    ? hints.filter((hint) => hint.id !== "history-median")
                    : hints;
                  return (
                    <ScheduleCard
                      key={`schedule-${schedule.id}`}
                      schedule={schedule}
                      template={template}
                      hints={visibleHints}
                      suggestion={suggestion}
                      logs={getCareLogsForSchedule(db, schedule.id, 5)}
                      onToggle={(value) => {
                        void handleToggle(schedule, value);
                      }}
                      onApplySuggestion={(intervalDays) => {
                        void performApplyAdaptiveInterval(
                          db,
                          schedule.id,
                          intervalDays,
                        );
                      }}
                      onEdit={() => openEdit(schedule)}
                    />
                  );
                })}
              </View>
            </View>
          )}

          <View className="gap-3">
            <SectionHeader title="Recent care" count={recentLogs.length} />
            {recentLogs.length === 0 ? (
              <View className="rounded-2xl border border-border/30 bg-surface p-4">
                <Text className="text-muted text-sm">
                  No care logs yet. Completing tasks will add them here.
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {recentLogs.slice(0, 8).map((log) => {
                  const template = log.templateId
                    ? (templateById.get(log.templateId) ?? null)
                    : null;
                  return (
                    <View
                      key={`recent-${log.id}`}
                      className="flex-row items-center gap-3 rounded-2xl border border-border/30 bg-surface p-3"
                    >
                      <View className="size-9 items-center justify-center rounded-xl bg-success-soft">
                        <Ionicons
                          name={getCareTaskIcon(template?.key)}
                          size={16}
                          color={success}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="font-medium text-foreground text-sm">
                          {log.title ?? template?.name ?? log.type}
                        </Text>
                        {log.notes ? (
                          <Text
                            className="text-muted text-xs"
                            numberOfLines={1}
                          >
                            {log.notes}
                          </Text>
                        ) : null}
                      </View>
                      <Text className="text-muted text-xs">
                        {format(log.completedAt, "MMM d, p")}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </Container>

      <ScheduleFormSheet
        isOpen={isFormOpen}
        onOpenChange={setFormOpen}
        templates={templates}
        initial={editing}
        onSubmit={handleSave}
        onDelete={editing ? () => handleDelete(editing) : undefined}
      />
    </View>
  );
}

type ScheduleCardProps = {
  schedule: PlantTaskSchedule;
  template: CareTaskTemplate | null;
  hints: ReadonlyArray<CareHint>;
  suggestion: IntervalSuggestion | null;
  logs: ReadonlyArray<CareLog>;
  onToggle: (next: boolean) => void;
  onApplySuggestion: (intervalDays: number) => void;
  onEdit: () => void;
};

function ScheduleCard({
  schedule,
  template,
  hints,
  suggestion,
  logs,
  onToggle,
  onApplySuggestion,
  onEdit,
}: ScheduleCardProps) {
  const accent = useThemeColor("accent");
  const taskName = schedule.customName ?? template?.name ?? "Custom care";
  const dueLabel = relativeDueLabel(schedule.nextDueAt ?? null);
  const interval =
    schedule.intervalDays ?? template?.defaultIntervalDays ?? null;

  return (
    <View className="gap-3 rounded-3xl border border-border/40 bg-surface p-4">
      <View className="flex-row items-center gap-3">
        <View className="size-10 items-center justify-center rounded-2xl bg-accent-soft">
          <Ionicons
            name={getCareTaskIcon(template?.key)}
            size={18}
            color={accent}
          />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-semibold text-base text-foreground">
            {taskName}
          </Text>
          <Text className="text-muted text-xs">
            {interval !== null
              ? `Every ${interval} day${interval === 1 ? "" : "s"} · `
              : ""}
            Next: {dueLabel}
          </Text>
        </View>
        <Switch isSelected={schedule.isEnabled} onSelectedChange={onToggle}>
          <Switch.Thumb />
        </Switch>
      </View>

      {schedule.instructions ? (
        <Text className="text-foreground text-sm" numberOfLines={3}>
          {schedule.instructions}
        </Text>
      ) : null}

      {hints.length > 0 ? (
        <View className="gap-1.5">
          {hints.map((hint) => (
            <HintRow key={hint.id} hint={hint} />
          ))}
        </View>
      ) : null}

      {suggestion ? (
        <View className="gap-2 rounded-2xl border border-accent/30 bg-accent-soft/50 p-3">
          <View className="flex-row items-start gap-2">
            <Ionicons name="sparkles" size={14} color={accent} />
            <Text className="flex-1 text-foreground text-xs leading-4">
              You usually do this about every {suggestion.suggestedInterval} day
              {suggestion.suggestedInterval === 1 ? "" : "s"}, not every{" "}
              {suggestion.currentInterval}. Match your routine?
            </Text>
          </View>
          <Button
            size="sm"
            onPress={() => onApplySuggestion(suggestion.suggestedInterval)}
          >
            <Button.Label>
              Adjust to every {suggestion.suggestedInterval} days
            </Button.Label>
          </Button>
        </View>
      ) : null}

      {logs.length > 0 ? (
        <View className="gap-1.5 border-border/30 border-t pt-3">
          <Text className="font-medium text-foreground text-xs uppercase tracking-wide">
            Recent
          </Text>
          {logs.map((log) => (
            <Text key={`log-${log.id}`} className="text-muted text-xs">
              {format(log.completedAt, "MMM d, p")}
              {log.amount && log.unit ? ` · ${log.amount} ${log.unit}` : ""}
              {log.notes ? ` · ${log.notes}` : ""}
            </Text>
          ))}
        </View>
      ) : null}

      <View className="flex-row gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="flex-1"
          onPress={onEdit}
        >
          <Ionicons name="create-outline" size={14} color={accent} />
          <Button.Label>Edit</Button.Label>
        </Button>
      </View>
    </View>
  );
}

function HintRow({ hint }: { hint: CareHint }) {
  const accent = useThemeColor("accent");
  const warning = useThemeColor("warning");
  const danger = useThemeColor("danger");

  const tint =
    hint.severity === "warning"
      ? danger
      : hint.severity === "caution"
        ? warning
        : accent;

  return (
    <View className="flex-row items-start gap-2 rounded-2xl bg-accent-soft/40 p-3">
      <Ionicons
        name={
          hint.severity === "warning"
            ? "warning-outline"
            : hint.severity === "caution"
              ? "alert-circle-outline"
              : "bulb-outline"
        }
        size={14}
        color={tint}
      />
      <Text className="flex-1 text-foreground text-xs leading-4">
        {hint.message}
      </Text>
    </View>
  );
}
