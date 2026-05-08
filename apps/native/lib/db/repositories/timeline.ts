import { desc, eq } from "drizzle-orm";

import type { LeafCueDbOrTx } from "@/lib/db";
import {
  careLogs,
  growthMeasurements,
  healthObservations,
  journalEntries,
  plantPhotos,
} from "@/lib/db/schema";
import type {
  CareLog,
  GrowthMeasurement,
  HealthObservation,
  JournalEntry,
  PlantPhoto,
} from "@/lib/db/types";

export type PlantTimelineKind =
  | "care_log"
  | "journal_entry"
  | "photo"
  | "growth_measurement"
  | "health_observation";

export type PlantTimelineItem =
  | { kind: "care_log"; at: Date; data: CareLog }
  | { kind: "journal_entry"; at: Date; data: JournalEntry }
  | { kind: "photo"; at: Date; data: PlantPhoto }
  | { kind: "growth_measurement"; at: Date; data: GrowthMeasurement }
  | { kind: "health_observation"; at: Date; data: HealthObservation };

export type PlantTimelineOptions = {
  limit?: number;
  kinds?: PlantTimelineKind[];
};

export function getPlantTimeline(
  db: LeafCueDbOrTx,
  plantId: number,
  options: PlantTimelineOptions = {},
): PlantTimelineItem[] {
  const include = (kind: PlantTimelineKind) =>
    options.kinds === undefined || options.kinds.includes(kind);

  const items: PlantTimelineItem[] = [];

  if (include("care_log")) {
    const rows = db
      .select()
      .from(careLogs)
      .where(eq(careLogs.plantId, plantId))
      .orderBy(desc(careLogs.completedAt))
      .all();
    for (const row of rows) {
      items.push({ kind: "care_log", at: row.completedAt, data: row });
    }
  }

  if (include("journal_entry")) {
    const rows = db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.plantId, plantId))
      .orderBy(desc(journalEntries.createdAt))
      .all();
    for (const row of rows) {
      items.push({ kind: "journal_entry", at: row.createdAt, data: row });
    }
  }

  if (include("photo")) {
    const rows = db
      .select()
      .from(plantPhotos)
      .where(eq(plantPhotos.plantId, plantId))
      .orderBy(desc(plantPhotos.takenAt))
      .all();
    for (const row of rows) {
      items.push({ kind: "photo", at: row.takenAt, data: row });
    }
  }

  if (include("growth_measurement")) {
    const rows = db
      .select()
      .from(growthMeasurements)
      .where(eq(growthMeasurements.plantId, plantId))
      .orderBy(desc(growthMeasurements.measuredAt))
      .all();
    for (const row of rows) {
      items.push({ kind: "growth_measurement", at: row.measuredAt, data: row });
    }
  }

  if (include("health_observation")) {
    const rows = db
      .select()
      .from(healthObservations)
      .where(eq(healthObservations.plantId, plantId))
      .orderBy(desc(healthObservations.observedAt))
      .all();
    for (const row of rows) {
      items.push({
        kind: "health_observation",
        at: row.observedAt,
        data: row,
      });
    }
  }

  items.sort((a, b) => b.at.getTime() - a.at.getTime());

  if (options.limit && options.limit > 0) {
    return items.slice(0, options.limit);
  }

  return items;
}
