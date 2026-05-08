import { sql } from "drizzle-orm";
import { File } from "expo-file-system";

import type { LeafCueDatabase } from "@/lib/db";
import {
  appSettings,
  careLogs,
  careTaskTemplates,
  growthMeasurements,
  healthObservations,
  journalEntries,
  onboardingState,
  plantPhotos,
  plantPresets,
  plants,
  plantTaskSchedules,
  rooms,
  shelves,
} from "@/lib/db/schema";
import {
  type BackupPayload,
  type BackupPhotoFile,
  type BackupTables,
  backupPayloadSchema,
} from "@/lib/db/zod";
import {
  ensurePhotoDir,
  PHOTO_DIR_NAME,
  readPhotoAsBase64,
  writePhotoBase64,
} from "@/lib/photos";

function dateToIso(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  return value;
}

function serializeRow<T extends Record<string, unknown>>(
  row: T,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = dateToIso(value);
  }
  return out;
}

function serializeRows<T extends Record<string, unknown>>(
  rows: ReadonlyArray<T>,
): Array<Record<string, unknown>> {
  return rows.map((row) => serializeRow(row));
}

/** Collect all unique photo URIs stored in the app photo directory. */
function collectPhotoUris(tables: BackupTables): string[] {
  const uris = new Set<string>();

  for (const row of tables.plants) {
    const uri = typeof row.photoUri === "string" ? row.photoUri : null;
    if (uri?.includes(`/${PHOTO_DIR_NAME}/`)) uris.add(uri);
  }
  for (const row of tables.plantPhotos) {
    const uri = typeof row.uri === "string" ? row.uri : null;
    if (uri?.includes(`/${PHOTO_DIR_NAME}/`)) uris.add(uri);
  }
  for (const row of tables.journalEntries) {
    const uri = typeof row.photoUri === "string" ? row.photoUri : null;
    if (uri?.includes(`/${PHOTO_DIR_NAME}/`)) uris.add(uri);
  }

  return [...uris];
}

export type BackupCounts = {
  plants: number;
  rooms: number;
  shelves: number;
  plantPhotos: number;
  plantPresets: number;
  careTaskTemplates: number;
  plantTaskSchedules: number;
  careLogs: number;
  journalEntries: number;
  growthMeasurements: number;
  healthObservations: number;
  settings: number;
  onboardingState: number;
  photoFiles: number;
};

export function buildBackupPayload(
  db: LeafCueDatabase,
): BackupPayload & { photoFileCount: number } {
  const tables: BackupTables = {
    plantPresets: serializeRows(db.select().from(plantPresets).all()),
    rooms: serializeRows(db.select().from(rooms).all()),
    shelves: serializeRows(db.select().from(shelves).all()),
    plants: serializeRows(db.select().from(plants).all()),
    plantPhotos: serializeRows(db.select().from(plantPhotos).all()),
    careTaskTemplates: serializeRows(db.select().from(careTaskTemplates).all()),
    plantTaskSchedules: serializeRows(
      db.select().from(plantTaskSchedules).all(),
    ),
    careLogs: serializeRows(db.select().from(careLogs).all()),
    journalEntries: serializeRows(db.select().from(journalEntries).all()),
    growthMeasurements: serializeRows(
      db.select().from(growthMeasurements).all(),
    ),
    healthObservations: serializeRows(
      db.select().from(healthObservations).all(),
    ),
  };

  const settingsRows = db
    .select()
    .from(appSettings)
    .all()
    .map((row) => ({
      key: row.key,
      value: row.value,
      updatedAt: row.updatedAt.toISOString(),
    }));

  const onboardingRows = db
    .select()
    .from(onboardingState)
    .all()
    .map((row) => ({
      key: row.key,
      value: row.value,
      updatedAt: row.updatedAt.toISOString(),
    }));

  // Bundle photo files as base64
  const photoUris = collectPhotoUris(tables);
  const photoFiles: Record<string, BackupPhotoFile> = {};
  for (const uri of photoUris) {
    const result = readPhotoAsBase64(uri);
    if (result) {
      const filename = uri.split("/").pop() ?? "photo.jpg";
      photoFiles[uri] = {
        path: uri,
        filename,
        mimeType: result.mimeType,
        data: result.base64,
      };
    }
  }

  const payload = backupPayloadSchema.parse({
    version: 2,
    exportedAt: new Date().toISOString(),
    metadata: { appVersion: "1.0.0", platform: "native" },
    tables,
    settings: settingsRows,
    onboardingState: onboardingRows,
    photoFiles: Object.keys(photoFiles).length > 0 ? photoFiles : undefined,
  });

  return { ...payload, photoFileCount: Object.keys(photoFiles).length };
}

