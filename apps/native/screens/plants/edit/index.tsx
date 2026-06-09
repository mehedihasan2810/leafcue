import { Ionicons } from "@expo/vector-icons";
import {
  type FormAsyncValidateOrFn,
  type FormValidateOrFn,
  type ReactFormExtendedApi,
  useForm,
} from "@tanstack/react-form";
import { addDays, format } from "date-fns";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router } from "expo-router";
import {
  Button,
  PressableFeedback,
  Spinner,
  Switch,
  useThemeColor,
} from "heroui-native";
import { useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScreen } from "@/components/keyboard-aware-screen";
import { PhotoPickerField } from "@/components/photo-picker-field";
import {
  FormChipGroupField,
  type FormChipOption,
  FormDatePickerField,
  FormSection,
  FormSelectField,
  FormSwitchField,
  FormTextArea,
  FormTextField,
} from "@/components/tanstack-form-fields";
import { useDatabase } from "@/lib/db";
import {
  archivePlant as archivePlantRepo,
  createPlantWithDefaults,
  getCareTaskTemplates,
  getPlantById,
  getPresets,
  getRooms,
  getShelves,
  updatePlant,
} from "@/lib/db/repositories";
import {
  type CareDifficulty,
  type CareTaskTemplateKey,
  careTaskTemplates as careTaskTemplatesTable,
  type LightPreference,
  rooms as roomsTable,
  shelves as shelvesTable,
  type Toxicity,
  type WateringPreference,
} from "@/lib/db/schema";
import type { CareTaskTemplate, PlantPreset } from "@/lib/db/types";
import { plantInsertSchema } from "@/lib/db/zod";
import {
  applyCareStyleInterval,
  type CareStyle,
  careStyleOptions,
} from "@/screens/plants/edit/care-style";
import {
  applyPlantPresetHints,
  buildPlantIntakeInput,
  buildPlantIntakeValues,
  type PlantIntakeFormValues,
} from "@/screens/plants/edit/plant-intake";

type EditPlantScreenProps = {
  mode: "create" | "edit";
  plantId?: number;
};

type PlantFormValidate = FormValidateOrFn<PlantIntakeFormValues> | undefined;
type PlantFormAsyncValidate =
  | FormAsyncValidateOrFn<PlantIntakeFormValues>
  | undefined;

type PlantIntakeFormApi = ReactFormExtendedApi<
  PlantIntakeFormValues,
  PlantFormValidate,
  PlantFormValidate,
  PlantFormAsyncValidate,
  PlantFormValidate,
  PlantFormAsyncValidate,
  PlantFormValidate,
  PlantFormAsyncValidate,
  PlantFormValidate,
  PlantFormAsyncValidate,
  PlantFormAsyncValidate,
  unknown
>;

type CreateStep = "start" | "basics" | "location" | "schedule";

const CREATE_STEPS: ReadonlyArray<CreateStep> = [
  "start",
  "basics",
  "location",
  "schedule",
];

const CREATE_STEP_LABEL: Record<CreateStep, string> = {
  start: "Start",
  basics: "Basics",
  location: "Place",
  schedule: "Care",
};

const CREATE_SCHEDULES: ReadonlyArray<{
  key: CareTaskTemplateKey;
  enabledField: "scheduleWater" | "scheduleFertilize" | "scheduleMist";
  intervalField:
    | "waterIntervalDays"
    | "fertilizeIntervalDays"
    | "mistIntervalDays";
  fallbackLabel: string;
}> = [
  {
    key: "water",
    enabledField: "scheduleWater",
    intervalField: "waterIntervalDays",
    fallbackLabel: "Water",
  },
  {
    key: "fertilize",
    enabledField: "scheduleFertilize",
    intervalField: "fertilizeIntervalDays",
    fallbackLabel: "Fertilize",
  },
  {
    key: "mist",
    enabledField: "scheduleMist",
    intervalField: "mistIntervalDays",
    fallbackLabel: "Mist",
  },
];

const lightOptions: ReadonlyArray<FormChipOption<LightPreference>> = [
  { value: "low", label: "Low light", icon: "moon-outline" },
  { value: "medium", label: "Medium", icon: "partly-sunny-outline" },
  {
    value: "bright-indirect",
    label: "Bright indirect",
    icon: "sunny-outline",
  },
  { value: "direct-sun", label: "Direct sun", icon: "flame-outline" },
];

