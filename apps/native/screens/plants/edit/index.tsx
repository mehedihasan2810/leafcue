import { Ionicons } from "@expo/vector-icons";
import { useForm } from "@tanstack/react-form";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router } from "expo-router";
import { Button, Spinner, useThemeColor } from "heroui-native";
import { useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScreen } from "@/components/keyboard-aware-screen";
import { PhotoPickerField } from "@/components/photo-picker-field";
import {
  FormChipGroupField,
  type FormChipOption,
  FormSection,
  FormSelectField,
  FormSwitchField,
  FormTextArea,
  FormTextField,
} from "@/components/tanstack-form-fields";
import { formatIsoDate, parseIsoDate } from "@/lib/dates";
import { useDatabase } from "@/lib/db";
import {
  archivePlant as archivePlantRepo,
  createPlantWithDefaults,
  getPlantById,
  getPresets,
  getRooms,
  getShelves,
  updatePlant,
} from "@/lib/db/repositories";
import {
  type CareDifficulty,
  type LightPreference,
  rooms as roomsTable,
  shelves as shelvesTable,
  type Toxicity,
  type WateringPreference,
} from "@/lib/db/schema";
import type { PlantPreset } from "@/lib/db/types";
import { type PlantInsertInput, plantInsertSchema } from "@/lib/db/zod";

type EditPlantScreenProps = {
  mode: "create" | "edit";
  plantId?: number;
};

type FormValues = {
  nickname: string;
  commonName: string;
  scientificName: string;
  speciesPresetId: number | null;
  photoUri: string | null;
  roomId: number | null;
  shelfId: number | null;
  acquiredAtIso: string;
  careDifficulty: CareDifficulty | null;
  toxicity: Toxicity | null;
  lightPreference: LightPreference | null;
  wateringPreference: WateringPreference | null;
  potType: string;
  potSize: string;
  hasDrainage: boolean;
  soilType: string;
  isFavorite: boolean;
  notes: string;
};

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

const careDifficultyKeywords: ReadonlyArray<{
  pattern: RegExp;
  value: CareDifficulty;
}> = [
  { pattern: /\b(easy|beginner|low\s*maintenance)\b/i, value: "easy" },
  { pattern: /\b(moderate|medium|intermediate)\b/i, value: "moderate" },
  { pattern: /\b(hard|advanced|fussy|tricky)\b/i, value: "hard" },
];

function inferDifficulty(value: string | null): CareDifficulty | null {
  if (!value) return null;
  for (const entry of careDifficultyKeywords) {
    if (entry.pattern.test(value)) return entry.value;
  }
  return null;
}

const lightKeywords: ReadonlyArray<{
  pattern: RegExp;
  value: LightPreference;
}> = [
  { pattern: /\bdirect\s*sun\b/i, value: "direct-sun" },
  { pattern: /\bbright\s*indirect\b/i, value: "bright-indirect" },
  { pattern: /\b(medium|moderate)\s*light\b/i, value: "medium" },
  { pattern: /\blow\s*light\b/i, value: "low" },
];

function inferLight(value: string | null): LightPreference | null {
  if (!value) return null;
  for (const entry of lightKeywords) {
    if (entry.pattern.test(value)) return entry.value;
  }
  return null;
}

const wateringKeywords: ReadonlyArray<{
  pattern: RegExp;
  value: WateringPreference;
}> = [
  {
    pattern: /\b(let\s*dry|allow\s*to\s*dry|dry\s*out\s*between)\b/i,
    value: "let-dry-between",
  },
  { pattern: /\b(keep\s*moist|consistently\s*moist)\b/i, value: "keep-moist" },
  { pattern: /\b(heavy|frequent|high\s*water)\b/i, value: "high" },
  { pattern: /\b(low\s*water|drought|infrequent)\b/i, value: "low" },
  { pattern: /\b(moderate|regular)\b/i, value: "moderate" },
];

function inferWatering(value: string | null): WateringPreference | null {
  if (!value) return null;
  for (const entry of wateringKeywords) {
    if (entry.pattern.test(value)) return entry.value;
  }
  return null;
}

function applyPresetHints(
  current: FormValues,
  preset: PlantPreset,
): FormValues {
  const next: FormValues = { ...current };
  if (!next.commonName.trim()) next.commonName = preset.commonName;
  if (!next.scientificName.trim() && preset.scientificName) {
    next.scientificName = preset.scientificName;
  }
  if (!next.careDifficulty && preset.careDifficulty) {
    next.careDifficulty = preset.careDifficulty;
  } else if (!next.careDifficulty) {
    const inferred = inferDifficulty(preset.careSummary ?? null);
    if (inferred) next.careDifficulty = inferred;
  }
  if (!next.toxicity && preset.petToxicity) {
    next.toxicity = preset.petToxicity;
  }
  if (!next.lightPreference) {
    const inferred = inferLight(preset.light ?? null);
    if (inferred) next.lightPreference = inferred;
  }
  if (!next.wateringPreference) {
    const inferred = inferWatering(preset.water ?? null);
    if (inferred) next.wateringPreference = inferred;
  }
  if (!next.soilType.trim() && preset.soil) {
    next.soilType = preset.soil;
  }
  return next;
}

function buildInitialValues(): FormValues {
  return {
    nickname: "",
    commonName: "",
    scientificName: "",
    speciesPresetId: null,
    photoUri: null,
    roomId: null,
    shelfId: null,
    acquiredAtIso: "",
    careDifficulty: null,
    toxicity: null,
    lightPreference: null,
    wateringPreference: null,
    potType: "",
    potSize: "",
    hasDrainage: true,
    soilType: "",
    isFavorite: false,
    notes: "",
  };
}