export function parseBackupJson(raw: string): BackupPayload {
  const parsed: unknown = JSON.parse(raw);
  return backupPayloadSchema.parse(parsed);
}

export function previewBackupCounts(payload: BackupPayload): BackupCounts {
  const t = payload.tables;
  return {
    plants: t.plants.length,
    rooms: t.rooms.length,
    shelves: t.shelves.length,
    plantPhotos: t.plantPhotos.length,
    plantPresets: t.plantPresets.length,
    careTaskTemplates: t.careTaskTemplates.length,
    plantTaskSchedules: t.plantTaskSchedules.length,
    careLogs: t.careLogs.length,
    journalEntries: t.journalEntries.length,
    growthMeasurements: t.growthMeasurements.length,
    healthObservations: t.healthObservations.length,
    settings: payload.settings.length,
    onboardingState: payload.onboardingState.length,
    photoFiles: payload.photoFiles ? Object.keys(payload.photoFiles).length : 0,
  };
}

type CsvSummary = BackupCounts;

/** Write bundled photo files from the payload back to the device directory. */
function restorePhotoFiles(payload: BackupPayload): void {
  if (!payload.photoFiles) return;
  ensurePhotoDir();
  for (const [uri, photoFile] of Object.entries(payload.photoFiles)) {
    writePhotoFromBase64File(uri, photoFile);
  }
}

function writePhotoFromBase64File(
  _targetUri: string,
  photoFile: BackupPhotoFile,
): void {
  try {
    const dir = ensurePhotoDir();
    const filename = photoFile.filename;
    const file = new File(dir, filename);
    writePhotoBase64(file, photoFile.data);
  } catch {
    // Best-effort restore; the import can still work with missing photo files.
  }
}

export type ImportSummary = CsvSummary;

/**
 * Replace import: wipes existing local data within a transaction and
 * re-inserts everything from the payload. Settings and onboarding state are
 * also restored from the backup.
 */
export function importBackupReplace(
  db: LeafCueDatabase,
  payload: BackupPayload,
): ImportSummary {
  const validated = backupPayloadSchema.parse(payload);
  const counts: ImportSummary = previewBackupCounts(validated);

  // Restore bundled photo files to the device first.
  restorePhotoFiles(validated);

  db.transaction((tx) => {
    // Wipe in dependency-safe order (FKs use cascade where possible).
    tx.delete(careLogs).where(sql`1 = 1`).run();
    tx.delete(plantTaskSchedules).where(sql`1 = 1`).run();
    tx.delete(plantPhotos).where(sql`1 = 1`).run();
    tx.delete(growthMeasurements).where(sql`1 = 1`).run();
    tx.delete(healthObservations).where(sql`1 = 1`).run();
    tx.delete(journalEntries).where(sql`1 = 1`).run();
    tx.delete(plants).where(sql`1 = 1`).run();
    tx.delete(shelves).where(sql`1 = 1`).run();
    tx.delete(rooms).where(sql`1 = 1`).run();
    tx.delete(careTaskTemplates).where(sql`1 = 1`).run();
    tx.delete(plantPresets).where(sql`1 = 1`).run();
    tx.delete(appSettings).where(sql`1 = 1`).run();
    tx.delete(onboardingState).where(sql`1 = 1`).run();

    insertAll(tx as unknown as LeafCueDatabase, validated, {
      remapIds: false,
    });
  });

  return counts;
}

/**
 * Merge import: appends plant data from the payload, remapping IDs to avoid
 * collisions. Existing settings and onboarding state are preserved.
 */
export function importBackupMerge(
  db: LeafCueDatabase,
  payload: BackupPayload,
): ImportSummary {
  const validated = backupPayloadSchema.parse(payload);
  const counts: ImportSummary = previewBackupCounts(validated);

  // Restore bundled photo files to the device first.
  restorePhotoFiles(validated);

  db.transaction((tx) => {
    insertAll(tx as unknown as LeafCueDatabase, validated, {
      remapIds: true,
    });
  });

  return counts;
}

type InsertOptions = { remapIds: boolean };