const wateringOptions: ReadonlyArray<FormChipOption<WateringPreference>> = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "Heavy" },
  { value: "let-dry-between", label: "Let dry between" },
  { value: "keep-moist", label: "Keep moist" },
];

const careDifficultyOptions: ReadonlyArray<FormChipOption<CareDifficulty>> = [
  { value: "easy", label: "Easy" },
  { value: "moderate", label: "Moderate" },
  { value: "hard", label: "Hard" },
];

const toxicityOptions: ReadonlyArray<FormChipOption<Toxicity>> = [
  { value: "non-toxic", label: "Non-toxic" },
  { value: "toxic-pets", label: "Toxic to pets" },
  { value: "toxic-children", label: "Toxic to children" },
  { value: "toxic-all", label: "Toxic to all" },
  { value: "unknown", label: "Unknown" },
];

const careStyleChipOptions: ReadonlyArray<FormChipOption<CareStyle>> =
  careStyleOptions.map((option) => ({
    value: option.value,
    label: option.label,
  }));

function nextStep(step: CreateStep): CreateStep {
  const index = CREATE_STEPS.indexOf(step);
  return CREATE_STEPS[Math.min(index + 1, CREATE_STEPS.length - 1)] ?? step;
}

function previousStep(step: CreateStep): CreateStep {
  const index = CREATE_STEPS.indexOf(step);
  return CREATE_STEPS[Math.max(index - 1, 0)] ?? step;
}

function parsePositiveInterval(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.min(365, Math.floor(parsed));
}

function templateForKey(
  templates: ReadonlyArray<CareTaskTemplate>,
  key: CareTaskTemplateKey,
): CareTaskTemplate | null {
  return templates.find((template) => template.key === key) ?? null;
}

function resolvePreviewInterval(args: {
  value: string;
  template: CareTaskTemplate | null;
  style: CareStyle;
}): number | null {
  return (
    parsePositiveInterval(args.value) ??
    applyCareStyleInterval(
      args.template?.defaultIntervalDays ?? null,
      args.style,
    )
  );
}

function buildCreateScheduleDrafts(
  values: PlantIntakeFormValues,
  templates: ReadonlyArray<CareTaskTemplate>,
): Array<{
  key: CareTaskTemplateKey;
  intervalDays: number | null;
  instructions: string | null;
}> {
  return CREATE_SCHEDULES.flatMap((config) => {
    if (!values[config.enabledField]) return [];
    const template = templateForKey(templates, config.key);
    const intervalDays = resolvePreviewInterval({
      value: values[config.intervalField],
      template,
      style: values.careStyle,
    });
    return [
      {
        key: config.key,
        intervalDays,
        instructions: template?.defaultInstructions ?? null,
      },
    ];
  });
}

