import { desc, eq } from "drizzle-orm";

import type { LeafCueDatabase, LeafCueDbOrTx } from "@/lib/db";
import { growthMeasurements } from "@/lib/db/schema";
import type { GrowthMeasurement } from "@/lib/db/types";
import {
  growthMeasurementInsertSchema,
  type GrowthMeasurementInsertInput,
} from "@/lib/db/zod";

export function getGrowthMeasurements(
  db: LeafCueDbOrTx,
  plantId: number,
): GrowthMeasurement[] {
  return db
    .select()
    .from(growthMeasurements)
    .where(eq(growthMeasurements.plantId, plantId))
    .orderBy(desc(growthMeasurements.measuredAt))
    .all();
}

export function addGrowthMeasurement(
  db: LeafCueDatabase,
  input: GrowthMeasurementInsertInput,
): GrowthMeasurement {
  const parsed = growthMeasurementInsertSchema.parse(input);
  const measuredAt = parsed.measuredAt ?? new Date();

  const inserted = db
    .insert(growthMeasurements)
    .values({
      plantId: parsed.plantId,
      measuredAt,
      heightCm: parsed.heightCm ?? null,
      leafCount: parsed.leafCount ?? null,
      bloomCount: parsed.bloomCount ?? null,
      notes: parsed.notes ?? null,
      createdAt: new Date(),
    })
    .returning()
    .get();

  if (!inserted) {
    throw new Error("Failed to create growth measurement");
  }

  return inserted;
}

export function deleteGrowthMeasurement(
  db: LeafCueDatabase,
  id: number,
): void {
  db.delete(growthMeasurements).where(eq(growthMeasurements.id, id)).run();
}