function insertAll(
  db: LeafCueDatabase,
  payload: BackupPayload,
  options: InsertOptions,
): void {
  const remap = makeEmptyRemap();
  const t = payload.tables;

  // Plant presets (dedupe by common+scientific when merging).
  for (const row of t.plantPresets) {
    const oldId = getNumber(row, "id");
    const commonName = getString(row, "commonName");
    if (commonName === null) continue;
    const insertValues = {
      commonName,
      scientificName: getNullableString(row, "scientificName"),
      careDifficulty:
        (getNullableString(row, "careDifficulty") as
          | "easy"
          | "moderate"
          | "hard"
          | null) ?? undefined,
      light: getNullableString(row, "light"),
      water: getNullableString(row, "water"),
      humidity: getNullableString(row, "humidity"),
      temperature: getNullableString(row, "temperature"),
      soil: getNullableString(row, "soil"),
      fertilizer: getNullableString(row, "fertilizer"),
      petToxicity:
        (getNullableString(row, "petToxicity") as
          | "non-toxic"
          | "toxic-pets"
          | "toxic-children"
          | "toxic-all"
          | "unknown"
          | null) ?? undefined,
      careSummary: getNullableString(row, "careSummary"),
    };
    const inserted = db
      .insert(plantPresets)
      .values(insertValues)
      .onConflictDoNothing()
      .returning({ id: plantPresets.id })
      .get();
    if (oldId !== null && inserted) {
      remap.presets.set(oldId, inserted.id);
    }
  }

  // Rooms
  for (const row of t.rooms) {
    const oldId = getNumber(row, "id");
    const name = getString(row, "name");
    if (name === null) continue;
    const inserted = db
      .insert(rooms)
      .values({
        name,
        icon: getNullableString(row, "icon"),
        sortOrder: getNumber(row, "sortOrder") ?? 0,
      })
      .returning({ id: rooms.id })
      .get();
    if (oldId !== null && inserted) {
      remap.rooms.set(oldId, inserted.id);
    }
  }

  // Shelves
  for (const row of t.shelves) {
    const oldId = getNumber(row, "id");
    const name = getString(row, "name");
    const oldRoomId = getNumber(row, "roomId");
    if (name === null || oldRoomId === null) continue;
    const newRoomId = options.remapIds
      ? (remap.rooms.get(oldRoomId) ?? null)
      : oldRoomId;
    if (newRoomId === null) continue;
    const inserted = db
      .insert(shelves)
      .values({
        name,
        roomId: newRoomId,
        icon: getNullableString(row, "icon"),
        sortOrder: getNumber(row, "sortOrder") ?? 0,
      })
      .returning({ id: shelves.id })
      .get();
    if (oldId !== null && inserted) {
      remap.shelves.set(oldId, inserted.id);
    }
  }

  // Plants
  for (const row of t.plants) {
    const oldId = getNumber(row, "id");
    const nickname = getString(row, "nickname");
    if (nickname === null) continue;
    const oldRoomId = getNumber(row, "roomId");
    const oldShelfId = getNumber(row, "shelfId");
    const oldPresetId = getNumber(row, "speciesPresetId");
    const newRoomId =
      oldRoomId === null
        ? null
        : options.remapIds
          ? (remap.rooms.get(oldRoomId) ?? null)
          : oldRoomId;
    const newShelfId =
      oldShelfId === null
        ? null
        : options.remapIds
          ? (remap.shelves.get(oldShelfId) ?? null)
          : oldShelfId;
    const newPresetId =
      oldPresetId === null
        ? null
        : options.remapIds
          ? (remap.presets.get(oldPresetId) ?? null)
          : oldPresetId;
    const inserted = db
      .insert(plants)
      .values({
        nickname,
        commonName: getNullableString(row, "commonName"),
        scientificName: getNullableString(row, "scientificName"),
        speciesPresetId: newPresetId,
        photoUri: getNullableString(row, "photoUri"),
        roomId: newRoomId,
        shelfId: newShelfId,
        notes: getNullableString(row, "notes"),
        acquiredAt: getDate(row, "acquiredAt"),
        archivedAt: getDate(row, "archivedAt"),
        isFavorite: getBool(row, "isFavorite") ?? false,
      })
      .returning({ id: plants.id })
      .get();
    if (oldId !== null && inserted) {
      remap.plants.set(oldId, inserted.id);
    }
  }

  // Photos: URIs point to bundled photo files that were restored above.
  for (const row of t.plantPhotos) {
    const oldPlantId = getNumber(row, "plantId");
    const uri = getString(row, "uri");
    if (oldPlantId === null || uri === null) continue;
    const newPlantId = options.remapIds
      ? (remap.plants.get(oldPlantId) ?? null)
      : oldPlantId;
    if (newPlantId === null) continue;
    db.insert(plantPhotos)
      .values({
        plantId: newPlantId,
        uri,
        caption: getNullableString(row, "caption"),
        takenAt: getDate(row, "takenAt") ?? new Date(),
        type:
          (getNullableString(row, "type") as
            | "cover"
            | "journal"
            | "growth"
            | "health"
            | "other"
            | null) ?? "journal",
      })
      .run();
  }

  // Care task templates: dedupe by `key`.
  for (const row of t.careTaskTemplates) {
    const oldId = getNumber(row, "id");
    const key = getString(row, "key");
    const name = getString(row, "name");
    if (key === null || name === null) continue;
    db.insert(careTaskTemplates)
      .values({
        // biome-ignore lint/suspicious/noExplicitAny: enum widened by JSON
        key: key as any,
        name,
        icon: getNullableString(row, "icon"),
        defaultIntervalDays: getNumber(row, "defaultIntervalDays"),
        defaultInstructions: getNullableString(row, "defaultInstructions"),
        colorKey: getNullableString(row, "colorKey"),
        isBuiltIn: getBool(row, "isBuiltIn") ?? false,
      })
      .onConflictDoNothing()
      .run();
    const found = db
      .select({ id: careTaskTemplates.id })
      .from(careTaskTemplates)
      .where(sql`${careTaskTemplates.key} = ${key}`)
      .get();
    if (oldId !== null && found) {
      remap.templates.set(oldId, found.id);
    }
  }

  // Plant task schedules
  for (const row of t.plantTaskSchedules) {
    const oldId = getNumber(row, "id");
    const oldPlantId = getNumber(row, "plantId");
    if (oldPlantId === null) continue;
    const newPlantId = options.remapIds
      ? (remap.plants.get(oldPlantId) ?? null)
      : oldPlantId;
    if (newPlantId === null) continue;
    const oldTemplateId = getNumber(row, "templateId");
    const newTemplateId =
      oldTemplateId === null
        ? null
        : options.remapIds
          ? (remap.templates.get(oldTemplateId) ?? null)
          : oldTemplateId;
    const inserted = db
      .insert(plantTaskSchedules)
      .values({
        plantId: newPlantId,
        templateId: newTemplateId,
        customName: getNullableString(row, "customName"),
        intervalDays: getNumber(row, "intervalDays"),
        nextDueAt: getDate(row, "nextDueAt"),
        lastCompletedAt: getDate(row, "lastCompletedAt"),
        snoozedUntil: getDate(row, "snoozedUntil"),
        isEnabled: getBool(row, "isEnabled") ?? true,
        instructions: getNullableString(row, "instructions"),
        // Notification IDs are device-bound; clear them so they get re-synced.
        notificationId: null,
        preferredHour: getNumber(row, "preferredHour"),
        preferredMinute: getNumber(row, "preferredMinute"),
      })
      .returning({ id: plantTaskSchedules.id })
      .get();
    if (oldId !== null && inserted) {
      remap.schedules.set(oldId, inserted.id);
    }
  }

  // Care logs
  for (const row of t.careLogs) {
    const oldPlantId = getNumber(row, "plantId");
    const type = getString(row, "type");
    if (oldPlantId === null || type === null) continue;
    const newPlantId = options.remapIds
      ? (remap.plants.get(oldPlantId) ?? null)
      : oldPlantId;
    if (newPlantId === null) continue;
    const oldScheduleId = getNumber(row, "scheduleId");
    const oldTemplateId = getNumber(row, "templateId");
    db.insert(careLogs)
      .values({
        plantId: newPlantId,
        scheduleId:
          oldScheduleId === null
            ? null
            : options.remapIds
              ? (remap.schedules.get(oldScheduleId) ?? null)
              : oldScheduleId,
        templateId:
          oldTemplateId === null
            ? null
            : options.remapIds
              ? (remap.templates.get(oldTemplateId) ?? null)
              : oldTemplateId,
        type,
        title: getNullableString(row, "title"),
        notes: getNullableString(row, "notes"),
        completedAt: getDate(row, "completedAt") ?? new Date(),
        amount: getNumber(row, "amount"),
        unit: getNullableString(row, "unit"),
      })
      .run();
  }

  // Journal entries
  for (const row of t.journalEntries) {
    const body = getString(row, "body");
    if (body === null) continue;
    const oldPlantId = getNumber(row, "plantId");
    const newPlantId =
      oldPlantId === null
        ? null
        : options.remapIds
          ? (remap.plants.get(oldPlantId) ?? null)
          : oldPlantId;
    db.insert(journalEntries)
      .values({
        plantId: newPlantId,
        title: getNullableString(row, "title"),
        body,
        mood: getNullableString(row, "mood"),
        // biome-ignore lint/suspicious/noExplicitAny: enum widened by JSON
        entryType: (getNullableString(row, "entryType") as any) ?? "note",
        photoUri: getNullableString(row, "photoUri"),
      })
      .run();
  }

  // Growth measurements
  for (const row of t.growthMeasurements) {
    const oldPlantId = getNumber(row, "plantId");
    if (oldPlantId === null) continue;
    const newPlantId = options.remapIds
      ? (remap.plants.get(oldPlantId) ?? null)
      : oldPlantId;
    if (newPlantId === null) continue;
    db.insert(growthMeasurements)
      .values({
        plantId: newPlantId,
        measuredAt: getDate(row, "measuredAt") ?? new Date(),
        heightCm: getNumber(row, "heightCm"),
        leafCount: getNumber(row, "leafCount"),
        bloomCount: getNumber(row, "bloomCount"),
        notes: getNullableString(row, "notes"),
      })
      .run();
  }

  // Health observations
  for (const row of t.healthObservations) {
    const oldPlantId = getNumber(row, "plantId");
    const issueType = getString(row, "issueType");
    const severity = getString(row, "severity");
    if (oldPlantId === null || issueType === null || severity === null)
      continue;
    const newPlantId = options.remapIds
      ? (remap.plants.get(oldPlantId) ?? null)
      : oldPlantId;
    if (newPlantId === null) continue;
    db.insert(healthObservations)
      .values({
        plantId: newPlantId,
        observedAt: getDate(row, "observedAt") ?? new Date(),
        issueType,
        // biome-ignore lint/suspicious/noExplicitAny: enum widened by JSON
        severity: severity as any,
        notes: getNullableString(row, "notes"),
        // biome-ignore lint/suspicious/noExplicitAny: enum widened by JSON
        status: (getNullableString(row, "status") as any) ?? "active",
      })
      .run();
  }

  // Restore settings + onboarding state on replace import.
  if (!options.remapIds) {
    for (const row of payload.settings) {
      db.insert(appSettings)
        .values({
          key: row.key,
          value: row.value,
          updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(),
        })
        .onConflictDoUpdate({
          target: appSettings.key,
          set: { value: row.value, updatedAt: new Date() },
        })
        .run();
    }
    for (const row of payload.onboardingState) {
      db.insert(onboardingState)
        .values({
          key: row.key,
          value: row.value,
          updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(),
        })
        .onConflictDoUpdate({
          target: onboardingState.key,
          set: { value: row.value, updatedAt: new Date() },
        })
        .run();
    }
  }
}

function getNumber(row: Record<string, unknown>, key: string): number | null {
  const v = row[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

function getString(row: Record<string, unknown>, key: string): string | null {
  const v = row[key];
  if (typeof v === "string") return v;
  return null;
}

function getNullableString(
  row: Record<string, unknown>,
  key: string,
): string | null {
  const v = row[key];
  if (typeof v === "string") return v;
  return null;
}

function getBool(row: Record<string, unknown>, key: string): boolean | null {
  const v = row[key];
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  return null;
}

function getDate(row: Record<string, unknown>, key: string): Date | null {
  const v = row[key];
  if (typeof v === "string") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return new Date(v);
  }
  if (v instanceof Date) return v;
  return null;
}

type RemapResult = {
  rooms: Map<number, number>;
  shelves: Map<number, number>;
  plants: Map<number, number>;
  presets: Map<number, number>;
  templates: Map<number, number>;
  schedules: Map<number, number>;
};

function makeEmptyRemap(): RemapResult {
  return {
    rooms: new Map(),
    shelves: new Map(),
    plants: new Map(),
    presets: new Map(),
    templates: new Map(),
    schedules: new Map(),
  };
}
