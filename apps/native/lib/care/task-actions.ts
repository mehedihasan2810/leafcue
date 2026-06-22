import { Alert } from "react-native";

import type { LeafCueDatabase } from "@/lib/db";
import {
  applyAdaptiveInterval,
  type CompleteTaskInput,
  completeTask,
  createSchedule,
  deleteSchedule,
  disableSchedule,
  enableSchedule,
  rescheduleTask,
  skipTaskOnce,
  snoozeTask,
  snoozeTaskByDays,
  undoCompletion,
  updateSchedule,
} from "@/lib/db/repositories";
import type { CareLog, PlantTaskSchedule } from "@/lib/db/types";
import type { PlantTaskScheduleInsertInput } from "@/lib/db/zod";
import {
  cancelScheduleReminder,
  resyncScheduleById,
} from "@/lib/notifications/schedule";

export type CompleteTaskSnapshot = {
  log: CareLog;
  scheduleId: number;
  previousNextDueAt: Date | null;
  previousLastCompletedAt: Date | null;
  previousSnoozedUntil: Date | null;
};

export type SaveTaskScheduleInput = Pick<
  PlantTaskScheduleInsertInput,
  | "plantId"
  | "templateId"
  | "customName"
  | "intervalDays"
  | "nextDueAt"
  | "preferredHour"
  | "preferredMinute"
  | "instructions"
> & {
  scheduleId?: number;
};

function reportError(action: string, error: unknown): void {
  const message = error instanceof Error ? error.message : "Please try again.";
  Alert.alert(`Couldn't ${action}`, message);
}

export async function performSaveSchedule(
  db: LeafCueDatabase,
  input: SaveTaskScheduleInput,
): Promise<PlantTaskSchedule | null> {
  try {
    const saved =
      input.scheduleId !== undefined
        ? updateSchedule(db, input.scheduleId, {
            templateId: input.templateId,
            customName: input.customName,
            intervalDays: input.intervalDays,
            nextDueAt: input.nextDueAt,
            preferredHour: input.preferredHour,
            preferredMinute: input.preferredMinute,
            instructions: input.instructions,
          })
        : createSchedule(db, {
            plantId: input.plantId,
            templateId: input.templateId,
            customName: input.customName,
            intervalDays: input.intervalDays,
            nextDueAt: input.nextDueAt,
            preferredHour: input.preferredHour,
            preferredMinute: input.preferredMinute,
            instructions: input.instructions,
            isEnabled: true,
          });
    await resyncScheduleById(db, saved.id);
    return saved;
  } catch (error) {
    reportError("save", error);
    return null;
  }
}

export async function performDeleteSchedule(
  db: LeafCueDatabase,
  scheduleId: number,
): Promise<boolean> {
  try {
    await cancelScheduleReminder(db, scheduleId);
    deleteSchedule(db, scheduleId);
    return true;
  } catch (error) {
    reportError("delete", error);
    return false;
  }
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

export async function performApplyAdaptiveInterval(
  db: LeafCueDatabase,
  scheduleId: number,
  intervalDays: number,
): Promise<void> {
  try {
    applyAdaptiveInterval(db, scheduleId, intervalDays);
    await resyncScheduleById(db, scheduleId);
  } catch (error) {
    reportError("update schedule", error);
  }
}
