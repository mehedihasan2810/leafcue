import { z } from "zod";

import {
  careDifficultyValues,
  careTaskTemplateKeyValues,
  healthSeverityValues,
  healthStatusValues,
  journalEntryTypeValues,
  lightPreferenceValues,
  photoTypeValues,
  toxicityValues,
  wateringPreferenceValues,
} from "@/lib/db/schema";

export const idSchema = z.number().int().positive();
export const dateSchema = z.date();
export const optionalDateSchema = z.date().nullable().optional();

export const careDifficultySchema = z.enum(careDifficultyValues);
export const toxicitySchema = z.enum(toxicityValues);
export const lightPreferenceSchema = z.enum(lightPreferenceValues);
export const wateringPreferenceSchema = z.enum(wateringPreferenceValues);
export const photoTypeSchema = z.enum(photoTypeValues);
export const journalEntryTypeSchema = z.enum(journalEntryTypeValues);
export const healthSeveritySchema = z.enum(healthSeverityValues);
export const healthStatusSchema = z.enum(healthStatusValues);
export const careTaskTemplateKeySchema = z.enum(careTaskTemplateKeyValues);

const trimmedString = (max: number) => z.string().trim().min(1).max(max);

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

export const exportPayloadSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  plants: z.array(z.unknown()),
  plantPhotos: z.array(z.unknown()),
  rooms: z.array(z.unknown()),
  shelves: z.array(z.unknown()),
  careTaskTemplates: z.array(z.unknown()),
  plantTaskSchedules: z.array(z.unknown()),
  careLogs: z.array(z.unknown()),
  journalEntries: z.array(z.unknown()),
  growthMeasurements: z.array(z.unknown()),
  healthObservations: z.array(z.unknown()),
  plantPresets: z.array(z.unknown()),
  appSettings: z.array(z.unknown()),
  onboardingState: z.array(z.unknown()),
});
export type ExportPayload = z.infer<typeof exportPayloadSchema>;

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

export const onboardingKeys = {
  MAIN: "onboarding.main",
} as const;
