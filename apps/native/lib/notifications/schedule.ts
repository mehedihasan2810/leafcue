import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { resolveReminderTime } from "@/lib/care/scheduling";
import type { LeafCueDatabase } from "@/lib/db";
import {
  getAllActiveScheduleRows,
  getScheduleById,
  setScheduleNotificationId,
} from "@/lib/db/repositories/tasks";
import type {
  CareTaskTemplate,
  Plant,
  PlantTaskSchedule,
} from "@/lib/db/types";
import type { ReminderSettings } from "@/lib/db/zod";
import {
  careReminderChannelId,
  ensureAndroidChannel,
  getPermissionStatus,
} from "@/lib/notifications/permissions";
import { loadReminderSettings } from "@/lib/notifications/settings";

const NOTIFICATION_DATA_KEY = "leafcue.scheduleId";

export type ScheduleReminderArgs = {
  schedule: PlantTaskSchedule;
  plant: Plant;
  template: CareTaskTemplate | null;
  settings: ReminderSettings;
  now?: Date;
};

function buildContent(
  args: ScheduleReminderArgs,
): Notifications.NotificationContentInput {
  const { schedule, plant, template, settings } = args;
  const taskName = schedule.customName ?? template?.name ?? "Care cue";
  const detailed = settings.previewStyle === "detailed";
  const data: Record<string, unknown> = {
    [NOTIFICATION_DATA_KEY]: schedule.id,
    plantId: plant.id,
  };
  if (detailed) {
    return {
      title: `${taskName} — ${plant.nickname}`,
      body: schedule.instructions ?? "Tap to log care.",
      data,
      ...(Platform.OS === "android"
        ? { channelId: careReminderChannelId }
        : {}),
    };
  }
  return {
    title: "Plant care reminder",
    body: "Open LeafCue to see what needs care.",
    data,
    ...(Platform.OS === "android" ? { channelId: careReminderChannelId } : {}),
  };
}

async function cancelExistingReminder(
  schedule: PlantTaskSchedule,
): Promise<void> {
  if (!schedule.notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(
      schedule.notificationId,
    );
  } catch {}
}

/**
 * Cancel any pending OS notification for the given schedule and clear the
 * stored identifier in the database. Safe to call when nothing is pending.
 */
export async function cancelScheduleReminder(
  db: LeafCueDatabase,
  scheduleId: number,
): Promise<void> {
  const schedule = getScheduleById(db, scheduleId);
  if (!schedule) return;
  await cancelExistingReminder(schedule);
  if (schedule.notificationId) {
    setScheduleNotificationId(db, scheduleId, null);
  }
}

/**
 * Schedule (or reschedule) a single OS notification for a schedule. The
 * notificationId is persisted on the row so we can cancel later. Skips when
 * reminders are disabled, permission isn't granted, or the schedule has no
 * future due date.
 */
export async function scheduleScheduleReminder(
  db: LeafCueDatabase,
  args: ScheduleReminderArgs,
): Promise<string | null> {
  const { schedule, plant, settings } = args;
  const now = args.now ?? new Date();

  await cancelExistingReminder(schedule);

  if (!settings.enabled || !schedule.isEnabled || plant.archivedAt) {
    setScheduleNotificationId(db, schedule.id, null);
    return null;
  }
  if (!schedule.nextDueAt) {
    setScheduleNotificationId(db, schedule.id, null);
    return null;
  }

  const permission = await getPermissionStatus();
  if (permission !== "granted") {
    setScheduleNotificationId(db, schedule.id, null);
    return null;
  }

  await ensureAndroidChannel();

  const hour = schedule.preferredHour ?? settings.hour;
  const minute = schedule.preferredMinute ?? settings.minute;

  const { scheduledAt } = resolveReminderTime(
    schedule.nextDueAt,
    hour,
    minute,
    {
      enabled: settings.quietHoursEnabled,
      startHour: settings.quietStartHour,
      endHour: settings.quietEndHour,
    },
    now,
  );

  if (scheduledAt.getTime() <= now.getTime() + 60 * 1000) {
    setScheduleNotificationId(db, schedule.id, null);
    return null;
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: buildContent(args),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: scheduledAt,
    },
  });
  setScheduleNotificationId(db, schedule.id, identifier);
  return identifier;
}

/**
 * Cancel every pending LeafCue notification and clear database identifiers.
 */
export async function cancelAllReminders(db: LeafCueDatabase): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  const rows = getAllActiveScheduleRows(db);
  for (const row of rows) {
    if (row.schedule.notificationId) {
      setScheduleNotificationId(db, row.schedule.id, null);
    }
  }
}

/**
 * Sync OS notifications with the current set of active schedules. Cancels
 * everything first then schedules each enabled, future-due task. Cheap enough
 * to call after writes that change schedule timing.
 */
export async function syncAllReminders(db: LeafCueDatabase): Promise<void> {
  const settings = loadReminderSettings(db);

  if (!settings.enabled) {
    await cancelAllReminders(db);
    return;
  }

  const permission = await getPermissionStatus();
  if (permission !== "granted") {
    await cancelAllReminders(db);
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  const rows = getAllActiveScheduleRows(db);
  for (const row of rows) {
    await scheduleScheduleReminder(db, {
      schedule: row.schedule,
      plant: row.plant,
      template: row.template,
      settings,
    });
  }
}

/**
 * Convenience: re-sync a single schedule by id. Cheaper than syncAllReminders
 * after one task action.
 */
export async function resyncScheduleById(
  db: LeafCueDatabase,
  scheduleId: number,
): Promise<void> {
  const settings = loadReminderSettings(db);
  if (!settings.enabled) {
    await cancelScheduleReminder(db, scheduleId);
    return;
  }
  const fresh = getScheduleById(db, scheduleId);
  if (!fresh) return;
  const rows = getAllActiveScheduleRows(db);
  const row = rows.find((entry) => entry.schedule.id === scheduleId);
  if (!row) {
    await cancelScheduleReminder(db, scheduleId);
    return;
  }
  await scheduleScheduleReminder(db, {
    schedule: fresh,
    plant: row.plant,
    template: row.template,
    settings,
  });
}
