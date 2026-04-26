import { and, asc, eq, gt, isNull, lte, or } from "drizzle-orm";

import type { LeafCueDatabase, LeafCueDbOrTx } from "@/lib/db";
import {
  careLogs,
  careTaskTemplates,
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
} from "@/lib/db/zod";

export type DueTaskRow = {
  schedule: PlantTaskSchedule;
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

export function getDueTasks(
  db: LeafCueDbOrTx,
  now: Date = new Date(),
): DueTaskRow[] {
  const rows = db
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

  return rows;
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

export type CompleteTaskInput = {
  scheduleId: number;
  completedAt?: Date;
  notes?: string | null;
  amount?: number | null;
  unit?: string | null;
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

    const log = tx
      .insert(careLogs)
      .values({
        plantId: schedule.plantId,
        scheduleId: schedule.id,
        templateId: schedule.templateId ?? null,
        type: template?.key ?? schedule.customName ?? "custom_note",
        title: schedule.customName ?? template?.name ?? null,
        notes: input.notes ?? null,
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

    const intervalDays =
      schedule.intervalDays ?? template?.defaultIntervalDays ?? null;

    const nextDueAt =
      intervalDays !== null
        ? new Date(completedAt.getTime() + intervalDays * MS_PER_DAY)
        : null;

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

export function deleteSchedule(db: LeafCueDatabase, id: number): void {
  db.delete(plantTaskSchedules).where(eq(plantTaskSchedules.id, id)).run();
}
