import { and, desc, eq, isNull } from "drizzle-orm";

import type { LeafCueDatabase, LeafCueDbOrTx } from "@/lib/db";
import { healthObservations, plants } from "@/lib/db/schema";
import type { HealthObservation, Plant } from "@/lib/db/types";
import {
  type HealthObservationInsertInput,
  healthObservationInsertSchema,
  healthStatusSchema,
} from "@/lib/db/zod";

export function getHealthObservations(
  db: LeafCueDbOrTx,
  plantId: number,
  options: { onlyActive?: boolean } = {},
): HealthObservation[] {
  const where = options.onlyActive
    ? and(
        eq(healthObservations.plantId, plantId),
        eq(healthObservations.status, "active"),
      )
    : eq(healthObservations.plantId, plantId);

  return db
    .select()
    .from(healthObservations)
    .where(where)
    .orderBy(desc(healthObservations.observedAt))
    .all();
}

export type ActiveHealthObservationRow = {
  observation: HealthObservation;
  plant: Plant;
};

export function getActiveHealthObservationsAcrossPlants(
  db: LeafCueDbOrTx,
): ActiveHealthObservationRow[] {
  return db
    .select({
      observation: healthObservations,
      plant: plants,
    })
    .from(healthObservations)
    .innerJoin(plants, eq(plants.id, healthObservations.plantId))
    .where(
      and(eq(healthObservations.status, "active"), isNull(plants.archivedAt)),
    )
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
      status: parsed.status ?? "active",
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

export function updateHealthObservation(
  db: LeafCueDatabase,
  id: number,
  input: Partial<HealthObservationInsertInput>,
): HealthObservation {
  const parsed = healthObservationInsertSchema.partial().parse(input);
  const { observedAt, ...rest } = parsed;
  const updated = db
    .update(healthObservations)
    .set({
      ...rest,
      ...(observedAt ? { observedAt } : {}),
      updatedAt: new Date(),
    })
    .where(eq(healthObservations.id, id))
    .returning()
    .get();

  if (!updated) {
    throw new Error(`Health observation ${id} not found`);
  }

  return updated;
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
