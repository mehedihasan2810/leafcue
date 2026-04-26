import { sql } from "drizzle-orm";

import type { LeafCueDatabase, LeafCueDbOrTx } from "@/lib/db";
import { careTaskTemplates, plantPresets } from "@/lib/db/schema";
import { builtInCareTaskTemplates } from "@/lib/db/seeds/care-task-templates";
import { builtInPlantPresets } from "@/lib/db/seeds/plant-presets";

function tableIsEmpty(
  db: LeafCueDbOrTx,
  table: typeof careTaskTemplates | typeof plantPresets,
): boolean {
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(table)
    .get();
  return (row?.count ?? 0) === 0;
}

function seedCareTaskTemplates(db: LeafCueDbOrTx): number {
  if (!tableIsEmpty(db, careTaskTemplates)) return 0;

  db.insert(careTaskTemplates)
    .values(
      builtInCareTaskTemplates.map((template) => ({
        key: template.key,
        name: template.name,
        icon: template.icon ?? null,
        defaultIntervalDays: template.defaultIntervalDays ?? null,
        defaultInstructions: template.defaultInstructions ?? null,
        colorKey: template.colorKey ?? null,
        isBuiltIn: template.isBuiltIn ?? true,
      })),
    )
    .run();

  return builtInCareTaskTemplates.length;
}

function seedPlantPresets(db: LeafCueDbOrTx): number {
  if (!tableIsEmpty(db, plantPresets)) return 0;

  const now = new Date();

  db.insert(plantPresets)
    .values(
      builtInPlantPresets.map((preset) => ({
        commonName: preset.commonName,
        scientificName: preset.scientificName ?? null,
        careDifficulty: preset.careDifficulty ?? null,
        light: preset.light ?? null,
        water: preset.water ?? null,
        humidity: preset.humidity ?? null,
        temperature: preset.temperature ?? null,
        soil: preset.soil ?? null,
        fertilizer: preset.fertilizer ?? null,
        petToxicity: preset.petToxicity ?? null,
        careSummary: preset.careSummary ?? null,
        createdAt: now,
      })),
    )
    .run();

  return builtInPlantPresets.length;
}

export type SeedReport = {
  careTaskTemplatesInserted: number;
  plantPresetsInserted: number;
};

export function runSeeds(db: LeafCueDatabase): SeedReport {
  return db.transaction((tx) => ({
    careTaskTemplatesInserted: seedCareTaskTemplates(tx),
    plantPresetsInserted: seedPlantPresets(tx),
  }));
}
