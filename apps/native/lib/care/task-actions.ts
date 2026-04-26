import { Alert } from "react-native";

import type { LeafCueDatabase } from "@/lib/db";
import {
  type CompleteTaskInput,
  completeTask,
  disableSchedule,
  enableSchedule,
  rescheduleTask,
  skipTaskOnce,
  snoozeTask,
  snoozeTaskByDays,
  undoCompletion,
} from "@/lib/db/repositories";
import type { CareLog, PlantTaskSchedule } from "@/lib/db/types";
import { resyncScheduleById } from "@/lib/notifications/schedule";

export type CompleteTaskSnapshot = {
  log: CareLog;
  scheduleId: number;
  previousNextDueAt: Date | null;
  previousLastCompletedAt: Date | null;
  previousSnoozedUntil: Date | null;
};

function reportError(action: string, error: unknown): void {
  const message = error instanceof Error ? error.message : "Please try again.";
  Alert.alert(`Couldn't ${action}`, message);
}

export async function performComplete(
  db: LeafCueDatabase,
  input: CompleteTaskInput,
  before: PlantTaskSchedule,
): Promise<CompleteTaskSnapshot | null> {
  try {
    const result = completeTask(db, input);
    await resyncScheduleById(db, result.schedule.id);
    return {
      log: result.log,
      scheduleId: result.schedule.id,
      previousNextDueAt: before.nextDueAt,
      previousLastCompletedAt: before.lastCompletedAt,
      previousSnoozedUntil: before.snoozedUntil,
    };
  } catch (error) {
    reportError("complete", error);
    return null;
  }
}

export async function performUndo(
  db: LeafCueDatabase,
  snapshot: CompleteTaskSnapshot,
): Promise<void> {
  try {
    undoCompletion(db, {
      logId: snapshot.log.id,
      scheduleId: snapshot.scheduleId,
      previousNextDueAt: snapshot.previousNextDueAt,
      previousLastCompletedAt: snapshot.previousLastCompletedAt,
      previousSnoozedUntil: snapshot.previousSnoozedUntil,
    });
    await resyncScheduleById(db, snapshot.scheduleId);
  } catch (error) {
    reportError("undo", error);
  }
}

export async function performSnoozeDays(
  db: LeafCueDatabase,
  scheduleId: number,
  days: number,
): Promise<void> {
  try {
    snoozeTaskByDays(db, scheduleId, days);
    await resyncScheduleById(db, scheduleId);
  } catch (error) {
    reportError("snooze", error);
  }
}

export async function performSnoozeUntil(
  db: LeafCueDatabase,
  scheduleId: number,
  until: Date,
): Promise<void> {
  try {
    snoozeTask(db, scheduleId, until);
    await resyncScheduleById(db, scheduleId);
  } catch (error) {
    reportError("snooze", error);
  }
}

export async function performReschedule(
  db: LeafCueDatabase,
  scheduleId: number,
  dueAt: Date,
): Promise<void> {
  try {
    rescheduleTask(db, scheduleId, dueAt);
    await resyncScheduleById(db, scheduleId);
  } catch (error) {
    reportError("reschedule", error);
  }
}

export async function performSkipOnce(
  db: LeafCueDatabase,
  scheduleId: number,
): Promise<void> {
  try {
    skipTaskOnce(db, scheduleId);
    await resyncScheduleById(db, scheduleId);
  } catch (error) {
    reportError("skip", error);
  }
}

export async function performToggleEnabled(
  db: LeafCueDatabase,
  scheduleId: number,
  nextEnabled: boolean,
): Promise<void> {
  try {
    if (nextEnabled) {
      enableSchedule(db, scheduleId);
    } else {
      disableSchedule(db, scheduleId);
    }
    await resyncScheduleById(db, scheduleId);
  } catch (error) {
    reportError(nextEnabled ? "enable" : "disable", error);
  }
}
