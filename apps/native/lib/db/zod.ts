import { z } from "zod";

import {
  MAX_BACKUP_PHOTO_BASE64_CHARS,
  MAX_BACKUP_TABLE_ROWS,
} from "@/lib/backup/limits";
import {
  careDifficultyValues,
  careTaskTemplateKeyValues,
  healthIssueTypeValues,
  healthSeverityValues,
  healthStatusValues,
  hemisphereValues,
  journalEntryTypeValues,
  lightPreferenceValues,
  photoTypeValues,
  toxicityValues,
  wateringPreferenceValues,
  windowOrientationValues,
} from "@/lib/db/schema";

export const idSchema = z.number().int().positive();
export const dateSchema = z.date();
export const optionalDateSchema = z.date().nullable().optional();

export const careDifficultySchema = z.enum(careDifficultyValues);
export const toxicitySchema = z.enum(toxicityValues);
export const lightPreferenceSchema = z.enum(lightPreferenceValues);
export const wateringPreferenceSchema = z.enum(wateringPreferenceValues);
export const windowOrientationSchema = z.enum(windowOrientationValues);
export const hemisphereSchema = z.enum(hemisphereValues);
export const photoTypeSchema = z.enum(photoTypeValues);
export const journalEntryTypeSchema = z.enum(journalEntryTypeValues);
export const healthSeveritySchema = z.enum(healthSeverityValues);
export const healthStatusSchema = z.enum(healthStatusValues);
export const healthIssueTypeSchema = z.enum(healthIssueTypeValues);
export const careTaskTemplateKeySchema = z.enum(careTaskTemplateKeyValues);

const trimmedString = (max: number) => z.string().trim().min(1).max(max);
const optionalString = (max: number) => z.string().trim().max(max);
const localPhotoUriSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => value.startsWith("file://") || value.startsWith("content://"),
    { message: "Photo URI must be a local file." },
  );

export const plantInsertSchema = z.object({
  nickname: trimmedString(120),
  commonName: z.string().trim().max(120).nullable().optional(),
  scientificName: z.string().trim().max(160).nullable().optional(),
  speciesPresetId: idSchema.nullable().optional(),
  photoUri: z.string().trim().max(2048).nullable().optional(),
  roomId: idSchema.nullable().optional(),
  shelfId: idSchema.nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
  acquiredAt: optionalDateSchema,
  careDifficulty: careDifficultySchema.nullable().optional(),
  toxicity: toxicitySchema.nullable().optional(),
  lightPreference: lightPreferenceSchema.nullable().optional(),
  wateringPreference: wateringPreferenceSchema.nullable().optional(),
  soilType: z.string().trim().max(120).nullable().optional(),
  potType: z.string().trim().max(120).nullable().optional(),
  potSize: z.string().trim().max(60).nullable().optional(),
  hasDrainage: z.boolean().nullable().optional(),
  directSunHours: z.number().int().min(0).max(24).nullable().optional(),
  windowDistanceCm: z.number().int().min(0).max(1000).nullable().optional(),
  windowOrientation: windowOrientationSchema.nullable().optional(),
  isFavorite: z.boolean().optional(),
});
export type PlantInsertInput = z.infer<typeof plantInsertSchema>;

export const plantUpdateSchema = plantInsertSchema.partial();
export type PlantUpdateInput = z.infer<typeof plantUpdateSchema>;

export const plantPhotoInsertSchema = z.object({
  plantId: idSchema,
  uri: z.string().trim().min(1).max(2048),
  caption: z.string().max(500).nullable().optional(),
  takenAt: optionalDateSchema,
  type: photoTypeSchema.optional(),
});
export type PlantPhotoInsertInput = z.infer<typeof plantPhotoInsertSchema>;

