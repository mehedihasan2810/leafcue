import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import type {
  appSettings,
  careLogs,
  careTaskTemplates,
  growthMeasurements,
  healthObservations,
  journalEntries,
  onboardingState,
  plantPhotos,
  plantPresets,
  plantTaskSchedules,
  plants,
  rooms,
  shelves,
} from "@/lib/db/schema";

export type Plant = InferSelectModel<typeof plants>;
export type NewPlant = InferInsertModel<typeof plants>;

export type PlantPhoto = InferSelectModel<typeof plantPhotos>;
export type NewPlantPhoto = InferInsertModel<typeof plantPhotos>;

export type Room = InferSelectModel<typeof rooms>;
export type NewRoom = InferInsertModel<typeof rooms>;

export type Shelf = InferSelectModel<typeof shelves>;
export type NewShelf = InferInsertModel<typeof shelves>;

export type CareTaskTemplate = InferSelectModel<typeof careTaskTemplates>;
export type NewCareTaskTemplate = InferInsertModel<typeof careTaskTemplates>;

export type PlantTaskSchedule = InferSelectModel<typeof plantTaskSchedules>;
export type NewPlantTaskSchedule = InferInsertModel<typeof plantTaskSchedules>;

export type CareLog = InferSelectModel<typeof careLogs>;
export type NewCareLog = InferInsertModel<typeof careLogs>;

export type JournalEntry = InferSelectModel<typeof journalEntries>;
export type NewJournalEntry = InferInsertModel<typeof journalEntries>;

export type GrowthMeasurement = InferSelectModel<typeof growthMeasurements>;
export type NewGrowthMeasurement = InferInsertModel<typeof growthMeasurements>;

export type HealthObservation = InferSelectModel<typeof healthObservations>;
export type NewHealthObservation = InferInsertModel<typeof healthObservations>;

export type PlantPreset = InferSelectModel<typeof plantPresets>;
export type NewPlantPreset = InferInsertModel<typeof plantPresets>;

export type AppSetting = InferSelectModel<typeof appSettings>;
export type NewAppSetting = InferInsertModel<typeof appSettings>;

export type OnboardingStateRow = InferSelectModel<typeof onboardingState>;
export type NewOnboardingStateRow = InferInsertModel<typeof onboardingState>;
