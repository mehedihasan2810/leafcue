import type { LeafCueDatabase, LeafCueDbOrTx } from "@/lib/db";
import { getSetting, setSetting } from "@/lib/db/repositories/settings";
import {
  type AppearanceSettings,
  type AppPreferences,
  appearanceSettingsKey,
  appearanceSettingsSchema,
  appPreferencesKey,
  appPreferencesSchema,
  type PlantDefaults,
  plantDefaultsKey,
  plantDefaultsSchema,
} from "@/lib/db/zod";

export const DEFAULT_APPEARANCE: AppearanceSettings =
  appearanceSettingsSchema.parse({});
export const DEFAULT_APP_PREFERENCES: AppPreferences =
  appPreferencesSchema.parse({});
export const DEFAULT_PLANT_DEFAULTS: PlantDefaults = plantDefaultsSchema.parse(
  {},
);

export function loadAppearance(db: LeafCueDbOrTx): AppearanceSettings {
  return (
    getSetting(db, appearanceSettingsKey, appearanceSettingsSchema) ??
    DEFAULT_APPEARANCE
  );
}

export function saveAppearance(
  db: LeafCueDatabase,
  value: AppearanceSettings,
): AppearanceSettings {
  const parsed = appearanceSettingsSchema.parse(value);
  setSetting(db, appearanceSettingsKey, parsed, appearanceSettingsSchema);
  return parsed;
}

export function loadAppPreferences(db: LeafCueDbOrTx): AppPreferences {
  return (
    getSetting(db, appPreferencesKey, appPreferencesSchema) ??
    DEFAULT_APP_PREFERENCES
  );
}

export function saveAppPreferences(
  db: LeafCueDatabase,
  value: AppPreferences,
): AppPreferences {
  const parsed = appPreferencesSchema.parse(value);
  setSetting(db, appPreferencesKey, parsed, appPreferencesSchema);
  return parsed;
}

export function updateAppPreferences(
  db: LeafCueDatabase,
  patch: Partial<AppPreferences>,
): AppPreferences {
  return saveAppPreferences(db, { ...loadAppPreferences(db), ...patch });
}

export function loadPlantDefaults(db: LeafCueDbOrTx): PlantDefaults {
  return (
    getSetting(db, plantDefaultsKey, plantDefaultsSchema) ??
    DEFAULT_PLANT_DEFAULTS
  );
}

export function savePlantDefaults(
  db: LeafCueDatabase,
  value: PlantDefaults,
): PlantDefaults {
  const parsed = plantDefaultsSchema.parse(value);
  setSetting(db, plantDefaultsKey, parsed, plantDefaultsSchema);
  return parsed;
}

export function updatePlantDefaults(
  db: LeafCueDatabase,
  patch: Partial<PlantDefaults>,
): PlantDefaults {
  return savePlantDefaults(db, { ...loadPlantDefaults(db), ...patch });
}