export const roomInsertSchema = z.object({
  name: trimmedString(80),
  icon: z.string().max(60).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export type RoomInsertInput = z.infer<typeof roomInsertSchema>;

export const shelfInsertSchema = z.object({
  roomId: idSchema,
  name: trimmedString(80),
  icon: z.string().max(60).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export type ShelfInsertInput = z.infer<typeof shelfInsertSchema>;

export const careTaskTemplateInsertSchema = z.object({
  key: careTaskTemplateKeySchema,
  name: trimmedString(60),
  icon: z.string().max(60).nullable().optional(),
  defaultIntervalDays: z.number().int().positive().nullable().optional(),
  defaultInstructions: z.string().max(2000).nullable().optional(),
  colorKey: z.string().max(40).nullable().optional(),
  isBuiltIn: z.boolean().optional(),
});
export type CareTaskTemplateInsertInput = z.infer<
  typeof careTaskTemplateInsertSchema
>;

const hourSchema = z.number().int().min(0).max(23);
const minuteSchema = z.number().int().min(0).max(59);

export const plantTaskScheduleInsertSchema = z.object({
  plantId: idSchema,
  templateId: idSchema.nullable().optional(),
  customName: z.string().max(80).nullable().optional(),
  intervalDays: z.number().int().positive().nullable().optional(),
  nextDueAt: optionalDateSchema,
  lastCompletedAt: optionalDateSchema,
  snoozedUntil: optionalDateSchema,
  isEnabled: z.boolean().optional(),
  instructions: z.string().max(2000).nullable().optional(),
  notificationId: z.string().max(200).nullable().optional(),
  preferredHour: hourSchema.nullable().optional(),
  preferredMinute: minuteSchema.nullable().optional(),
});
export type PlantTaskScheduleInsertInput = z.infer<
  typeof plantTaskScheduleInsertSchema
>;

export const careLogInsertSchema = z.object({
  plantId: idSchema,
  scheduleId: idSchema.nullable().optional(),
  templateId: idSchema.nullable().optional(),
  type: trimmedString(40),
  title: z.string().max(120).nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
  completedAt: optionalDateSchema,
  amount: z.number().nullable().optional(),
  unit: z.string().max(20).nullable().optional(),
});
export type CareLogInsertInput = z.infer<typeof careLogInsertSchema>;

export const journalEntryInsertSchema = z.object({
  plantId: idSchema.nullable().optional(),
  title: z.string().max(120).nullable().optional(),
  body: trimmedString(8000),
  mood: z.string().max(40).nullable().optional(),
  entryType: journalEntryTypeSchema.optional(),
  photoUri: z.string().trim().max(2048).nullable().optional(),
});
export type JournalEntryInsertInput = z.infer<typeof journalEntryInsertSchema>;

export const growthMeasurementInsertSchema = z
  .object({
    plantId: idSchema,
    measuredAt: optionalDateSchema,
    heightCm: z.number().positive().nullable().optional(),
    leafCount: z.number().int().min(0).nullable().optional(),
    bloomCount: z.number().int().min(0).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .refine(
    (input) =>
      input.heightCm !== null && input.heightCm !== undefined
        ? true
        : input.leafCount !== null && input.leafCount !== undefined
          ? true
          : input.bloomCount !== null && input.bloomCount !== undefined
            ? true
            : Boolean(input.notes),
    { message: "Provide at least one measurement value or note." },
  );
export type GrowthMeasurementInsertInput = z.infer<
  typeof growthMeasurementInsertSchema
>;

export const healthObservationInsertSchema = z.object({
  plantId: idSchema,
  observedAt: optionalDateSchema,
  issueType: trimmedString(60),
  severity: healthSeveritySchema,
  notes: z.string().max(2000).nullable().optional(),
  status: healthStatusSchema.optional(),
});
export type HealthObservationInsertInput = z.infer<
  typeof healthObservationInsertSchema
>;

export const plantPresetInsertSchema = z.object({
  commonName: trimmedString(120),
  scientificName: z.string().trim().max(160).nullable().optional(),
  careDifficulty: careDifficultySchema.nullable().optional(),
  light: z.string().max(120).nullable().optional(),
  water: z.string().max(200).nullable().optional(),
  humidity: z.string().max(80).nullable().optional(),
  temperature: z.string().max(80).nullable().optional(),
  soil: z.string().max(160).nullable().optional(),
  fertilizer: z.string().max(160).nullable().optional(),
  petToxicity: toxicitySchema.nullable().optional(),
  careSummary: z.string().max(2000).nullable().optional(),
});
export type PlantPresetInsertInput = z.infer<typeof plantPresetInsertSchema>;

export const settingsKeySchema = z.string().min(1).max(80);

const backupDateSchema = z
  .union([z.string().datetime(), z.number().finite(), z.date()])
  .nullable()
  .optional();
const backupIdSchema = idSchema.optional();
const nullableBackupIdSchema = idSchema.nullable().optional();
const backupNumberSchema = z.number().finite().nullable().optional();
const backupIntegerSchema = z.number().int().nullable().optional();
const backupBooleanSchema = z
  .union([
    z.boolean(),
    z
      .number()
      .int()
      .min(0)
      .max(1)
      .transform((value) => value === 1),
  ])
  .nullable()
  .optional();
const backupRows = <TSchema extends z.ZodTypeAny>(schema: TSchema) =>
  z.array(schema).max(MAX_BACKUP_TABLE_ROWS);

const backupPlantPresetRowSchema = z.object({
  id: backupIdSchema,
  commonName: trimmedString(120),
  scientificName: optionalString(160).nullable().optional(),
  careDifficulty: careDifficultySchema.nullable().optional(),
  light: optionalString(120).nullable().optional(),
  water: optionalString(200).nullable().optional(),
  humidity: optionalString(80).nullable().optional(),
  temperature: optionalString(80).nullable().optional(),
  soil: optionalString(160).nullable().optional(),
  fertilizer: optionalString(160).nullable().optional(),
  petToxicity: toxicitySchema.nullable().optional(),
  careSummary: z.string().max(2000).nullable().optional(),
  createdAt: backupDateSchema,
});

const backupRoomRowSchema = z.object({
  id: backupIdSchema,
  name: trimmedString(80),
  icon: z.string().max(60).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  createdAt: backupDateSchema,
  updatedAt: backupDateSchema,
});

const backupShelfRowSchema = z.object({
  id: backupIdSchema,
  roomId: idSchema,
  name: trimmedString(80),
  icon: z.string().max(60).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  createdAt: backupDateSchema,
  updatedAt: backupDateSchema,
});

const backupPlantRowSchema = z.object({
  id: backupIdSchema,
  nickname: trimmedString(120),
  commonName: optionalString(120).nullable().optional(),
  scientificName: optionalString(160).nullable().optional(),
  speciesPresetId: nullableBackupIdSchema,
  photoUri: localPhotoUriSchema.nullable().optional(),
  roomId: nullableBackupIdSchema,
  shelfId: nullableBackupIdSchema,
  notes: z.string().max(4000).nullable().optional(),
  acquiredAt: backupDateSchema,
  createdAt: backupDateSchema,
  updatedAt: backupDateSchema,
  archivedAt: backupDateSchema,
  careDifficulty: careDifficultySchema.nullable().optional(),
  toxicity: toxicitySchema.nullable().optional(),
  lightPreference: lightPreferenceSchema.nullable().optional(),
  wateringPreference: wateringPreferenceSchema.nullable().optional(),
  soilType: optionalString(120).nullable().optional(),
  potType: optionalString(120).nullable().optional(),
  potSize: optionalString(60).nullable().optional(),
  hasDrainage: backupBooleanSchema,
  directSunHours: backupIntegerSchema,
  windowDistanceCm: backupIntegerSchema,
  windowOrientation: windowOrientationSchema.nullable().optional(),
  isFavorite: backupBooleanSchema,
});

const backupPlantPhotoRowSchema = z.object({
  id: backupIdSchema,
  plantId: idSchema,
  uri: localPhotoUriSchema,
  caption: z.string().max(500).nullable().optional(),
  takenAt: backupDateSchema,
  createdAt: backupDateSchema,
  type: photoTypeSchema.optional(),
});

const backupCareTaskTemplateRowSchema = z.object({
  id: backupIdSchema,
  key: careTaskTemplateKeySchema,
  name: trimmedString(60),
  icon: z.string().max(60).nullable().optional(),
  defaultIntervalDays: z.number().int().positive().nullable().optional(),
  defaultInstructions: z.string().max(2000).nullable().optional(),
  colorKey: z.string().max(40).nullable().optional(),
  isBuiltIn: backupBooleanSchema,
});

const backupPlantTaskScheduleRowSchema = z.object({
  id: backupIdSchema,
  plantId: idSchema,
  templateId: nullableBackupIdSchema,
  customName: z.string().max(80).nullable().optional(),
  intervalDays: z.number().int().positive().nullable().optional(),
  nextDueAt: backupDateSchema,
  lastCompletedAt: backupDateSchema,
  snoozedUntil: backupDateSchema,
  isEnabled: backupBooleanSchema,
  instructions: z.string().max(2000).nullable().optional(),
  notificationId: z.string().max(200).nullable().optional(),
  preferredHour: hourSchema.nullable().optional(),
  preferredMinute: minuteSchema.nullable().optional(),
  createdAt: backupDateSchema,
  updatedAt: backupDateSchema,
});

const backupCareLogRowSchema = z.object({
  id: backupIdSchema,
  plantId: idSchema,
  scheduleId: nullableBackupIdSchema,
  templateId: nullableBackupIdSchema,
  type: trimmedString(40),
  title: z.string().max(120).nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
  completedAt: backupDateSchema,
  amount: backupNumberSchema,
  unit: z.string().max(20).nullable().optional(),
  createdAt: backupDateSchema,
});

const backupJournalEntryRowSchema = z.object({
  id: backupIdSchema,
  plantId: nullableBackupIdSchema,
  title: z.string().max(120).nullable().optional(),
  body: trimmedString(8000),
  mood: z.string().max(40).nullable().optional(),
  entryType: journalEntryTypeSchema.optional(),
  photoUri: localPhotoUriSchema.nullable().optional(),
  createdAt: backupDateSchema,
  updatedAt: backupDateSchema,
});

const backupGrowthMeasurementRowSchema = z.object({
  id: backupIdSchema,
  plantId: idSchema,
  measuredAt: backupDateSchema,
  heightCm: backupNumberSchema,
  leafCount: backupIntegerSchema,
  bloomCount: backupIntegerSchema,
  notes: z.string().max(2000).nullable().optional(),
  createdAt: backupDateSchema,
});

const backupHealthObservationRowSchema = z.object({
  id: backupIdSchema,
  plantId: idSchema,
  observedAt: backupDateSchema,
  issueType: trimmedString(60),
  severity: healthSeveritySchema,
  notes: z.string().max(2000).nullable().optional(),
  status: healthStatusSchema.optional(),
  createdAt: backupDateSchema,
  updatedAt: backupDateSchema,
});

export const backupTablesSchema = z.object({
  plantPresets: backupRows(backupPlantPresetRowSchema),
  rooms: backupRows(backupRoomRowSchema),
  shelves: backupRows(backupShelfRowSchema),
  plants: backupRows(backupPlantRowSchema),
  plantPhotos: backupRows(backupPlantPhotoRowSchema),
  careTaskTemplates: backupRows(backupCareTaskTemplateRowSchema),
  plantTaskSchedules: backupRows(backupPlantTaskScheduleRowSchema),
  careLogs: backupRows(backupCareLogRowSchema),
  journalEntries: backupRows(backupJournalEntryRowSchema),
  growthMeasurements: backupRows(backupGrowthMeasurementRowSchema),
  healthObservations: backupRows(backupHealthObservationRowSchema),
});
export type BackupTables = z.infer<typeof backupTablesSchema>;

const jsonStringSchema = z
  .string()
  .max(20_000)
  .refine((value) => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }, "Value must be valid JSON.");

export const backupSettingsRowSchema = z.object({
  key: settingsKeySchema,
  value: jsonStringSchema,
  updatedAt: z.string().datetime().optional(),
});
export type BackupSettingsRow = z.infer<typeof backupSettingsRowSchema>;

export const backupMetadataSchema = z.object({
  appVersion: z.string().max(80).optional(),
  platform: z.string().max(40).optional(),
  deviceLabel: z.string().max(120).optional(),
});
export type BackupMetadata = z.infer<typeof backupMetadataSchema>;

const backupPhotoFilenameSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9._-]+$/)
  .refine((filename) => {
    const extension = filename.split(".").pop()?.toLowerCase();
    return (
      extension === "jpg" ||
      extension === "jpeg" ||
      extension === "png" ||
      extension === "gif" ||
      extension === "webp" ||
      extension === "heic" ||
      extension === "heif"
    );
  }, "Photo filename must use a supported image extension.");

const backupPhotoMimeTypeSchema = z.enum([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const base64Schema = z
  .string()
  .min(1)
  .max(MAX_BACKUP_PHOTO_BASE64_CHARS)
  .regex(/^[A-Za-z0-9+/]*={0,2}$/)
  .refine((value) => value.length % 4 === 0, "Invalid base64 encoding.");

export const backupPhotoFileSchema = z.object({
  path: localPhotoUriSchema,
  filename: backupPhotoFilenameSchema,
  mimeType: backupPhotoMimeTypeSchema,
  data: base64Schema,
});
export type BackupPhotoFile = z.infer<typeof backupPhotoFileSchema>;

const backupPhotoFilesSchema = z
  .record(localPhotoUriSchema, backupPhotoFileSchema)
  .refine(
    (files) => Object.keys(files).length <= MAX_BACKUP_TABLE_ROWS,
    "Backup includes too many photo files.",
  );

export const backupPayloadSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]),
  exportedAt: z.string().datetime(),
  metadata: backupMetadataSchema.default({}),
  tables: backupTablesSchema,
  settings: z.array(backupSettingsRowSchema).max(MAX_BACKUP_TABLE_ROWS),
  onboardingState: z.array(backupSettingsRowSchema).max(MAX_BACKUP_TABLE_ROWS),
  /**
   * Base64-encoded photo files bundled with the export.
   * Keyed by the URI path stored in the database.
   */
  photoFiles: backupPhotoFilesSchema.optional(),
});
export type BackupPayload = z.infer<typeof backupPayloadSchema>;

/** @deprecated Only version 2 payloads bundle photos. */
export type BackupPayloadV1 = BackupPayload & { version: 1 };
export type BackupPayloadV2 = BackupPayload & { version: 2 };

export const plantRouteParamsSchema = z.object({
  plantId: z.coerce.number().int().positive(),
});
export type PlantRouteParams = z.infer<typeof plantRouteParamsSchema>;

export const taskFilterValues = [
  "today",
  "overdue",
  "upcoming",
  "completed",
  "all",
] as const;
export type TaskFilter = (typeof taskFilterValues)[number];
export const taskFilterSchema = z.enum(taskFilterValues);

export const tasksRouteParamsSchema = z.object({
  filter: taskFilterSchema.optional(),
});
export type TasksRouteParams = z.infer<typeof tasksRouteParamsSchema>;

export const notificationPreviewStyleValues = ["detailed", "discreet"] as const;
export type NotificationPreviewStyle =
  (typeof notificationPreviewStyleValues)[number];
export const notificationPreviewStyleSchema = z.enum(
  notificationPreviewStyleValues,
);

export const reminderSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  hour: hourSchema.default(9),
  minute: minuteSchema.default(0),
  quietHoursEnabled: z.boolean().default(false),
  quietStartHour: hourSchema.default(22),
  quietEndHour: hourSchema.default(7),
  previewStyle: notificationPreviewStyleSchema.default("detailed"),
  permissionAsked: z.boolean().default(false),
});
export type ReminderSettings = z.infer<typeof reminderSettingsSchema>;