export function EditPlantScreen({ mode, plantId }: EditPlantScreenProps) {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");
  const danger = useThemeColor("danger");
  const muted = useThemeColor("muted");
  const db = useDatabase();
  const [submitting, setSubmitting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>("start");

  const liveRooms = useLiveQuery(db.select().from(roomsTable));
  const liveShelves = useLiveQuery(db.select().from(shelvesTable));
  const liveTemplates = useLiveQuery(db.select().from(careTaskTemplatesTable));

  const rooms = useMemo(() => {
    void liveRooms.data;
    return getRooms(db);
  }, [db, liveRooms.data]);

  const presets = useMemo(() => getPresets(db), [db]);

  const templates = useMemo(() => {
    void liveTemplates.data;
    return getCareTaskTemplates(db);
  }, [db, liveTemplates.data]);

  const existingPlant = useMemo(() => {
    if (mode !== "edit" || plantId === undefined) return undefined;
    return getPlantById(db, plantId);
  }, [db, mode, plantId]);

  const initialValues = useMemo<PlantIntakeFormValues>(
    () => buildPlantIntakeValues(mode === "edit" ? existingPlant : undefined),
    [existingPlant, mode],
  );

  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      setSubmitting(true);
      try {
        const input = buildPlantIntakeInput(value);
        if (mode === "edit" && plantId !== undefined) {
          updatePlant(db, plantId, input);
          router.back();
        } else {
          const result = createPlantWithDefaults(db, input, {
            scheduleDrafts: buildCreateScheduleDrafts(value, templates),
          });
          router.replace({
            pathname: "/plants/[plantId]",
            params: { plantId: String(result.plant.id) },
          });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not save plant";
        Alert.alert("Couldn't save plant", message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleSelectPreset = (presetIdString: string | null) => {
    if (presetIdString === null) {
      form.setFieldValue("speciesPresetId", null);
      return;
    }
    const numericId = Number(presetIdString);
    const preset = presets.find((entry) => entry.id === numericId);
    if (!preset) return;
    const currentValues = form.state.values;
    const next = applyPlantPresetHints(
      { ...currentValues, speciesPresetId: preset.id },
      preset,
    );
    if (mode === "create" && !next.nickname.trim()) {
      next.nickname = preset.commonName;
    }
    form.reset(next);
  };

  const handleArchive = () => {
    if (mode !== "edit" || plantId === undefined) return;
    Alert.alert(
      "Archive plant?",
      "Archived plants stay in your library but are hidden by default. You can restore them later.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: () => {
            setArchiving(true);
            try {
              archivePlantRepo(db, plantId);
              router.back();
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "Could not archive plant";
              Alert.alert("Archive failed", message);
            } finally {
              setArchiving(false);
            }
          },
        },
      ],
    );
  };

  if (mode === "edit" && plantId === undefined) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background px-6"
        style={{ paddingBottom: insets.bottom }}
      >
        <Text className="font-semibold text-base text-foreground">
          Plant not found
        </Text>
        <Text className="mt-1 text-center text-muted text-sm">
          The plant you tried to edit no longer exists.
        </Text>
        <Button variant="ghost" onPress={() => router.back()} className="mt-4">
          <Button.Label>Close</Button.Label>
        </Button>
      </View>
    );
  }

  if (mode === "edit" && existingPlant === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </View>
    );
  }

  const presetOptions = presets.map((preset) => ({
    value: String(preset.id),
    label: preset.commonName,
    description: preset.scientificName ?? undefined,
  }));

  const roomOptions = rooms.map((room) => ({
    value: String(room.id),
    label: room.name,
  }));

  return (
    <KeyboardAwareScreen
      contentClassName="gap-6 pb-16"
      footer={
        <View className="flex-row items-center gap-3">
          <Button
            variant="ghost"
            isDisabled={submitting || archiving}
            onPress={() => {
              if (mode === "create" && createStep !== "start") {
                setCreateStep(previousStep(createStep));
              } else {
                router.back();
              }
            }}
            className="flex-1"
          >
            <Button.Label>
              {mode === "create" && createStep !== "start" ? "Back" : "Cancel"}
            </Button.Label>
          </Button>
          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
              nickname: state.values.nickname,
            })}
          >
            {({ canSubmit, isSubmitting, nickname }) => {
              const isCreateFinal =
                mode === "create" && createStep === "schedule";
              const isCreateNext =
                mode === "create" && createStep !== "schedule";
              const canContinue =
                createStep !== "basics" || nickname.trim().length > 0;
              const isDisabled =
                isSubmitting ||
                submitting ||
                (isCreateNext ? !canContinue : !canSubmit);

              return (
                <Button
                  isDisabled={isDisabled}
                  onPress={() => {
                    if (isCreateNext) {
                      setCreateStep(nextStep(createStep));
                      return;
                    }
                    void form.handleSubmit();
                  }}
                  className="flex-1"
                >
                  {isSubmitting || submitting ? (
                    <Spinner color="primary" />
                  ) : (
                    <Button.Label>
                      {mode === "edit"
                        ? "Save changes"
                        : isCreateFinal
                          ? "Add plant"
                          : "Continue"}
                    </Button.Label>
                  )}
                </Button>
              );
            }}
          </form.Subscribe>
        </View>
      }
    >
      <View
        className="flex-row items-center justify-between"
        style={{ paddingTop: insets.top > 0 ? 0 : 8 }}
      >
        <PressableFeedback
          onPress={() => router.back()}
          className="size-9 items-center justify-center rounded-full bg-surface"
        >
          <Ionicons name="close" size={20} color={muted} />
        </PressableFeedback>
        <Text className="font-semibold text-base text-foreground">
          {mode === "edit" ? "Edit plant" : "Add your plant"}
        </Text>
        <View className="w-9" />
      </View>

      {mode === "create" ? (
        <CreateStepIndicator currentStep={createStep} />
      ) : null}

      {mode === "create" && createStep === "start" ? (
        <CreateStartStep
          presets={presets.slice(0, 6)}
          onAddManual={() => setCreateStep("basics")}
          onSelectPreset={(presetId) => {
            handleSelectPreset(String(presetId));
            setCreateStep("basics");
          }}
        />
      ) : null}

      {mode !== "create" || createStep === "basics" ? (
        <>
          <FormSection
            title="Photo"
            description="Photos stay on this device. We never upload them."
          >
            <form.Field name="photoUri">
              {(field) => (
                <PhotoPickerField
                  value={field.state.value}
                  onChange={(uri) => field.handleChange(uri)}
                />
              )}
            </form.Field>
          </FormSection>

          <FormSection title="Basics">
            <form.Field
              name="nickname"
              validators={{
                onChange: ({ value }) => {
                  const result =
                    plantInsertSchema.shape.nickname.safeParse(value);
                  if (result.success) return undefined;
                  return result.error.issues[0]?.message ?? "Required";
                },
              }}
            >
              {(field) => (
                <FormTextField
                  label="Nickname"
                  isRequired
                  placeholder="e.g. Little Lemon"
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  errors={field.state.meta.errors}
                  maxLength={120}
                  autoCapitalize="words"
                />
              )}
            </form.Field>

            <form.Field name="speciesPresetId">
              {(field) => (
                <FormSelectField
                  label="Plant preset"
                  description="Optional. Prefilled details only fill in empty fields."
                  value={
                    field.state.value !== null
                      ? String(field.state.value)
                      : null
                  }
                  onValueChange={handleSelectPreset}
                  options={presetOptions}
                  placeholder="Browse presets…"
                />
              )}
            </form.Field>

            <form.Field name="commonName">
              {(field) => (
                <FormTextField
                  label="Common name"
                  placeholder="e.g. Meyer Lemon"
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  errors={field.state.meta.errors}
                  maxLength={120}
                />
              )}
            </form.Field>

            <form.Field name="scientificName">
              {(field) => (
                <FormTextField
                  label="Scientific name"
                  placeholder="e.g. Citrus × meyeri"
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  errors={field.state.meta.errors}
                  maxLength={160}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              )}
            </form.Field>

            <form.Field name="acquiredAtIso">
              {(field) => (
                <FormDatePickerField
                  label="Acquired date"
                  description="When you got this plant."
                  value={field.state.value}
                  onChange={field.handleChange}
                />
              )}
            </form.Field>

            <form.Field name="isFavorite">
              {(field) => (
                <FormSwitchField
                  label="Favorite"
                  description="Pin to the Today dashboard."
                  value={field.state.value}
                  onValueChange={field.handleChange}
                />
              )}
            </form.Field>
          </FormSection>
        </>
      ) : null}

      {mode !== "create" || createStep === "location" ? (
        <>
          <FormSection
            title="Where it lives"
            description="Group plants by room and shelf."
          >
            <form.Field name="roomId">
              {(field) => (
                <FormSelectField
                  label="Room"
                  value={
                    field.state.value !== null
                      ? String(field.state.value)
                      : null
                  }
                  onValueChange={(value) => {
                    field.handleChange(value !== null ? Number(value) : null);
                    form.setFieldValue("shelfId", null);
                  }}
                  options={roomOptions}
                  placeholder={
                    rooms.length === 0
                      ? "No rooms yet — add one in Rooms"
                      : "Choose a room"
                  }
                />
              )}
            </form.Field>

            <form.Subscribe selector={(state) => state.values.roomId}>
              {(roomId) => {
                // Read live data so list reacts to room/shelf changes
                void liveShelves.data.length;
                const shelves = roomId !== null ? getShelves(db, roomId) : [];
                const shelfOptions = shelves.map((shelf) => ({
                  value: String(shelf.id),
                  label: shelf.name,
                }));
                return (
                  <form.Field name="shelfId">
                    {(field) => (
                      <FormSelectField
                        label="Shelf"
                        value={
                          field.state.value !== null
                            ? String(field.state.value)
                            : null
                        }
                        onValueChange={(value) =>
                          field.handleChange(
                            value !== null ? Number(value) : null,
                          )
                        }
                        options={shelfOptions}
                        placeholder={
                          roomId === null
                            ? "Choose a room first"
                            : shelves.length === 0
                              ? "No shelves yet"
                              : "Choose a shelf"
                        }
                      />
                    )}
                  </form.Field>
                );
              }}
            </form.Subscribe>
          </FormSection>

          <FormSection
            title="Care preferences"
            description="Used as hints for schedules and reminders."
          >
            <form.Field name="lightPreference">
              {(field) => (
                <FormChipGroupField
                  label="Light"
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  options={lightOptions}
                />
              )}
            </form.Field>

            <form.Field name="wateringPreference">
              {(field) => (
                <FormChipGroupField
                  label="Watering"
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  options={wateringOptions}
                />
              )}
            </form.Field>

            <form.Field name="careDifficulty">
              {(field) => (
                <FormChipGroupField
                  label="Care difficulty"
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  options={careDifficultyOptions}
                />
              )}
            </form.Field>

            <form.Field name="toxicity">
              {(field) => (
                <FormChipGroupField
                  label="Toxicity"
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  options={toxicityOptions}
                />
              )}
            </form.Field>
          </FormSection>

          <FormSection title="Pot and soil">
            <form.Field name="potType">
              {(field) => (
                <FormTextField
                  label="Pot type"
                  placeholder="e.g. Terracotta"
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  errors={field.state.meta.errors}
                  maxLength={120}
                />
              )}
            </form.Field>

            <form.Field name="potSize">
              {(field) => (
                <FormTextField
                  label="Pot size"
                  placeholder='e.g. 6"'
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  errors={field.state.meta.errors}
                  maxLength={60}
                />
              )}
            </form.Field>

            <form.Field name="hasDrainage">
              {(field) => (
                <FormSwitchField
                  label="Drainage hole"
                  description="Helps avoid root rot."
                  value={field.state.value}
                  onValueChange={field.handleChange}
                />
              )}
            </form.Field>

            <form.Field name="soilType">
              {(field) => (
                <FormTextField
                  label="Soil mix"
                  placeholder="e.g. Citrus mix with perlite"
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  errors={field.state.meta.errors}
                  maxLength={120}
                />
              )}
            </form.Field>
          </FormSection>
        </>
      ) : null}

      {mode === "create" && createStep === "schedule" ? (
        <CreateScheduleStep
          form={form}
          templates={templates}
          onPressSettings={() => router.push("/settings/reminders")}
        />
      ) : null}

      {mode !== "create" ? (
        <FormSection title="Notes">
          <form.Field name="notes">
            {(field) => (
              <FormTextArea
                label="Personal notes"
                placeholder="Anything you want to remember about this plant…"
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                errors={field.state.meta.errors}
                numberOfLines={5}
              />
            )}
          </form.Field>
        </FormSection>
      ) : null}

      {mode === "edit" && plantId !== undefined ? (
        <FormSection
          title="Care schedules"
          description="Manage watering, fertilizing, and other reminders."
        >
          <Button
            variant="secondary"
            onPress={() => {
              router.push({
                pathname: "/plants/[plantId]/schedules",
                params: { plantId: String(plantId) },
              });
            }}
          >
            <Ionicons name="time-outline" size={16} color={accent} />
            <Button.Label>Manage schedules</Button.Label>
          </Button>
        </FormSection>
      ) : null}

      {mode === "edit" ? (
        <FormSection
          title="Danger zone"
          description="Archive instead of deleting so the timeline stays."
        >
          <Button
            variant="ghost"
            onPress={handleArchive}
            isDisabled={archiving || submitting}
          >
            <Ionicons name="archive-outline" size={16} color={danger} />
            <Button.Label style={{ color: danger }}>Archive plant</Button.Label>
          </Button>
        </FormSection>
      ) : null}

      <Text className="text-center text-muted text-xs">
        Saved on this device. No account, no cloud, no analytics.{" "}
        <Text style={{ color: accent }}>You're in control.</Text>
      </Text>
    </KeyboardAwareScreen>
  );
}

