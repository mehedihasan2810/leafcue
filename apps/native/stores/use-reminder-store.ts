import { create } from "zustand";

import type { LeafCueDatabase } from "@/lib/db";
import type { ReminderSettings } from "@/lib/db/zod";
import {
  DEFAULT_REMINDER_SETTINGS,
  loadReminderSettings,
  saveReminderSettings,
  syncAllReminders,
  updateReminderSettings,
} from "@/lib/notifications";
import {
  ensureAndroidChannel,
  getPermissionStatus,
  type NotificationPermissionStatus,
  requestPermissionIfNeeded,
} from "@/lib/notifications/permissions";

type ReminderStore = {
  settings: ReminderSettings;
  permissionStatus: NotificationPermissionStatus;
  hydrated: boolean;
  hydrate: (db: LeafCueDatabase) => Promise<void>;
  refreshPermission: () => Promise<NotificationPermissionStatus>;
  setEnabled: (db: LeafCueDatabase, enabled: boolean) => Promise<boolean>;
  setReminderTime: (
    db: LeafCueDatabase,
    hour: number,
    minute: number,
  ) => Promise<void>;
  setQuietHours: (
    db: LeafCueDatabase,
    quiet: {
      enabled: boolean;
      startHour: number;
      endHour: number;
    },
  ) => Promise<void>;
  setPreviewStyle: (
    db: LeafCueDatabase,
    style: ReminderSettings["previewStyle"],
  ) => Promise<void>;
};

export const useReminderStore = create<ReminderStore>((set) => ({
  settings: DEFAULT_REMINDER_SETTINGS,
  permissionStatus: "undetermined",
  hydrated: false,

  hydrate: async (db) => {
    const settings = loadReminderSettings(db);
    const permissionStatus = await getPermissionStatus();
    set({ settings, permissionStatus, hydrated: true });
  },

  refreshPermission: async () => {
    const status = await getPermissionStatus();
    set({ permissionStatus: status });
    return status;
  },

  setEnabled: async (db, enabled) => {
    if (!enabled) {
      const next = updateReminderSettings(db, { enabled: false });
      set({ settings: next });
      await syncAllReminders(db);
      return false;
    }

    await ensureAndroidChannel();
    let permissionStatus = await getPermissionStatus();
    if (permissionStatus !== "granted") {
      permissionStatus = await requestPermissionIfNeeded();
    }
    if (permissionStatus !== "granted") {
      const next = updateReminderSettings(db, {
        enabled: false,
        permissionAsked: true,
      });
      set({ settings: next, permissionStatus });
      return false;
    }
    const next = updateReminderSettings(db, {
      enabled: true,
      permissionAsked: true,
    });
    set({ settings: next, permissionStatus });
    await syncAllReminders(db);
    return true;
  },

  setReminderTime: async (db, hour, minute) => {
    const next = updateReminderSettings(db, { hour, minute });
    set({ settings: next });
    if (next.enabled) {
      await syncAllReminders(db);
    }
  },

  setQuietHours: async (db, quiet) => {
    const next = updateReminderSettings(db, {
      quietHoursEnabled: quiet.enabled,
      quietStartHour: quiet.startHour,
      quietEndHour: quiet.endHour,
    });
    set({ settings: next });
    if (next.enabled) {
      await syncAllReminders(db);
    }
  },

  setPreviewStyle: async (db, style) => {
    const next = updateReminderSettings(db, { previewStyle: style });
    set({ settings: next });
    if (next.enabled) {
      await syncAllReminders(db);
    }
  },
}));

export function reminderEnabled(state: ReminderStore): boolean {
  return state.settings.enabled;
}

export function persistReminderSettings(
  db: LeafCueDatabase,
  settings: ReminderSettings,
): ReminderSettings {
  return saveReminderSettings(db, settings);
}