export const reminderSettingsKey = "reminders.main" as const;

export const onboardingValueSchema = z.object({
  completed: z.boolean(),
  completedAt: z.string().datetime().optional(),
});
export type OnboardingValue = z.infer<typeof onboardingValueSchema>;

export const onboardingExperienceValues = ["new", "some", "expert"] as const;
export type OnboardingExperience = (typeof onboardingExperienceValues)[number];

export const onboardingLightValues = ["low", "medium", "bright"] as const;
export type OnboardingLight = (typeof onboardingLightValues)[number];

/**
 * Lightweight personalization captured during onboarding. Drives the first
 * plant's defaults (light + care style) and the "your plan is ready" reveal.
 */
export const onboardingProfileSchema = z.object({
  experience: z.enum(onboardingExperienceValues).nullable().default(null),
  homeLight: z.enum(onboardingLightValues).nullable().default(null),
  goals: z.array(z.string().max(40)).max(12).default([]),
  completedActivation: z.boolean().default(false),
});
export type OnboardingProfile = z.infer<typeof onboardingProfileSchema>;

export const onboardingKeys = {
  MAIN: "onboarding.main",
  PROFILE: "onboarding.profile",
} as const;

export const appearanceModeValues = ["system", "light", "dark"] as const;
export type AppearanceMode = (typeof appearanceModeValues)[number];
export const appearanceModeSchema = z.enum(appearanceModeValues);

