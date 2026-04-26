import { desc, eq } from "drizzle-orm";

import type { LeafCueDatabase, LeafCueDbOrTx } from "@/lib/db";
import { careLogs } from "@/lib/db/schema";
import type { CareLog } from "@/lib/db/types";
import { type CareLogInsertInput, careLogInsertSchema } from "@/lib/db/zod";

export function getCareLogsForPlant(
  db: LeafCueDbOrTx,
  plantId: number,
  limit?: number,
): CareLog[] {
  const query = db
    .select()
    .from(careLogs)
    .where(eq(careLogs.plantId, plantId))
    .orderBy(desc(careLogs.completedAt));

  if (limit && limit > 0) {
    return query.limit(limit).all();
  }

  return query.all();
}

export function getCareLogsForSchedule(
  db: LeafCueDbOrTx,
  scheduleId: number,
  limit?: number,
): CareLog[] {
  const query = db
    .select()
    .from(careLogs)
    .where(eq(careLogs.scheduleId, scheduleId))
    .orderBy(desc(careLogs.completedAt));

  if (limit && limit > 0) {
    return query.limit(limit).all();
  }

  return query.all();
}

export function createCareLog(
  db: LeafCueDatabase,
  input: CareLogInsertInput,
): CareLog {
  const parsed = careLogInsertSchema.parse(input);
  const completedAt = parsed.completedAt ?? new Date();

  const inserted = db
    .insert(careLogs)
    .values({
      plantId: parsed.plantId,
      scheduleId: parsed.scheduleId ?? null,
      templateId: parsed.templateId ?? null,
      type: parsed.type,
      title: parsed.title ?? null,
      notes: parsed.notes ?? null,
      completedAt,
      amount: parsed.amount ?? null,
      unit: parsed.unit ?? null,
      createdAt: new Date(),
    })
    .returning()
    .get();

  if (!inserted) {
    throw new Error("Failed to create care log");
  }

  return inserted;
}

export function deleteCareLog(db: LeafCueDatabase, id: number): void {
  db.delete(careLogs).where(eq(careLogs.id, id)).run();
}