function CreateStepIndicator({ currentStep }: { currentStep: CreateStep }) {
  return (
    <View className="flex-row gap-2">
      {CREATE_STEPS.map((step) => {
        const isActive = currentStep === step;
        return (
          <View
            key={step}
            className={
              isActive
                ? "flex-1 rounded-full bg-accent px-3 py-2"
                : "flex-1 rounded-full bg-surface px-3 py-2"
            }
          >
            <Text
              className={
                isActive
                  ? "text-center font-medium text-accent-foreground text-xs"
                  : "text-center font-medium text-muted text-xs"
              }
              numberOfLines={1}
            >
              {CREATE_STEP_LABEL[step]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function CreateStartStep({
  presets,
  onAddManual,
  onSelectPreset,
}: {
  presets: ReadonlyArray<PlantPreset>;
  onAddManual: () => void;
  onSelectPreset: (presetId: number) => void;
}) {
  const accent = useThemeColor("accent");
  const accentForeground = useThemeColor("accent-foreground");
  const muted = useThemeColor("muted");

  return (
    <View className="gap-4">
      <View className="gap-2 rounded-3xl border border-border/40 bg-surface p-4">
        <View className="size-12 items-center justify-center rounded-2xl bg-accent-soft">
          <Ionicons name="leaf-outline" size={24} color={accent} />
        </View>
        <Text className="font-display text-2xl text-foreground">
          Add your plant
        </Text>
        <Text className="text-muted text-sm leading-5">
          Start with a nickname and a care schedule. Photos, rooms, and extra
          details can wait.
        </Text>
        <View className="flex-row items-start gap-2 rounded-2xl bg-accent-soft/40 p-3">
          <Ionicons name="lock-closed-outline" size={14} color={accent} />
          <Text className="flex-1 text-foreground text-xs leading-4">
            Works offline. Plant data and photos stay on this device.
          </Text>
        </View>
        <Button onPress={onAddManual}>
          <Ionicons name="create-outline" size={16} color={accentForeground} />
          <Button.Label>Add manually</Button.Label>
        </Button>
      </View>

      <View className="gap-3">
        <Text className="font-semibold text-base text-foreground">
          Start from a common plant
        </Text>
        <View className="gap-2">
          {presets.map((preset) => (
            <PressableFeedback
              key={`preset-${preset.id}`}
              onPress={() => onSelectPreset(preset.id)}
              className="flex-row items-center gap-3 rounded-2xl border border-border/40 bg-surface p-3"
              accessibilityLabel={`Start with ${preset.commonName}`}
            >
              <View className="size-10 items-center justify-center rounded-xl bg-accent-soft">
                <Ionicons name="search-outline" size={16} color={accent} />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="font-medium text-foreground text-sm">
                  {preset.commonName}
                </Text>
                {preset.scientificName ? (
                  <Text className="text-muted text-xs" numberOfLines={1}>
                    {preset.scientificName}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={muted} />
            </PressableFeedback>
          ))}
        </View>
      </View>
    </View>
  );
}

function CreateScheduleStep({
  form,
  templates,
  onPressSettings,
}: {
  form: PlantIntakeFormApi;
  templates: ReadonlyArray<CareTaskTemplate>;
  onPressSettings: () => void;
}) {
  const accent = useThemeColor("accent");

  return (
    <>
      <FormSection
        title="Care style"
        description="This only shapes the first schedule preview. You can edit every interval."
      >
        <form.Field name="careStyle">
          {(field) => (
            <FormChipGroupField
              label="Goal type"
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value ?? "balanced")}
              options={careStyleChipOptions}
              allowClear={false}
            />
          )}
        </form.Field>
        <form.Subscribe selector={(state) => state.values.careStyle}>
          {(style) => {
            const option = careStyleOptions.find(
              (entry) => entry.value === style,
            );
            return (
              <Text className="text-muted text-xs">
                {option?.description ?? "Recommended default."}
              </Text>
            );
          }}
        </form.Subscribe>
      </FormSection>

      <FormSection
        title="Schedule preview"
        description="Reminders stay off unless you turn them on in Reminder Settings."
      >
        <form.Subscribe selector={(state) => state.values}>
          {(values) => (
            <View className="gap-3">
              <form.Field name="scheduleWater">
                {(enabledField) => (
                  <form.Field name="waterIntervalDays">
                    {(intervalField) => (
                      <SchedulePreviewRow
                        label={
                          templateForKey(templates, "water")?.name ?? "Water"
                        }
                        icon="water-outline"
                        isEnabled={enabledField.state.value}
                        onEnabledChange={enabledField.handleChange}
                        intervalValue={intervalField.state.value}
                        onIntervalChange={intervalField.handleChange}
                        intervalDays={resolvePreviewInterval({
                          value: intervalField.state.value,
                          template: templateForKey(templates, "water"),
                          style: values.careStyle,
                        })}
                      />
                    )}
                  </form.Field>
                )}
              </form.Field>

              <form.Field name="scheduleFertilize">
                {(enabledField) => (
                  <form.Field name="fertilizeIntervalDays">
                    {(intervalField) => (
                      <SchedulePreviewRow
                        label={
                          templateForKey(templates, "fertilize")?.name ??
                          "Fertilize"
                        }
                        icon="flask-outline"
                        isEnabled={enabledField.state.value}
                        onEnabledChange={enabledField.handleChange}
                        intervalValue={intervalField.state.value}
                        onIntervalChange={intervalField.handleChange}
                        intervalDays={resolvePreviewInterval({
                          value: intervalField.state.value,
                          template: templateForKey(templates, "fertilize"),
                          style: values.careStyle,
                        })}
                      />
                    )}
                  </form.Field>
                )}
              </form.Field>

              <form.Field name="scheduleMist">
                {(enabledField) => (
                  <form.Field name="mistIntervalDays">
                    {(intervalField) => (
                      <SchedulePreviewRow
                        label={
                          templateForKey(templates, "mist")?.name ?? "Mist"
                        }
                        icon="rainy-outline"
                        isEnabled={enabledField.state.value}
                        onEnabledChange={enabledField.handleChange}
                        intervalValue={intervalField.state.value}
                        onIntervalChange={intervalField.handleChange}
                        intervalDays={resolvePreviewInterval({
                          value: intervalField.state.value,
                          template: templateForKey(templates, "mist"),
                          style: values.careStyle,
                        })}
                      />
                    )}
                  </form.Field>
                )}
              </form.Field>
            </View>
          )}
        </form.Subscribe>
      </FormSection>

      <FormSection title="Optional note">
        <form.Field name="notes">
          {(field) => (
            <FormTextArea
              label="Personal notes"
              placeholder="Anything you want to remember about this plant..."
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              errors={field.state.meta.errors}
              numberOfLines={4}
            />
          )}
        </form.Field>
      </FormSection>

      <View className="gap-3 rounded-3xl border border-border/40 bg-surface p-4">
        <View className="flex-row items-start gap-3">
          <View className="size-10 items-center justify-center rounded-2xl bg-accent-soft">
            <Ionicons name="notifications-outline" size={18} color={accent} />
          </View>
          <View className="flex-1 gap-1">
            <Text className="font-semibold text-base text-foreground">
              Reminders are optional
            </Text>
            <Text className="text-muted text-xs leading-4">
              LeafCue will not ask for notification permission while adding this
              plant. Enable reminders when you are ready.
            </Text>
          </View>
        </View>
        <Button variant="secondary" size="sm" onPress={onPressSettings}>
          <Button.Label>Reminder Settings</Button.Label>
        </Button>
      </View>
    </>
  );
}

function SchedulePreviewRow({
  label,
  icon,
  isEnabled,
  onEnabledChange,
  intervalValue,
  onIntervalChange,
  intervalDays,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isEnabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  intervalValue: string;
  onIntervalChange: (value: string) => void;
  intervalDays: number | null;
}) {
  const accent = useThemeColor("accent");
  const dueDate = intervalDays ? addDays(new Date(), intervalDays) : null;

  return (
    <View
      className="gap-3 rounded-3xl border border-border/40 bg-surface p-4"
      style={{ opacity: isEnabled ? 1 : 0.62 }}
    >
      <View className="flex-row items-center gap-3">
        <View className="size-10 items-center justify-center rounded-2xl bg-accent-soft">
          <Ionicons name={icon} size={18} color={accent} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-semibold text-base text-foreground">
            {label}
          </Text>
          <Text className="text-muted text-xs">
            {intervalDays
              ? `Every ${intervalDays} day${intervalDays === 1 ? "" : "s"} · Next ${format(
                  dueDate ?? new Date(),
                  "EEE, MMM d",
                )}`
              : "One-off or no interval"}
          </Text>
        </View>
        <Switch isSelected={isEnabled} onSelectedChange={onEnabledChange}>
          <Switch.Thumb />
        </Switch>
      </View>

      {isEnabled ? (
        <FormTextField
          label="Interval days"
          description="Leave blank to use the previewed default."
          value={intervalValue}
          onChangeText={onIntervalChange}
          placeholder={intervalDays ? String(intervalDays) : "Optional"}
          keyboardType="number-pad"
          maxLength={3}
        />
      ) : null}
    </View>
  );
}

export type { EditPlantScreenProps };