export const appearanceSettingsSchema = z.object({
  mode: appearanceModeSchema.default("system"),
});
export type AppearanceSettings = z.infer<typeof appearanceSettingsSchema>;
export const appearanceSettingsKey = "appearance.main" as const;

export const weekStartDayValues = ["sunday", "monday", "saturday"] as const;
export type WeekStartDay = (typeof weekStartDayValues)[number];
export const weekStartDaySchema = z.enum(weekStartDayValues);

export const measurementUnitValues = ["metric", "imperial"] as const;
export type MeasurementUnits = (typeof measurementUnitValues)[number];
export const measurementUnitsSchema = z.enum(measurementUnitValues);

export const appPreferencesSchema = z.object({
  weekStartDay: weekStartDaySchema.default("monday"),
  units: measurementUnitsSchema.default("metric"),
  hemisphere: hemisphereSchema.default("north"),
  /** Opt-in to photo identification (the only feature that leaves the device). */
  identifyEnabled: z.boolean().default(false),
});
export type AppPreferences = z.infer<typeof appPreferencesSchema>;
export const appPreferencesKey = "app.preferences" as const;

export const plantDefaultsSchema = z.object({
  waterIntervalDays: z
    .number()
    .int()
    .positive()
    .max(365)
    .nullable()
    .default(null),
  fertilizeIntervalDays: z
    .number()
    .int()
    .positive()
    .max(365)
    .nullable()
    .default(null),
  mistIntervalDays: z
    .number()
    .int()
    .positive()
    .max(365)
    .nullable()
    .default(null),
});
export type PlantDefaults = z.infer<typeof plantDefaultsSchema>;
export const plantDefaultsKey = "plant.defaults" as const;
