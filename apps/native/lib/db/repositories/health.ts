import { and, desc, eq } from "drizzle-orm";

import type { LeafCueDatabase, LeafCueDbOrTx } from "@/lib/db";
import { healthObservations } from "@/lib/db/schema";
import type { HealthObservation } from "@/lib/db/types";
import {
  type HealthObservationInsertInput,
  healthObservationInsertSchema,
  healthStatusSchema,
} from "@/lib/db/zod";

export function getHealthObservations(
  db: LeafCueDbOrTx,
  plantId: number,
  options: { onlyOpen?: boolean } = {},
): HealthObservation[] {
  const where = options.onlyOpen
    ? and(
        eq(healthObservations.plantId, plantId),
        eq(healthObservations.status, "open"),
      )
    : eq(healthObservations.plantId, plantId);

  return db
    .select()
    .from(healthObservations)
    .where(where)
    .orderBy(desc(healthObservations.observedAt))
    .all();
}

export function addHealthObservation(
  db: LeafCueDatabase,
  input: HealthObservationInsertInput,
): HealthObservation {
  const parsed = healthObservationInsertSchema.parse(input);
  const now = new Date();

  const inserted = db
    .insert(healthObservations)
    .values({
      plantId: parsed.plantId,
      observedAt: parsed.observedAt ?? now,
      issueType: parsed.issueType,
      severity: parsed.severity,
      notes: parsed.notes ?? null,
      status: parsed.status ?? "open",
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  if (!inserted) {
    throw new Error("Failed to create health observation");
  }

  return inserted;
}

export function updateHealthObservationStatus(
  db: LeafCueDatabase,
  id: number,
  status: HealthObservation["status"],
): HealthObservation {
  const parsedStatus = healthStatusSchema.parse(status);
  const updated = db
    .update(healthObservations)
    .set({ status: parsedStatus, updatedAt: new Date() })
    .where(eq(healthObservations.id, id))
    .returning()
    .get();

  if (!updated) {
    throw new Error(`Health observation ${id} not found`);
  }

  return updated;
}

export function deleteHealthObservation(db: LeafCueDatabase, id: number): void {
  db.delete(healthObservations).where(eq(healthObservations.id, id)).run();
}
