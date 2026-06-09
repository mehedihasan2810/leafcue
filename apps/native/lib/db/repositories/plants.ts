import { and, count, desc, eq, isNotNull, isNull, like, or } from "drizzle-orm";

import type {
  LeafCueDatabase,
  LeafCueDbOrTx,
  LeafCueTransaction,
} from "@/lib/db";
import {
  type CareTaskTemplateKey,
  careTaskTemplates,
  plants,
  plantTaskSchedules,
} from "@/lib/db/schema";
import type { Plant, PlantTaskSchedule } from "@/lib/db/types";
import {
  type PlantInsertInput,
  type PlantUpdateInput,
  plantInsertSchema,
  plantUpdateSchema,
} from "@/lib/db/zod";

export type PlantListFilters = {
  includeArchived?: boolean;
  roomId?: number;
  shelfId?: number;
  search?: string;
  favoritesOnly?: boolean;
};

export function getPlants(
  db: LeafCueDbOrTx,
  filters: PlantListFilters = {},
): Plant[] {
  const conditions = [
    filters.includeArchived ? undefined : isNull(plants.archivedAt),
    filters.roomId !== undefined
      ? eq(plants.roomId, filters.roomId)
      : undefined,
    filters.shelfId !== undefined
      ? eq(plants.shelfId, filters.shelfId)
      : undefined,
    filters.favoritesOnly ? eq(plants.isFavorite, true) : undefined,
    filters.search && filters.search.trim().length > 0
      ? or(
          like(plants.nickname, `%${filters.search.trim()}%`),
          like(plants.commonName, `%${filters.search.trim()}%`),
          like(plants.scientificName, `%${filters.search.trim()}%`),
        )
      : undefined,
  ].filter(<T>(value: T | undefined): value is T => value !== undefined);

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select()
    .from(plants)
    .where(whereClause)
    .orderBy(desc(plants.isFavorite), desc(plants.createdAt))
    .all();
}

export function getPlantById(db: LeafCueDbOrTx, id: number): Plant | undefined {
  return db.select().from(plants).where(eq(plants.id, id)).get();
}

/** Count of active (non-archived) plants. Drives the free-tier plant limit. */
export function countActivePlants(db: LeafCueDbOrTx): number {
  const row = db
    .select({ value: count() })
    .from(plants)
    .where(isNull(plants.archivedAt))
    .get();
  return row?.value ?? 0;
}

