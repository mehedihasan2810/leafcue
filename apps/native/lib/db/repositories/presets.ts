import { asc, eq, like, or } from "drizzle-orm";

import type { LeafCueDbOrTx } from "@/lib/db";
import { plantPresets } from "@/lib/db/schema";
import type { PlantPreset } from "@/lib/db/types";

export function getPresets(db: LeafCueDbOrTx): PlantPreset[] {
  return db
    .select()
    .from(plantPresets)
    .orderBy(asc(plantPresets.commonName))
    .all();
}

export function getPresetById(
  db: LeafCueDbOrTx,
  id: number,
): PlantPreset | undefined {
  return db.select().from(plantPresets).where(eq(plantPresets.id, id)).get();
}

export function findPresetByName(
  db: LeafCueDbOrTx,
  query: string,
): PlantPreset[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];
  const pattern = `%${trimmed}%`;
  return db
    .select()
    .from(plantPresets)
    .where(
      or(
        like(plantPresets.commonName, pattern),
        like(plantPresets.scientificName, pattern),
      ),
    )
    .orderBy(asc(plantPresets.commonName))
    .all();
}