function nullableTrim(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildPlantInput(values: FormValues): PlantInsertInput {
  const acquiredAt =
    values.acquiredAtIso.trim().length > 0
      ? parseIsoDate(values.acquiredAtIso)
      : null;

  return plantInsertSchema.parse({
    nickname: values.nickname.trim(),
    commonName: nullableTrim(values.commonName),
    scientificName: nullableTrim(values.scientificName),
    speciesPresetId: values.speciesPresetId,
    photoUri: values.photoUri,
    roomId: values.roomId,
    shelfId: values.shelfId,
    notes: nullableTrim(values.notes),
    acquiredAt,
    careDifficulty: values.careDifficulty,
    toxicity: values.toxicity,
    lightPreference: values.lightPreference,
    wateringPreference: values.wateringPreference,
    soilType: nullableTrim(values.soilType),
    potType: nullableTrim(values.potType),
    potSize: nullableTrim(values.potSize),
    hasDrainage: values.hasDrainage,
    isFavorite: values.isFavorite,
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

  const liveRooms = useLiveQuery(db.select().from(roomsTable));
  const liveShelves = useLiveQuery(db.select().from(shelvesTable));

  const rooms = useMemo(
    () => getRooms(db),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, liveRooms.data.length],
  );

  const presets = useMemo(() => getPresets(db), [db]);

  const existingPlant = useMemo(() => {
    if (mode !== "edit" || plantId === undefined) return undefined;
    return getPlantById(db, plantId);
  }, [db, mode, plantId]);

  const initialValues = useMemo<FormValues>(() => {
    if (mode === "edit" && existingPlant) {
      return {
        nickname: existingPlant.nickname,
        commonName: existingPlant.commonName ?? "",
        scientificName: existingPlant.scientificName ?? "",
        speciesPresetId: existingPlant.speciesPresetId ?? null,
        photoUri: existingPlant.photoUri ?? null,
        roomId: existingPlant.roomId ?? null,
        shelfId: existingPlant.shelfId ?? null,
        acquiredAtIso: formatIsoDate(existingPlant.acquiredAt ?? null),
        careDifficulty: existingPlant.careDifficulty ?? null,
        toxicity: existingPlant.toxicity ?? null,
        lightPreference: existingPlant.lightPreference ?? null,
        wateringPreference: existingPlant.wateringPreference ?? null,
        potType: existingPlant.potType ?? "",
        potSize: existingPlant.potSize ?? "",
        hasDrainage: existingPlant.hasDrainage ?? true,
        soilType: existingPlant.soilType ?? "",
        isFavorite: existingPlant.isFavorite,
        notes: existingPlant.notes ?? "",
      };
    }
    return buildInitialValues();
  }, [existingPlant, mode]);

  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      setSubmitting(true);
      try {
        const input = buildPlantInput(value);
        if (mode === "edit" && plantId !== undefined) {
          updatePlant(db, plantId, input);
        } else {
          createPlantWithDefaults(db, input);
        }
        router.back();
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
    const next = applyPresetHints(
      { ...currentValues, speciesPresetId: preset.id },
      preset,
    );
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
            onPress={() => router.back()}
            className="flex-1"
          >
            <Button.Label>Cancel</Button.Label>
          </Button>
          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
            })}
          >
            {({ canSubmit, isSubmitting }) => (
              <Button
                isDisabled={!canSubmit || isSubmitting || submitting}
                onPress={() => {
                  void form.handleSubmit();
                }}
                className="flex-1"
              >
                {isSubmitting || submitting ? (
                  <Spinner color="primary" />
                ) : (
                  <Button.Label>
                    {mode === "edit" ? "Save changes" : "Add plant"}
                  </Button.Label>
                )}
              </Button>
            )}
          </form.Subscribe>
        </View>
      }
    >
      <View
        className="flex-row items-center justify-between"
        style={{ paddingTop: insets.top > 0 ? 0 : 8 }}
      >
        <Pressable
          hitSlop={8}
          onPress={() => router.back()}
          className="size-9 items-center justify-center rounded-full bg-surface"
        >
          <Ionicons name="close" size={20} color={muted} />
        </Pressable>
        <Text className="font-semibold text-base text-foreground">
          {mode === "edit" ? "Edit plant" : "Add a new plant"}
        </Text>
        <View className="w-9" />
      </View>

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
              const result = plantInsertSchema.shape.nickname.safeParse(value);
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
                field.state.value !== null ? String(field.state.value) : null
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
          {(field) => {
            const trimmed = field.state.value.trim();
            const errors: string[] =
              trimmed.length > 0 && parseIsoDate(trimmed) === null
                ? ["Use the format YYYY-MM-DD."]
                : [];
            return (
              <FormTextField
                label="Acquired date"
                description="Optional. Format YYYY-MM-DD."
                placeholder="2025-04-26"
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                errors={errors}
                keyboardType="numbers-and-punctuation"
                autoCorrect={false}
                maxLength={10}
              />
            );
          }}
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

      <FormSection
        title="Where it lives"
        description="Group plants by room and shelf."
      >
        <form.Field name="roomId">
          {(field) => (
            <FormSelectField
              label="Room"
              value={
                field.state.value !== null ? String(field.state.value) : null
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
                      field.handleChange(value !== null ? Number(value) : null)
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

export type { EditPlantScreenProps };