export function createPlant(
  db: LeafCueDatabase,
  input: PlantInsertInput,
): Plant {
  const parsed = plantInsertSchema.parse(input);
  const now = new Date();

  const inserted = db
    .insert(plants)
    .values({
      nickname: parsed.nickname,
      commonName: parsed.commonName ?? null,
      scientificName: parsed.scientificName ?? null,
      speciesPresetId: parsed.speciesPresetId ?? null,
      photoUri: parsed.photoUri ?? null,
      roomId: parsed.roomId ?? null,
      shelfId: parsed.shelfId ?? null,
      notes: parsed.notes ?? null,
      acquiredAt: parsed.acquiredAt ?? null,
      careDifficulty: parsed.careDifficulty ?? null,
      toxicity: parsed.toxicity ?? null,
      lightPreference: parsed.lightPreference ?? null,
      wateringPreference: parsed.wateringPreference ?? null,
      soilType: parsed.soilType ?? null,
      potType: parsed.potType ?? null,
      potSize: parsed.potSize ?? null,
      hasDrainage: parsed.hasDrainage ?? null,
      isFavorite: parsed.isFavorite ?? false,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  if (!inserted) {
    throw new Error("Failed to create plant");
  }

  return inserted;
}

export function updatePlant(
  db: LeafCueDatabase,
  id: number,
  input: PlantUpdateInput,
): Plant {
  const parsed = plantUpdateSchema.parse(input);

  const updated = db
    .update(plants)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(plants.id, id))
    .returning()
    .get();

  if (!updated) {
    throw new Error(`Plant ${id} not found`);
  }

  return updated;
}

export function archivePlant(db: LeafCueDatabase, id: number): Plant {
  const now = new Date();
  const archived = db
    .update(plants)
    .set({ archivedAt: now, updatedAt: now })
    .where(and(eq(plants.id, id), isNull(plants.archivedAt)))
    .returning()
    .get();

  if (!archived) {
    throw new Error(`Plant ${id} not found or already archived`);
  }

  return archived;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const DEFAULT_SCHEDULE_KEYS: ReadonlyArray<CareTaskTemplateKey> = [
  "water",
  "fertilize",
];

export type CreatePlantWithDefaultsResult = {
  plant: Plant;
  schedules: PlantTaskSchedule[];
};

export type CreatePlantWithDefaultsOptions = {
  scheduleKeys?: ReadonlyArray<CareTaskTemplateKey>;
  scheduleDrafts?: ReadonlyArray<{
    key: CareTaskTemplateKey;
    intervalDays?: number | null;
    instructions?: string | null;
    nextDueAt?: Date | null;
  }>;
  startAt?: Date;
};

function insertDefaultSchedule(
  tx: LeafCueTransaction,
  plantId: number,
  key: CareTaskTemplateKey,
  startAt: Date,
  draft?: {
    intervalDays?: number | null;
    instructions?: string | null;
    nextDueAt?: Date | null;
  },
): PlantTaskSchedule | null {
  const template = tx
    .select()
    .from(careTaskTemplates)
    .where(eq(careTaskTemplates.key, key))
    .get();
  if (!template) return null;

  const intervalDays = draft?.intervalDays ?? template.defaultIntervalDays;
  const nextDueAt =
    draft?.nextDueAt ??
    (intervalDays !== null && intervalDays !== undefined
      ? new Date(startAt.getTime() + intervalDays * MS_PER_DAY)
      : null);

  const inserted = tx
    .insert(plantTaskSchedules)
    .values({
      plantId,
      templateId: template.id,
      customName: null,
      intervalDays: intervalDays ?? null,
      nextDueAt,
      lastCompletedAt: null,
      snoozedUntil: null,
      isEnabled: true,
      instructions: draft?.instructions ?? template.defaultInstructions ?? null,
      createdAt: startAt,
      updatedAt: startAt,
    })
    .returning()
    .get();

  return inserted ?? null;
}

export function createPlantWithDefaults(
  db: LeafCueDatabase,
  input: PlantInsertInput,
  options: CreatePlantWithDefaultsOptions = {},
): CreatePlantWithDefaultsResult {
  const parsed = plantInsertSchema.parse(input);
  const startAt = options.startAt ?? new Date();
  const scheduleKeys = options.scheduleKeys ?? DEFAULT_SCHEDULE_KEYS;
  const scheduleDrafts = options.scheduleDrafts ?? null;

  return db.transaction((tx) => {
    const inserted = tx
      .insert(plants)
      .values({
        nickname: parsed.nickname,
        commonName: parsed.commonName ?? null,
        scientificName: parsed.scientificName ?? null,
        speciesPresetId: parsed.speciesPresetId ?? null,
        photoUri: parsed.photoUri ?? null,
        roomId: parsed.roomId ?? null,
        shelfId: parsed.shelfId ?? null,
        notes: parsed.notes ?? null,
        acquiredAt: parsed.acquiredAt ?? null,
        careDifficulty: parsed.careDifficulty ?? null,
        toxicity: parsed.toxicity ?? null,
        lightPreference: parsed.lightPreference ?? null,
        wateringPreference: parsed.wateringPreference ?? null,
        soilType: parsed.soilType ?? null,
        potType: parsed.potType ?? null,
        potSize: parsed.potSize ?? null,
        hasDrainage: parsed.hasDrainage ?? null,
        isFavorite: parsed.isFavorite ?? false,
        createdAt: startAt,
        updatedAt: startAt,
      })
      .returning()
      .get();

    if (!inserted) {
      throw new Error("Failed to create plant");
    }

    const schedules: PlantTaskSchedule[] = [];
    const drafts =
      scheduleDrafts ??
      scheduleKeys.map((key) => ({
        key,
      }));

    for (const draft of drafts) {
      const { key, ...scheduleDraft } = draft;
      const schedule = insertDefaultSchedule(
        tx,
        inserted.id,
        key,
        startAt,
        scheduleDraft,
      );
      if (schedule) schedules.push(schedule);
    }

    return { plant: inserted, schedules };
  });
}

export function unarchivePlant(db: LeafCueDatabase, id: number): Plant {
  const now = new Date();
  const restored = db
    .update(plants)
    .set({ archivedAt: null, updatedAt: now })
    .where(and(eq(plants.id, id), isNotNull(plants.archivedAt)))
    .returning()
    .get();

  if (!restored) {
    throw new Error(`Plant ${id} is not archived`);
  }

  return restored;
}

export function getArchivedPlants(db: LeafCueDbOrTx): Plant[] {
  return db
    .select()
    .from(plants)
    .where(isNotNull(plants.archivedAt))
    .orderBy(desc(plants.archivedAt))
    .all();
}

/**
 * Permanently delete a plant. Cascades to schedules, photos, logs, journals,
 * growth measurements, and health observations via FK rules. Use with
 * destructive confirmation.
 */
export function deletePlantPermanently(db: LeafCueDatabase, id: number): void {
  db.delete(plants).where(eq(plants.id, id)).run();
}
