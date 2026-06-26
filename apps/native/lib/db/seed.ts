import { sql } from "drizzle-orm";

import type { LeafCueDatabase, LeafCueDbOrTx } from "@/lib/db";
import { careTaskTemplates, plantPresets, rooms } from "@/lib/db/schema";
import { builtInCareTaskTemplates } from "@/lib/db/seeds/care-task-templates";
import { defaultRoomSeeds } from "@/lib/db/seeds/default-rooms";
import { builtInPlantPresets } from "@/lib/db/seeds/plant-presets";

function tableIsEmpty(
  db: LeafCueDbOrTx,
  table: typeof careTaskTemplates | typeof plantPresets | typeof rooms,
): boolean {
  const row = db.select({ count: sql<number>`count(*)` }).from(table).get();
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

function presetCount(db: LeafCueDbOrTx): number {
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(plantPresets)
    .get();
  return row?.count ?? 0;
}

function seedPlantPresets(db: LeafCueDbOrTx): number {
  const before = presetCount(db);
  const now = new Date();

  // Upsert the curated library on every launch so existing installs pick up
  // presets added in newer versions. Conflicts on (common name, scientific
  // name) are skipped, so this stays idempotent and cheap.
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
    .onConflictDoNothing()
    .run();

  return presetCount(db) - before;
}

export function seedDefaultRoomsIfEmpty(db: LeafCueDbOrTx): number {
  if (!tableIsEmpty(db, rooms)) return 0;

  const now = new Date();

  db.insert(rooms)
    .values(
      defaultRoomSeeds.map((room) => ({
        name: room.name,
        icon: room.icon ?? null,
        sortOrder: room.sortOrder ?? 0,
        createdAt: now,
        updatedAt: now,
      })),
    )
    .run();

  return defaultRoomSeeds.length;
}

export type SeedReport = {
  careTaskTemplatesInserted: number;
  plantPresetsInserted: number;
  roomsInserted: number;
};

export function runSeeds(db: LeafCueDatabase): SeedReport {
  return db.transaction((tx) => ({
    careTaskTemplatesInserted: seedCareTaskTemplates(tx),
    plantPresetsInserted: seedPlantPresets(tx),
    roomsInserted: seedDefaultRoomsIfEmpty(tx),
  }));
}
