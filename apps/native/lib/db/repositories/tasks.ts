import { addDays, startOfDay } from "date-fns";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  isNotNull,
  isNull,
  lte,
  or,
} from "drizzle-orm";

import {
  computeNextDueAt,
  computeSkipOnceNextDueAt,
  resolveIntervalDays,
} from "@/lib/care/scheduling";
import type { LeafCueDatabase, LeafCueDbOrTx } from "@/lib/db";
import {
  careLogs,
  careTaskTemplates,
  journalEntries,
  plantPhotos,
  plants,
  plantTaskSchedules,
} from "@/lib/db/schema";
import type {
  CareLog,
  CareTaskTemplate,
  Plant,
  PlantTaskSchedule,
} from "@/lib/db/types";
import {
  type PlantTaskScheduleInsertInput,
  plantTaskScheduleInsertSchema,
  type TaskFilter,
} from "@/lib/db/zod";

export type DueTaskRow = {
  schedule: PlantTaskSchedule;
  plant: Plant;
  template: CareTaskTemplate | null;
};

export type CompletedLogRow = {
  log: CareLog;
  plant: Plant;
  template: CareTaskTemplate | null;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function createSchedule(
  db: LeafCueDatabase,
  input: PlantTaskScheduleInsertInput,
): PlantTaskSchedule {
  const parsed = plantTaskScheduleInsertSchema.parse(input);
  const now = new Date();

  const inserted = db
    .insert(plantTaskSchedules)
    .values({
      plantId: parsed.plantId,
      templateId: parsed.templateId ?? null,
      customName: parsed.customName ?? null,
      intervalDays: parsed.intervalDays ?? null,
      nextDueAt: parsed.nextDueAt ?? null,
      lastCompletedAt: parsed.lastCompletedAt ?? null,
      snoozedUntil: parsed.snoozedUntil ?? null,
      isEnabled: parsed.isEnabled ?? true,
      instructions: parsed.instructions ?? null,
      notificationId: parsed.notificationId ?? null,
      preferredHour: parsed.preferredHour ?? null,
      preferredMinute: parsed.preferredMinute ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  if (!inserted) {
    throw new Error("Failed to create schedule");
  }

  return inserted;
}

export function updateSchedule(
  db: LeafCueDatabase,
  id: number,
  input: Partial<PlantTaskScheduleInsertInput>,
): PlantTaskSchedule {
  const parsed = plantTaskScheduleInsertSchema.partial().parse(input);
  const updated = db
    .update(plantTaskSchedules)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(plantTaskSchedules.id, id))
    .returning()
    .get();

  if (!updated) {
    throw new Error(`Schedule ${id} not found`);
  }

  return updated;
}

export function getScheduleById(
  db: LeafCueDbOrTx,
  id: number,
): PlantTaskSchedule | undefined {
  return db
    .select()
    .from(plantTaskSchedules)
    .where(eq(plantTaskSchedules.id, id))
    .get();
}

export function getSchedulesForPlant(
  db: LeafCueDbOrTx,
  plantId: number,
): PlantTaskSchedule[] {
  return db
    .select()
    .from(plantTaskSchedules)
    .where(eq(plantTaskSchedules.plantId, plantId))
    .orderBy(asc(plantTaskSchedules.nextDueAt))
    .all();
}

export function getAllActiveScheduleRows(db: LeafCueDbOrTx): DueTaskRow[] {
  return db
    .select({
      schedule: plantTaskSchedules,
      plant: plants,
      template: careTaskTemplates,
    })
    .from(plantTaskSchedules)
    .innerJoin(plants, eq(plants.id, plantTaskSchedules.plantId))
    .leftJoin(
      careTaskTemplates,
      eq(careTaskTemplates.id, plantTaskSchedules.templateId),
    )
    .where(
      and(eq(plantTaskSchedules.isEnabled, true), isNull(plants.archivedAt)),
    )
    .orderBy(asc(plantTaskSchedules.nextDueAt))
    .all();
}

export function getDueTasks(
  db: LeafCueDbOrTx,
  now: Date = new Date(),
): DueTaskRow[] {
  return db
    .select({
      schedule: plantTaskSchedules,
      plant: plants,
      template: careTaskTemplates,
    })
    .from(plantTaskSchedules)
    .innerJoin(plants, eq(plants.id, plantTaskSchedules.plantId))
    .leftJoin(
      careTaskTemplates,
      eq(careTaskTemplates.id, plantTaskSchedules.templateId),
    )
    .where(
      and(
        eq(plantTaskSchedules.isEnabled, true),
        isNull(plants.archivedAt),
        lte(plantTaskSchedules.nextDueAt, now),
        or(
          isNull(plantTaskSchedules.snoozedUntil),
          lte(plantTaskSchedules.snoozedUntil, now),
        ),
      ),
    )
    .orderBy(asc(plantTaskSchedules.nextDueAt))
    .all();
}

export function getUpcomingTasks(
  db: LeafCueDbOrTx,
  days = 7,
  now: Date = new Date(),
): DueTaskRow[] {
  const horizon = new Date(now.getTime() + days * MS_PER_DAY);

  return db
    .select({
      schedule: plantTaskSchedules,
      plant: plants,
      template: careTaskTemplates,
    })
    .from(plantTaskSchedules)
    .innerJoin(plants, eq(plants.id, plantTaskSchedules.plantId))
    .leftJoin(
      careTaskTemplates,
      eq(careTaskTemplates.id, plantTaskSchedules.templateId),
    )
    .where(
      and(
        eq(plantTaskSchedules.isEnabled, true),
        isNull(plants.archivedAt),
        gt(plantTaskSchedules.nextDueAt, now),
        lte(plantTaskSchedules.nextDueAt, horizon),
      ),
    )
    .orderBy(asc(plantTaskSchedules.nextDueAt))
    .all();
}

export function getOverdueTasks(
  db: LeafCueDbOrTx,
  now: Date = new Date(),
): DueTaskRow[] {
  const startToday = startOfDay(now);
  return db
    .select({
      schedule: plantTaskSchedules,
      plant: plants,
      template: careTaskTemplates,
    })
    .from(plantTaskSchedules)
    .innerJoin(plants, eq(plants.id, plantTaskSchedules.plantId))
    .leftJoin(
      careTaskTemplates,
      eq(careTaskTemplates.id, plantTaskSchedules.templateId),
    )
    .where(
      and(
        eq(plantTaskSchedules.isEnabled, true),
        isNull(plants.archivedAt),
        lte(plantTaskSchedules.nextDueAt, startToday),
        or(
          isNull(plantTaskSchedules.snoozedUntil),
          lte(plantTaskSchedules.snoozedUntil, now),
        ),
      ),
    )
    .orderBy(asc(plantTaskSchedules.nextDueAt))
    .all();
}

export function getTodayDueTasks(
  db: LeafCueDbOrTx,
  now: Date = new Date(),
): DueTaskRow[] {
  const startToday = startOfDay(now);
  const startTomorrow = addDays(startToday, 1);
  return db
    .select({
      schedule: plantTaskSchedules,
      plant: plants,
      template: careTaskTemplates,
    })
    .from(plantTaskSchedules)
    .innerJoin(plants, eq(plants.id, plantTaskSchedules.plantId))
    .leftJoin(
      careTaskTemplates,
      eq(careTaskTemplates.id, plantTaskSchedules.templateId),
    )
    .where(
      and(
        eq(plantTaskSchedules.isEnabled, true),
        isNull(plants.archivedAt),
        gte(plantTaskSchedules.nextDueAt, startToday),
        lte(plantTaskSchedules.nextDueAt, startTomorrow),
        or(
          isNull(plantTaskSchedules.snoozedUntil),
          lte(plantTaskSchedules.snoozedUntil, now),
        ),
      ),
    )
    .orderBy(asc(plantTaskSchedules.nextDueAt))
    .all();
}

export type GetTasksByFilterOptions = {
  upcomingDays?: number;
  completedLimit?: number;
};

export function getTasksByFilter(
  db: LeafCueDbOrTx,
  filter: TaskFilter,
  now: Date = new Date(),
  options: GetTasksByFilterOptions = {},
): { schedules: DueTaskRow[]; completed: CompletedLogRow[] } {
  switch (filter) {
    case "today":
      return {
        schedules: [...getOverdueTasks(db, now), ...getTodayDueTasks(db, now)],
        completed: [],
      };
    case "overdue":
      return { schedules: getOverdueTasks(db, now), completed: [] };
    case "upcoming":
      return {
        schedules: getUpcomingTasks(db, options.upcomingDays ?? 14, now),
        completed: [],
      };
    case "completed":
      return {
        schedules: [],
        completed: getCompletedTaskLogs(db, {
          limit: options.completedLimit ?? 100,
        }),
      };
    case "all":
      return { schedules: getAllActiveScheduleRows(db), completed: [] };
  }
}

export type GetCompletedTaskLogsOptions = {
  limit?: number;
  from?: Date;
  to?: Date;
  plantId?: number;
};

export function getCompletedTaskLogs(
  db: LeafCueDbOrTx,
  options: GetCompletedTaskLogsOptions = {},
): CompletedLogRow[] {
  const conditions = [
    options.from ? gte(careLogs.completedAt, options.from) : undefined,
    options.to ? lte(careLogs.completedAt, options.to) : undefined,
    options.plantId !== undefined
      ? eq(careLogs.plantId, options.plantId)
      : undefined,
  ].filter(<T>(value: T | undefined): value is T => value !== undefined);

  const baseQuery = db
    .select({
      log: careLogs,
      plant: plants,
      template: careTaskTemplates,
    })
    .from(careLogs)
    .innerJoin(plants, eq(plants.id, careLogs.plantId))
    .leftJoin(careTaskTemplates, eq(careTaskTemplates.id, careLogs.templateId));

  const ordered =
    conditions.length > 0
      ? baseQuery.where(and(...conditions)).orderBy(desc(careLogs.completedAt))
      : baseQuery.orderBy(desc(careLogs.completedAt));

  if (options.limit && options.limit > 0) {
    return ordered.limit(options.limit).all();
  }
  return ordered.all();
}

export function snoozeTask(
  db: LeafCueDatabase,
  scheduleId: number,
  until: Date,
): PlantTaskSchedule {
  const updated = db
    .update(plantTaskSchedules)
    .set({ snoozedUntil: until, updatedAt: new Date() })
    .where(eq(plantTaskSchedules.id, scheduleId))
    .returning()
    .get();

  if (!updated) {
    throw new Error(`Schedule ${scheduleId} not found`);
  }

  return updated;
}

export function snoozeTaskByDays(
  db: LeafCueDatabase,
  scheduleId: number,
  days: number,
  now: Date = new Date(),
): PlantTaskSchedule {
  if (days <= 0) {
    throw new Error("Snooze days must be positive");
  }
  const until = addDays(now, days);
  return snoozeTask(db, scheduleId, until);
}

export function rescheduleTask(
  db: LeafCueDatabase,
  scheduleId: number,
  dueAt: Date,
): PlantTaskSchedule {
  const updated = db
    .update(plantTaskSchedules)
    .set({
      nextDueAt: dueAt,
      snoozedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(plantTaskSchedules.id, scheduleId))
    .returning()
    .get();

  if (!updated) {
    throw new Error(`Schedule ${scheduleId} not found`);
  }

  return updated;
}

/**
 * Apply a new interval learned from the user's completion history. Keeps the
 * existing anchor (last completed, else next due) and recomputes the next due
 * date so the change takes effect from where the plant currently stands.
 */
export function applyAdaptiveInterval(
  db: LeafCueDatabase,
  scheduleId: number,
  intervalDays: number,
): PlantTaskSchedule {
  return db.transaction((tx) => {
    const schedule = tx
      .select()
      .from(plantTaskSchedules)
      .where(eq(plantTaskSchedules.id, scheduleId))
      .get();
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    const anchor = schedule.lastCompletedAt ?? schedule.nextDueAt ?? new Date();
    const nextDueAt = computeNextDueAt(anchor, intervalDays);

    const updated = tx
      .update(plantTaskSchedules)
      .set({
        intervalDays,
        nextDueAt,
        snoozedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(plantTaskSchedules.id, scheduleId))
      .returning()
      .get();

    if (!updated) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    return updated;
  });
}

export function skipTaskOnce(
  db: LeafCueDatabase,
  scheduleId: number,
  now: Date = new Date(),
): PlantTaskSchedule {
  return db.transaction((tx) => {
    const schedule = tx
      .select()
      .from(plantTaskSchedules)
      .where(eq(plantTaskSchedules.id, scheduleId))
      .get();
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    const template = schedule.templateId
      ? (tx
          .select()
          .from(careTaskTemplates)
          .where(eq(careTaskTemplates.id, schedule.templateId))
          .get() ?? null)
      : null;

    const interval = resolveIntervalDays(
      schedule.intervalDays,
      template?.defaultIntervalDays ?? null,
    );

    const nextDueAt = computeSkipOnceNextDueAt(
      schedule.nextDueAt,
      interval,
      now,
    );

    const updated = tx
      .update(plantTaskSchedules)
      .set({
        nextDueAt,
        snoozedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(plantTaskSchedules.id, scheduleId))
      .returning()
      .get();

    if (!updated) {
      throw new Error(`Schedule ${scheduleId} not found after update`);
    }
    return updated;
  });
}

export type CompleteTaskInput = {
  scheduleId: number;
  completedAt?: Date;
  notes?: string | null;
  amount?: number | null;
  unit?: string | null;
  mood?: string | null;
  photoUri?: string | null;
};

export type CompleteTaskResult = {
  schedule: PlantTaskSchedule;
  log: CareLog;
};

export function completeTask(
  db: LeafCueDatabase,
  input: CompleteTaskInput,
): CompleteTaskResult {
  const completedAt = input.completedAt ?? new Date();

  return db.transaction((tx) => {
    const schedule = tx
      .select()
      .from(plantTaskSchedules)
      .where(eq(plantTaskSchedules.id, input.scheduleId))
      .get();

    if (!schedule) {
      throw new Error(`Schedule ${input.scheduleId} not found`);
    }

    const template = schedule.templateId
      ? (tx
          .select()
          .from(careTaskTemplates)
          .where(eq(careTaskTemplates.id, schedule.templateId))
          .get() ?? null)
      : null;

    const trimmedMood = input.mood?.trim() ? input.mood.trim() : null;
    const trimmedPhoto = input.photoUri?.trim() ? input.photoUri.trim() : null;
    const trimmedNotes = input.notes?.trim() ? input.notes.trim() : null;

    const log = tx
      .insert(careLogs)
      .values({
        plantId: schedule.plantId,
        scheduleId: schedule.id,
        templateId: schedule.templateId ?? null,
        type: template?.key ?? schedule.customName ?? "custom_note",
        title: schedule.customName ?? template?.name ?? null,
        notes: trimmedNotes,
        completedAt,
        amount: input.amount ?? null,
        unit: input.unit ?? null,
        createdAt: new Date(),
      })
      .returning()
      .get();

    if (!log) {
      throw new Error("Failed to insert care log");
    }

    if (trimmedMood) {
      const taskLabel = template?.name ?? schedule.customName ?? "Care";
      tx.insert(journalEntries)
        .values({
          plantId: schedule.plantId,
          title: `${taskLabel} mood`,
          body: trimmedNotes ?? `Felt ${trimmedMood} after ${taskLabel}.`,
          mood: trimmedMood,
          entryType: "note",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .run();
    }

    if (trimmedPhoto) {
      tx.insert(plantPhotos)
        .values({
          plantId: schedule.plantId,
          uri: trimmedPhoto,
          caption: trimmedNotes,
          takenAt: completedAt,
          type: "journal",
        })
        .run();
    }

    const intervalDays = resolveIntervalDays(
      schedule.intervalDays,
      template?.defaultIntervalDays ?? null,
    );

    const nextDueAt = computeNextDueAt(completedAt, intervalDays);

    const updatedSchedule = tx
      .update(plantTaskSchedules)
      .set({
        lastCompletedAt: completedAt,
        nextDueAt,
        snoozedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(plantTaskSchedules.id, schedule.id))
      .returning()
      .get();

    if (!updatedSchedule) {
      throw new Error(`Schedule ${schedule.id} not found after update`);
    }

    return { schedule: updatedSchedule, log };
  });
}

export function undoCompletion(
  db: LeafCueDatabase,
  args: {
    logId: number;
    scheduleId: number;
    previousNextDueAt: Date | null;
    previousLastCompletedAt: Date | null;
    previousSnoozedUntil: Date | null;
  },
): PlantTaskSchedule {
  return db.transaction((tx) => {
    tx.delete(careLogs).where(eq(careLogs.id, args.logId)).run();

    const restored = tx
      .update(plantTaskSchedules)
      .set({
        nextDueAt: args.previousNextDueAt,
        lastCompletedAt: args.previousLastCompletedAt,
        snoozedUntil: args.previousSnoozedUntil,
        updatedAt: new Date(),
      })
      .where(eq(plantTaskSchedules.id, args.scheduleId))
      .returning()
      .get();

    if (!restored) {
      throw new Error(`Schedule ${args.scheduleId} not found`);
    }
    return restored;
  });
}

export function disableSchedule(
  db: LeafCueDatabase,
  id: number,
): PlantTaskSchedule {
  const updated = db
    .update(plantTaskSchedules)
    .set({ isEnabled: false, updatedAt: new Date() })
    .where(eq(plantTaskSchedules.id, id))
    .returning()
    .get();

  if (!updated) {
    throw new Error(`Schedule ${id} not found`);
  }

  return updated;
}

export function enableSchedule(
  db: LeafCueDatabase,
  id: number,
): PlantTaskSchedule {
  const updated = db
    .update(plantTaskSchedules)
    .set({ isEnabled: true, updatedAt: new Date() })
    .where(eq(plantTaskSchedules.id, id))
    .returning()
    .get();

  if (!updated) {
    throw new Error(`Schedule ${id} not found`);
  }

  return updated;
}

export function deleteSchedule(db: LeafCueDatabase, id: number): void {
  db.delete(plantTaskSchedules).where(eq(plantTaskSchedules.id, id)).run();
}

export function setScheduleNotificationId(
  db: LeafCueDatabase,
  scheduleId: number,
  notificationId: string | null,
): void {
  db.update(plantTaskSchedules)
    .set({ notificationId, updatedAt: new Date() })
    .where(eq(plantTaskSchedules.id, scheduleId))
    .run();
}

export function getSchedulesNeedingReminders(
  db: LeafCueDbOrTx,
  now: Date = new Date(),
  horizonDays = 60,
): DueTaskRow[] {
  const horizon = new Date(now.getTime() + horizonDays * MS_PER_DAY);
  const yesterday = addDays(now, -1);
  return db
    .select({
      schedule: plantTaskSchedules,
      plant: plants,
      template: careTaskTemplates,
    })
    .from(plantTaskSchedules)
    .innerJoin(plants, eq(plants.id, plantTaskSchedules.plantId))
    .leftJoin(
      careTaskTemplates,
      eq(careTaskTemplates.id, plantTaskSchedules.templateId),
    )
    .where(
      and(
        eq(plantTaskSchedules.isEnabled, true),
        isNull(plants.archivedAt),
        isNotNull(plantTaskSchedules.nextDueAt),
        gt(plantTaskSchedules.nextDueAt, yesterday),
        lte(plantTaskSchedules.nextDueAt, horizon),
      ),
    )
    .orderBy(asc(plantTaskSchedules.nextDueAt))
    .all();
}
