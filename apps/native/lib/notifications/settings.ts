import type { LeafCueDatabase, LeafCueDbOrTx } from "@/lib/db";
import { getSetting, setSetting } from "@/lib/db/repositories/settings";
import {
  type ReminderSettings,
  reminderSettingsKey,
  reminderSettingsSchema,
} from "@/lib/db/zod";

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings =
  reminderSettingsSchema.parse({});

export function loadReminderSettings(db: LeafCueDbOrTx): ReminderSettings {
  const stored = getSetting(db, reminderSettingsKey, reminderSettingsSchema);
  return stored ?? DEFAULT_REMINDER_SETTINGS;
}

export function saveReminderSettings(
  db: LeafCueDatabase,
  settings: ReminderSettings,
): ReminderSettings {
  const parsed = reminderSettingsSchema.parse(settings);
  setSetting(db, reminderSettingsKey, parsed, reminderSettingsSchema);
  return parsed;
}

export function updateReminderSettings(
  db: LeafCueDatabase,
  patch: Partial<ReminderSettings>,
): ReminderSettings {
  const current = loadReminderSettings(db);
  return saveReminderSettings(db, { ...current, ...patch });
}
