import { relations } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());

const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());

export const careDifficultyValues = ["easy", "moderate", "hard"] as const;
export type CareDifficulty = (typeof careDifficultyValues)[number];

export const toxicityValues = [
  "non-toxic",
  "toxic-pets",
  "toxic-children",
  "toxic-all",
  "unknown",
] as const;
export type Toxicity = (typeof toxicityValues)[number];

export const lightPreferenceValues = [
  "low",
  "medium",
  "bright-indirect",
  "direct-sun",
] as const;
export type LightPreference = (typeof lightPreferenceValues)[number];

export const wateringPreferenceValues = [
  "low",
  "moderate",
  "high",
  "let-dry-between",
  "keep-moist",
] as const;
export type WateringPreference = (typeof wateringPreferenceValues)[number];

export const photoTypeValues = [
  "cover",
  "journal",
  "growth",
  "health",
  "other",
] as const;
export type PhotoType = (typeof photoTypeValues)[number];

export const journalEntryTypeValues = [
  "note",
  "milestone",
  "issue",
  "celebration",
] as const;
export type JournalEntryType = (typeof journalEntryTypeValues)[number];

export const healthSeverityValues = ["low", "medium", "high"] as const;
export type HealthSeverity = (typeof healthSeverityValues)[number];

export const healthStatusValues = ["open", "monitoring", "resolved"] as const;
export type HealthStatus = (typeof healthStatusValues)[number];

export const careTaskTemplateKeyValues = [
  "water",
  "fertilize",
  "mist",
  "prune",
  "repot",
  "rotate",
  "clean_leaves",
  "inspect_pests",
  "treat_pests",
  "quarantine",
  "measure_growth",
  "photo_update",
  "custom_note",
] as const;
export type CareTaskTemplateKey = (typeof careTaskTemplateKeyValues)[number];

export const plantPresets = sqliteTable(
  "plant_presets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    commonName: text("common_name").notNull(),
    scientificName: text("scientific_name"),
    careDifficulty: text("care_difficulty").$type<CareDifficulty>(),
    light: text("light"),
    water: text("water"),
    humidity: text("humidity"),
    temperature: text("temperature"),
    soil: text("soil"),
    fertilizer: text("fertilizer"),
    petToxicity: text("pet_toxicity").$type<Toxicity>(),
    careSummary: text("care_summary"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("plant_presets_common_scientific_idx").on(
      t.commonName,
      t.scientificName,
    ),
  ],
);

export const rooms = sqliteTable(
  "rooms",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    icon: text("icon"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("rooms_sort_order_idx").on(t.sortOrder)],
);

export const shelves = sqliteTable(
  "shelves",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    roomId: integer("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    icon: text("icon"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("shelves_room_id_idx").on(t.roomId),
    index("shelves_room_sort_idx").on(t.roomId, t.sortOrder),
  ],
);

export const plants = sqliteTable(
  "plants",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    nickname: text("nickname").notNull(),
    commonName: text("common_name"),
    scientificName: text("scientific_name"),
    speciesPresetId: integer("species_preset_id").references(
      () => plantPresets.id,
      { onDelete: "set null" },
    ),
    photoUri: text("photo_uri"),
    roomId: integer("room_id").references(() => rooms.id, {
      onDelete: "set null",
    }),
    shelfId: integer("shelf_id").references(() => shelves.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    acquiredAt: integer("acquired_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
    careDifficulty: text("care_difficulty").$type<CareDifficulty>(),
    toxicity: text("toxicity").$type<Toxicity>(),
    lightPreference: text("light_preference").$type<LightPreference>(),
    wateringPreference: text("watering_preference").$type<WateringPreference>(),
    soilType: text("soil_type"),
    potType: text("pot_type"),
    potSize: text("pot_size"),
    hasDrainage: integer("has_drainage", { mode: "boolean" }),
    isFavorite: integer("is_favorite", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (t) => [
    index("plants_archived_at_idx").on(t.archivedAt),
    index("plants_room_shelf_idx").on(t.roomId, t.shelfId),
    index("plants_species_preset_idx").on(t.speciesPresetId),
    index("plants_is_favorite_idx").on(t.isFavorite),
  ],
);

export const plantPhotos = sqliteTable(
  "plant_photos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    plantId: integer("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    uri: text("uri").notNull(),
    caption: text("caption"),
    takenAt: integer("taken_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    createdAt: createdAt(),
    type: text("type").$type<PhotoType>().notNull().default("journal"),
  },
  (t) => [
    index("plant_photos_plant_taken_idx").on(t.plantId, t.takenAt),
    index("plant_photos_type_idx").on(t.type),
  ],
);

export const careTaskTemplates = sqliteTable(
  "care_task_templates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    key: text("key").$type<CareTaskTemplateKey>().notNull(),
    name: text("name").notNull(),
    icon: text("icon"),
    defaultIntervalDays: integer("default_interval_days"),
    defaultInstructions: text("default_instructions"),
    colorKey: text("color_key"),
    isBuiltIn: integer("is_built_in", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (t) => [uniqueIndex("care_task_templates_key_unique").on(t.key)],
);

export const plantTaskSchedules = sqliteTable(
  "plant_task_schedules",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    plantId: integer("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    templateId: integer("template_id").references(() => careTaskTemplates.id, {
      onDelete: "set null",
    }),
    customName: text("custom_name"),
    intervalDays: integer("interval_days"),
    nextDueAt: integer("next_due_at", { mode: "timestamp_ms" }),
    lastCompletedAt: integer("last_completed_at", { mode: "timestamp_ms" }),
    snoozedUntil: integer("snoozed_until", { mode: "timestamp_ms" }),
    isEnabled: integer("is_enabled", { mode: "boolean" })
      .notNull()
      .default(true),
    instructions: text("instructions"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("plant_task_schedules_plant_due_idx").on(t.plantId, t.nextDueAt),
    index("plant_task_schedules_enabled_due_idx").on(t.isEnabled, t.nextDueAt),
    index("plant_task_schedules_template_idx").on(t.templateId),
  ],
);

export const careLogs = sqliteTable(
  "care_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    plantId: integer("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    scheduleId: integer("schedule_id").references(() => plantTaskSchedules.id, {
      onDelete: "set null",
    }),
    templateId: integer("template_id").references(() => careTaskTemplates.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull(),
    title: text("title"),
    notes: text("notes"),
    completedAt: integer("completed_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    amount: real("amount"),
    unit: text("unit"),
    createdAt: createdAt(),
  },
  (t) => [
    index("care_logs_plant_completed_idx").on(t.plantId, t.completedAt),
    index("care_logs_schedule_idx").on(t.scheduleId),
    index("care_logs_template_idx").on(t.templateId),
  ],
);

export const journalEntries = sqliteTable(
  "journal_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    plantId: integer("plant_id").references(() => plants.id, {
      onDelete: "cascade",
    }),
    title: text("title"),
    body: text("body").notNull(),
    mood: text("mood"),
    entryType: text("entry_type")
      .$type<JournalEntryType>()
      .notNull()
      .default("note"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("journal_entries_plant_created_idx").on(t.plantId, t.createdAt),
    index("journal_entries_type_idx").on(t.entryType),
  ],
);

export const growthMeasurements = sqliteTable(
  "growth_measurements",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    plantId: integer("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    measuredAt: integer("measured_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    heightCm: real("height_cm"),
    leafCount: integer("leaf_count"),
    bloomCount: integer("bloom_count"),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => [
    index("growth_measurements_plant_measured_idx").on(t.plantId, t.measuredAt),
  ],
);

export const healthObservations = sqliteTable(
  "health_observations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    plantId: integer("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    observedAt: integer("observed_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    issueType: text("issue_type").notNull(),
    severity: text("severity").$type<HealthSeverity>().notNull(),
    notes: text("notes"),
    status: text("status").$type<HealthStatus>().notNull().default("open"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("health_observations_plant_status_idx").on(t.plantId, t.status),
    index("health_observations_observed_idx").on(t.observedAt),
  ],
);

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const onboardingState = sqliteTable("onboarding_state", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const plantsRelations = relations(plants, ({ one, many }) => ({
  preset: one(plantPresets, {
    fields: [plants.speciesPresetId],
    references: [plantPresets.id],
  }),
  room: one(rooms, {
    fields: [plants.roomId],
    references: [rooms.id],
  }),
  shelf: one(shelves, {
    fields: [plants.shelfId],
    references: [shelves.id],
  }),
  photos: many(plantPhotos),
  schedules: many(plantTaskSchedules),
  careLogs: many(careLogs),
  journalEntries: many(journalEntries),
  growthMeasurements: many(growthMeasurements),
  healthObservations: many(healthObservations),
}));

export const plantPresetsRelations = relations(plantPresets, ({ many }) => ({
  plants: many(plants),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  shelves: many(shelves),
  plants: many(plants),
}));

export const shelvesRelations = relations(shelves, ({ one, many }) => ({
  room: one(rooms, {
    fields: [shelves.roomId],
    references: [rooms.id],
  }),
  plants: many(plants),
}));

export const plantPhotosRelations = relations(plantPhotos, ({ one }) => ({
  plant: one(plants, {
    fields: [plantPhotos.plantId],
    references: [plants.id],
  }),
}));

export const careTaskTemplatesRelations = relations(
  careTaskTemplates,
  ({ many }) => ({
    schedules: many(plantTaskSchedules),
    logs: many(careLogs),
  }),
);

export const plantTaskSchedulesRelations = relations(
  plantTaskSchedules,
  ({ one, many }) => ({
    plant: one(plants, {
      fields: [plantTaskSchedules.plantId],
      references: [plants.id],
    }),
    template: one(careTaskTemplates, {
      fields: [plantTaskSchedules.templateId],
      references: [careTaskTemplates.id],
    }),
    logs: many(careLogs),
  }),
);

export const careLogsRelations = relations(careLogs, ({ one }) => ({
  plant: one(plants, {
    fields: [careLogs.plantId],
    references: [plants.id],
  }),
  schedule: one(plantTaskSchedules, {
    fields: [careLogs.scheduleId],
    references: [plantTaskSchedules.id],
  }),
  template: one(careTaskTemplates, {
    fields: [careLogs.templateId],
    references: [careTaskTemplates.id],
  }),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  plant: one(plants, {
    fields: [journalEntries.plantId],
    references: [plants.id],
  }),
}));

export const growthMeasurementsRelations = relations(
  growthMeasurements,
  ({ one }) => ({
    plant: one(plants, {
      fields: [growthMeasurements.plantId],
      references: [plants.id],
    }),
  }),
);

export const healthObservationsRelations = relations(
  healthObservations,
  ({ one }) => ({
    plant: one(plants, {
      fields: [healthObservations.plantId],
      references: [plants.id],
    }),
  }),
);
